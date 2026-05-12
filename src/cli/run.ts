import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { loadArchitectureConfigFile } from "../config/load-config-file.js";
import { resolveToValidatedArchitecture } from "../config/resolve-validated.js";
import { findConfigPath } from "../config/config-discovery.js";
import { findAllLayerlockConfigFiles } from "../config/discover-configs.js";
import { validateArchitecture } from "../analysis/validate-project.js";
import { formatJsonReport, formatTextReport } from "../report/format-report.js";
import { layerEdgesToDot, layerEdgesToMermaid } from "../report/layer-graph.js";
import { LayerlockError } from "../errors.js";
import type { ValidatedArchitecture } from "../config/model.js";
import type { ValidateResult } from "../types.js";
import type { CliOptions } from "./parse-args.js";

const DISCOVER_CONCURRENCY = 6;

const DEFAULT_GRAPH_MERMAID = "layerlock-layers.mmd";
const DEFAULT_GRAPH_DOT = "layerlock-layers.dot";

async function mapPool<T>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const i = idx++;
      if (i >= items.length) return;
      await fn(items[i]!);
    }
  });
  await Promise.all(workers);
}

export interface RunCheckOnceResult {
  result: ValidateResult;
  validated: ValidatedArchitecture;
  configPath: string;
}

export async function runCheckOnce(configPathAbs: string): Promise<RunCheckOnceResult> {
  const raw = await loadArchitectureConfigFile(configPathAbs);
  const validated = resolveToValidatedArchitecture(raw, configPathAbs);
  const result = validateArchitecture(validated);
  return { result, validated, configPath: configPathAbs };
}

function resolveGraphOutPath(cwd: string, projectRoot: string, opts: CliOptions): string {
  if (opts.graphOut) return path.resolve(cwd, opts.graphOut);
  const name = opts.graph === "dot" ? DEFAULT_GRAPH_DOT : DEFAULT_GRAPH_MERMAID;
  return path.join(path.resolve(projectRoot), name);
}

function writeGraph(cwd: string, projectRoot: string, opts: CliOptions, result: ValidateResult): void {
  if (opts.graph === "none") return;
  const body = opts.graph === "dot" ? layerEdgesToDot(result.layerEdges) : layerEdgesToMermaid(result.layerEdges);
  const outPath = resolveGraphOutPath(cwd, projectRoot, opts);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body, "utf8");
  const cwdAbs = path.resolve(cwd);
  const rel = path.relative(cwdAbs, outPath);
  const display = rel && !rel.startsWith("..") ? rel : outPath;
  process.stderr.write(`layerlock: wrote ${opts.graph} layer graph to ${display}\n`);
}

async function runSinglePackage(cwd: string, opts: CliOptions): Promise<number> {
  const configPath = opts.configPath ? path.resolve(cwd, opts.configPath) : findConfigPath(cwd);
  if (!configPath) {
    throw new LayerlockError(
      "NO_CONFIG",
      "No architecture config found. Create layerlock.config.ts (or legacy arch.config.ts), or pass --config.",
    );
  }

  if (opts.graph !== "none" && opts.watch) {
    throw new LayerlockError("INVALID_CLI", "--graph is not supported together with --watch.");
  }

  const { result, validated } = await runCheckOnce(configPath);
  const formatOpts = { stable: opts.stable || opts.ciDiff, ciDiff: opts.ciDiff };

  if (opts.format === "json") {
    process.stdout.write(formatJsonReport(result, validated.root, formatOpts));
  } else {
    process.stdout.write(formatTextReport(result, validated.root, formatOpts));
  }

  writeGraph(cwd, validated.root, opts, result);

  const failed = result.violations.length > 0 || result.unassignedIssues.length > 0;
  return failed ? 1 : 0;
}

function discoverSectionLabel(cwd: string, configPathAbs: string, ciDiff: boolean): string {
  const cwdAbs = path.resolve(cwd);
  const cfgAbs = path.resolve(configPathAbs);
  const rel = path.relative(cwdAbs, cfgAbs);
  const posix = (s: string) => s.replace(/\\/g, "/");
  if (rel && !rel.startsWith("..")) return ciDiff ? posix(rel) : rel;
  return ciDiff ? posix(cfgAbs) : configPathAbs;
}

async function runDiscover(cwd: string, opts: CliOptions): Promise<number> {
  if (opts.graph !== "none") {
    throw new LayerlockError(
      "INVALID_CLI",
      "Layer graph output is only supported for single-package runs (omit --discover or pass --config).",
    );
  }

  const configs = findAllLayerlockConfigFiles(cwd);
  if (configs.length === 0) {
    throw new LayerlockError("NO_CONFIG", `No layerlock.config.* or arch.config.* files found under ${cwd}.`);
  }

  const formatOpts = { stable: opts.stable || opts.ciDiff, ciDiff: opts.ciDiff };
  let worst = 0;

  await mapPool(configs, DISCOVER_CONCURRENCY, async (configPathAbs) => {
    const { result, validated } = await runCheckOnce(configPathAbs);
    const failed = result.violations.length > 0 || result.unassignedIssues.length > 0;
    if (failed) worst = 1;

    const header = `\n=== ${discoverSectionLabel(cwd, configPathAbs, opts.ciDiff)} ===\n`;
    process.stdout.write(header);
    if (opts.format === "json") {
      process.stdout.write(formatJsonReport(result, validated.root, formatOpts));
    } else {
      process.stdout.write(formatTextReport(result, validated.root, formatOpts));
    }
  });

  return worst;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

async function runWithWatch(cwd: string, run: () => Promise<number>): Promise<void> {
  await run();
  const debounced = debounce(() => {
    void (async () => {
      try {
        process.stdout.write("\n[layerlock] Re-running...\n\n");
        const code = await run();
        process.stdout.write(`[layerlock] Done (exit ${String(code)}).\n`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        process.stderr.write(`[layerlock] Error: ${message}\n`);
      }
    })();
  }, 350);

  const ignored = (p: string) =>
    /node_modules|\.git|\/dist\/|\.turbo|\/\.nx\/|\/coverage\//.test(p.replace(/\\/g, "/"));

  const watcher = chokidar.watch(cwd, {
    ignoreInitial: true,
    ignored: ignored,
    awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 50 },
  });
  watcher.on("all", debounced);
  await new Promise<void>(() => {});
}

/**
 * @returns Process exit code (0 = success, 1 = violations or failure). Never resolves when `--watch` is set.
 */
export async function runCli(cwd: string, opts: CliOptions): Promise<number> {
  if (opts.help) {
    return 0;
  }

  const runBody = async (): Promise<number> => {
    if (opts.discover) return runDiscover(cwd, opts);
    return runSinglePackage(cwd, opts);
  };

  if (opts.watch) {
    await runWithWatch(cwd, runBody);
    return 0;
  }

  return runBody();
}

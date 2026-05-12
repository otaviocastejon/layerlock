export type OutputFormat = "text" | "json";
export type GraphFormat = "none" | "mermaid" | "dot";

export interface CliOptions {
  configPath?: string;
  format: OutputFormat;
  graph: GraphFormat;
  graphOut?: string;
  help: boolean;
  /** Discover every layerlock.config.* / arch.config.* under cwd and validate each package in parallel batches. */
  discover: boolean;
  /** Re-run validation when source or config files change (opt-in daemon mode). */
  watch: boolean;
  /** Stable ordering for violations / JSON / layer edges (diff-friendly CI logs). */
  stable: boolean;
  /**
   * CI-oriented report: implies stable ordering, POSIX + repo-relative paths, deterministic JSON keys.
   */
  ciDiff: boolean;
}

export interface InitCliOptions {
  flavor: "nest" | "clean" | "hexagonal";
  force: boolean;
  help: boolean;
}

export interface ExplainCliOptionsParsed {
  from: string;
  to: string;
  configPath?: string;
  help: boolean;
}

export type ParsedCli =
  | { kind: "check"; options: CliOptions }
  | { kind: "init"; options: InitCliOptions }
  | { kind: "explain"; options: ExplainCliOptionsParsed };

export function parseArgv(argv: string[]): ParsedCli {
  const args = argv.slice();
  // Strip one or more leading "check" / "validate" tokens so `layerlock check -f json` works, and
  // `npm run layerlock check` does not break when package.json uses `"layerlock": "layerlock check"`.
  while (args[0] === "check" || args[0] === "validate") {
    args.shift();
  }
  if (args[0] === "init") {
    return { kind: "init", options: parseInitArgs(args.slice(1)) };
  }
  if (args[0] === "explain") {
    return { kind: "explain", options: parseExplainArgs(args.slice(1)) };
  }
  return { kind: "check", options: parseCliArgs(args) };
}

export function parseExplainArgs(argv: string[]): ExplainCliOptionsParsed {
  let configPath: string | undefined;
  let help = false;
  const pos: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") help = true;
    else if (a === "--config" || a === "-c") {
      configPath = argv[++i];
      if (!configPath) throw new Error("--config requires a path.");
    } else if (a.startsWith("-")) {
      throw new Error(`Unknown explain option: ${a}`);
    } else {
      pos.push(a);
    }
  }

  if (help) {
    return { from: "", to: "", help: true };
  }
  if (pos.length !== 2) {
    throw new Error('layerlock explain: provide exactly two file paths (try: layerlock explain --help).');
  }
  return { from: pos[0]!, to: pos[1]!, configPath, help: false };
}

export function parseInitArgs(argv: string[]): InitCliOptions {
  let nest = false;
  let clean = false;
  let hexagonal = false;
  let force = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") help = true;
    else if (a === "--nest") nest = true;
    else if (a === "--clean" || a === "--clean-arch") clean = true;
    else if (a === "--hexagonal") hexagonal = true;
    else if (a === "--force") force = true;
    else if (a.startsWith("-")) throw new Error(`Unknown init option: ${a}`);
    else throw new Error(`Unexpected init argument: ${a}. Use --nest, --clean, --clean-arch, or --hexagonal.`);
  }

  if (help) {
    return { flavor: "nest", force: false, help: true };
  }

  const flavorCount = Number(nest) + Number(clean) + Number(hexagonal);
  if (flavorCount !== 1) {
    throw new Error(
      'layerlock init: pass exactly one of --nest | --clean | --clean-arch | --hexagonal (try: layerlock init --help).',
    );
  }

  const flavor = nest ? "nest" : hexagonal ? "hexagonal" : "clean";
  return { flavor, force, help: false };
}

export function parseCliArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    format: "text",
    graph: "none",
    help: false,
    discover: false,
    watch: false,
    stable: false,
    ciDiff: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--format" || a === "-f") {
      const v = argv[++i];
      if (v === "text" || v === "json") opts.format = v;
      else throw new Error(`Invalid --format: ${String(v)}. Use text or json.`);
    } else if (a === "--config" || a === "-c") {
      opts.configPath = argv[++i];
      if (!opts.configPath) throw new Error("--config requires a path.");
    } else if (a === "--graph") {
      const v = argv[++i];
      if (v === "mermaid" || v === "dot" || v === "none") opts.graph = v;
      else throw new Error(`Invalid --graph: ${String(v)}. Use mermaid, dot, or none.`);
    } else if (a === "--graph-out") {
      opts.graphOut = argv[++i];
      if (!opts.graphOut) throw new Error("--graph-out requires a path.");
    } else if (a === "--discover") opts.discover = true;
    else if (a === "--watch") opts.watch = true;
    else if (a === "--stable") opts.stable = true;
    else if (a === "--ci-diff") opts.ciDiff = true;
    else if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      throw new Error(
        `Unexpected argument: ${a}. For scaffolding run: layerlock init --nest | layerlock init --clean`,
      );
    }
  }
  if (opts.discover && opts.configPath) {
    throw new Error("Use either --discover (scan cwd) or --config <path>, not both.");
  }
  return opts;
}

export function printCliHelp(): void {
  const msg = `layerlock (Layer Lock) - static architecture / layer boundary validation for TypeScript.

Usage:
  layerlock [check] [options]     Validate the project (default; "check" is optional)
  layerlock init --nest|--clean|--clean-arch|--hexagonal    Scaffold layerlock.config.ts + src/ layer folders
  layerlock explain <from.ts> <to.ts> [--config path]   Print layers + whether the import edge is allowed

Validate options:
  -c, --config <path>   Path to layerlock.config.ts or legacy arch.config.ts (default: search upward from cwd)
      --discover        Find every layerlock.config.* / arch.config.* under cwd and validate each package (parallel batches)
      --watch           Re-run on file changes under the watched tree (opt-in; does not exit)
      --stable          Deterministic ordering for violations / JSON (diff-friendly CI logs)
      --ci-diff         Stricter CI mode: stable + POSIX/repo-relative paths + deterministic JSON key order
  -f, --format <fmt>    text | json (default: text)
      --graph <fmt>     none | mermaid | dot - emit aggregated layer graph (single-package runs only)
      --graph-out <path> Optional; default writes under project root: layerlock-layers.mmd or .dot
  -h, --help            Show this help

Explain:
  layerlock explain src/a.ts src/b.ts
  layerlock explain packages/foo/src/x.ts packages/foo/src/y.ts -c packages/foo/layerlock.config.ts

Init options:
  layerlock init --nest        Four-layer preset + test/e2e exceptions (great for Nest-style apps)
  layerlock init --clean       Four-layer preset without default test exceptions
  layerlock init --clean-arch  Same as --clean (clean architecture preset)
  layerlock init --hexagonal   Ports-and-adapters preset (domain, ports, application, adapters)
      --force                   Overwrite existing layerlock.config.ts
  layerlock init -h            Init help

Exit codes (validate):
  0  OK
  1  Violations or configuration error

Exit codes (explain):
  0  Allowed or could not classify
  1  Forbidden cannotImport edge
`;
  process.stdout.write(msg);
}

export function printExplainHelp(): void {
  const msg = `layerlock explain - classify an import edge between two on-disk TypeScript files.

Usage:
  layerlock explain <fromFile> <toFile> [--config path]

Resolves the nearest layerlock.config.ts or arch.config.ts (from the first file's directory, then cwd) unless --config is set.
Prints each file's assigned layer and whether a cannotImport rule forbids fromLayer -> toLayer for the source path.

Exit code 1 means the edge is forbidden; 0 means allowed or unassigned (see stdout).
`;
  process.stdout.write(msg);
}

export function printInitHelp(): void {
  const msg = `layerlock init - scaffold layerlock.config.ts and default layer folders.

Usage:
  layerlock init --nest [--force]
  layerlock init --clean [--force]
  layerlock init --clean-arch [--force]
  layerlock init --hexagonal [--force]

  --nest         Use presets.nestRecommended() (onion layers + default test file exceptions)
  --clean        Use presets.cleanArchitectureFourLayer() (same folders, stricter rules in tests)
  --clean-arch   Alias for --clean
  --hexagonal    Use presets.hexagonal() (domain, ports, application, adapters + infrastructure)
  --force        Overwrite layerlock.config.ts if it already exists

Creates:
  layerlock.config.ts
  --nest / --clean / --clean-arch: src/domain/, src/use-cases/, src/application/, src/infrastructure/, src/presentation/, src/api/
  --hexagonal: src/domain/, src/ports/, src/application/, src/adapters/, src/infrastructure/
  (each with .gitkeep)

If no tsconfig.json exists, a minimal one is added so you can run TypeScript and layerlock quickly.
`;
  process.stdout.write(msg);
}

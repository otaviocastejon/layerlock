import path from "node:path";
import { LayerlockError } from "../errors.js";
import { assignLayer } from "../analysis/assign-layer.js";
import { isForbiddenCannotImport } from "../analysis/forbidden-imports.js";
import { relativePosixWithinRoot } from "../analysis/path-globs.js";
import { findConfigPath } from "../config/config-discovery.js";
import { loadArchitectureConfigFile } from "../config/load-config-file.js";
import { resolveToValidatedArchitecture } from "../config/resolve-validated.js";

export interface ExplainCliOptions {
  from: string;
  to: string;
  configPath?: string;
}

/**
 * Prints whether an import from `from` to `to` would violate `cannotImport` rules for the resolved config.
 * @returns Process exit code (1 = forbidden edge, 0 = allowed or informational).
 */
export async function runExplain(cwd: string, opts: ExplainCliOptions): Promise<number> {
  const fromAbs = path.resolve(cwd, opts.from);
  const toAbs = path.resolve(cwd, opts.to);

  const configPath = opts.configPath
    ? path.resolve(cwd, opts.configPath)
    : findConfigPath(path.dirname(fromAbs)) ?? findConfigPath(cwd);

  if (!configPath) {
    throw new LayerlockError(
      "NO_CONFIG",
      "No architecture config found. Create layerlock.config.ts or pass --config.",
    );
  }

  const raw = await loadArchitectureConfigFile(configPath);
  const validated = resolveToValidatedArchitecture(raw, configPath);
  const root = validated.root;

  const fromLayer = assignLayer(fromAbs, root, validated.layers);
  const toLayer = assignLayer(toAbs, root, validated.layers);
  const fromRel = relativePosixWithinRoot(root, fromAbs);

  const lines: string[] = [];
  lines.push(`config: ${configPath}`);
  lines.push(`root:   ${root}`);
  lines.push(`from:   ${fromAbs}`);
  lines.push(`  layer: ${fromLayer ?? "(unassigned: no layer glob matched)"}`);
  lines.push(`to:     ${toAbs}`);
  lines.push(`  layer: ${toLayer ?? "(unassigned: no layer glob matched)"}`);

  if (fromLayer === null || toLayer === null || fromRel === null) {
    lines.push("");
    lines.push("Edge: cannot evaluate forbidden import (assign both files to layers under root).");
    process.stdout.write(`${lines.join("\n")}\n`);
    return 0;
  }

  const forbidden = isForbiddenCannotImport(validated.rules, fromLayer, toLayer, fromRel);
  lines.push("");
  lines.push(`Import edge: ${fromLayer} -> ${toLayer}`);
  lines.push(forbidden ? "Result: FORBIDDEN by a cannotImport rule." : "Result: allowed (no matching cannotImport rule).");
  process.stdout.write(`${lines.join("\n")}\n`);
  return forbidden ? 1 : 0;
}

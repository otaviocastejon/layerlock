import path from "node:path";
import { LayerlockError } from "../errors.js";
import { findConfigPath } from "../config/config-discovery.js";
import { loadArchitectureConfigFile } from "../config/load-config-file.js";
import { resolveToValidatedArchitecture } from "../config/resolve-validated.js";
import { validateArchitecture } from "../analysis/validate-project.js";
import type { ValidatedArchitecture } from "../config/model.js";
import type { ValidateResult } from "../types.js";
import { formatTextReport } from "../report/format-report.js";
import type { FormatReportOptions } from "../report/format-report.js";

export interface LayerlockCheckOptions {
  /** Directory to search for a config file (default: `process.cwd()`). */
  cwd?: string;
  /** Explicit config path; resolved relative to `cwd` when not absolute. */
  configPath?: string;
}

export interface LayerlockCheckResult {
  ok: boolean;
  result: ValidateResult;
  /** Fully resolved configuration (including absolute `root`). */
  validated: ValidatedArchitecture;
  /** Absolute path to the loaded config file. */
  configPath: string;
}

/**
 * End-to-end check used by scripts and tests: discover (or pin) config, resolve roots, run analysis.
 *
 * @example
 * ```ts
 * const run = await layerlockCheck();
 * if (!run.ok) {
 *   console.error(formatLayerlockText(run));
 *   process.exit(1);
 * }
 * ```
 */
export async function layerlockCheck(options?: LayerlockCheckOptions): Promise<LayerlockCheckResult> {
  const cwd = options?.cwd ?? process.cwd();
  const configPath = options?.configPath
    ? path.resolve(cwd, options.configPath)
    : findConfigPath(cwd);

  if (!configPath) {
    throw new LayerlockError(
      "NO_CONFIG",
      "No architecture config found. Add layerlock.config.ts (or legacy arch.config.ts) next to your tsconfig (or pass configPath).",
    );
  }

  const raw = await loadArchitectureConfigFile(configPath);
  const validated = resolveToValidatedArchitecture(raw, configPath);
  const result = validateArchitecture(validated);
  const ok = result.violations.length === 0 && result.unassignedIssues.length === 0;
  return { ok, result, validated, configPath };
}

/** Human-readable report for a `layerlockCheck()` result (paths shortened relative to project root). */
export function formatLayerlockText(run: LayerlockCheckResult, options?: FormatReportOptions): string {
  return formatTextReport(run.result, run.validated.root, options);
}

/** @deprecated Use {@link LayerlockCheckOptions} */
export type ArchCheckOptions = LayerlockCheckOptions;
/** @deprecated Use {@link LayerlockCheckResult} */
export type ArchCheckRun = LayerlockCheckResult;
/** @deprecated Use {@link layerlockCheck} */
export const archCheck = layerlockCheck;
/** @deprecated Use {@link formatLayerlockText} */
export const formatArchCheckText = formatLayerlockText;

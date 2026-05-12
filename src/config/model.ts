import type { ArchitectureRule } from "../types.js";

/** What you author in `layerlock.config.ts` (and what `loadArchitectureConfigFile` returns). */
export interface DefineArchitectureInput {
  /**
   * Filesystem root for layer globs and tsconfig resolution.
   * Omit in `layerlock.config.ts` so the CLI (or `layerlockCheck()`) defaults to the config file directory.
   */
  root?: string;
  /** Path to `tsconfig.json`, relative to `root` or absolute. */
  tsconfig?: string;
  /** Layer id → picomatch patterns relative to `root`. */
  layers: Record<string, string[]>;
  /** Rules produced by `layer()`. */
  rules: ArchitectureRule[];
  /** Files that match no layer: ignore (default) or fail validation. */
  unassigned?: "ignore" | "error";
  /**
   * Picomatch patterns (relative to `root`) for source files **skipped entirely**
   * (no violations, no layer edges, not counted as unassigned). Use for generated code, etc.
   */
  ignoreFileGlobs?: readonly string[];
}

/** Validated shape after `defineArchitecture()`. `root` may still be unset until the CLI merges paths. */
export interface ResolvedArchitecture extends Required<Pick<DefineArchitectureInput, "layers" | "rules">> {
  root?: string;
  tsconfig: string;
  unassigned: "ignore" | "error";
  ignoreFileGlobs?: readonly string[];
}

/** Fully resolved project root — required input for static analysis. */
export type ValidatedArchitecture = Omit<ResolvedArchitecture, "root"> & { root: string };

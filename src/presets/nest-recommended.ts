import type { DefineArchitectureInput } from "../config/model.js";
import type { ArchitectureRule } from "../types.js";
import { cleanArchitectureFourLayer } from "./clean-architecture.js";
import type { CleanArchitectureFourLayerOptions } from "./clean-architecture.js";

export interface NestRecommendedOptions extends CleanArchitectureFourLayerOptions {
  /**
   * When true (default), common test/e2e globs are appended to each `cannotImport` rule’s
   * `exceptFromGlobs` so specs can import modules production code cannot.
   */
  relaxRulesInTests?: boolean;
  /** Merged after any per-rule `exceptFromGlobs` when `relaxRulesInTests` is true. */
  testFileGlobs?: readonly string[];
}

const DEFAULT_TEST_GLOBS: readonly string[] = [
  "**/*.spec.ts",
  "**/*.test.ts",
  "**/__tests__/**/*.ts",
  "test/**/*.ts",
  "e2e/**/*.ts",
];

/**
 * Nest-friendly starting point: same onion layers as {@link cleanArchitectureFourLayer},
 * plus **sensible test exceptions** so `*.spec.ts` / `e2e` can compose Nest testing modules
 * without copying `exceptFrom` onto every rule by hand.
 *
 * Align your real folders with the globs, or override `globs` / `testFileGlobs` to match your repo.
 */
export function nestRecommended(options: NestRecommendedOptions = {}): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const core = cleanArchitectureFourLayer(options);
  const relax = options.relaxRulesInTests !== false;
  if (!relax) return core;

  const extra = options.testFileGlobs ?? DEFAULT_TEST_GLOBS;
  const rules: ArchitectureRule[] = core.rules.map((r) => {
    if (r.kind !== "cannotImport") return r;
    const merged = [...(r.exceptFromGlobs ?? []), ...extra];
    return { ...r, exceptFromGlobs: merged };
  });
  return { layers: core.layers, rules };
}

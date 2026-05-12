/**
 * Public surface for **Layer Lock** (`layerlock` on npm).
 *
 * Most teams only need:
 * - `layerlock.config.ts` exporting `defineArchitecture(...)` (legacy `arch.config.ts` is still discovered)
 * - `npx layerlock` in CI
 *
 * For scripts/tests, prefer `layerlockCheck()` over re-wiring loaders yourself.
 */

// --- Presets + AI-oriented authoring helpers ---
export {
  ARCH_CHECK_AI_CONFIG_GUIDE,
  LAYERLOCK_AI_CONFIG_GUIDE,
  cleanArchitectureFourLayer,
  dddLite,
  hexagonal,
  layeredFromInnerToOuter,
  nestRecommended,
  nxStyle,
  presets,
} from "./presets/index.js";
export type {
  CleanArchitectureFourLayerOptions,
  CleanArchitectureLayerId,
  DddLiteLayerId,
  DddLiteOptions,
  HexagonalLayerId,
  HexagonalOptions,
  LayeredFromInnerToOuterOptions,
  NestRecommendedOptions,
  NxStyleLayerId,
  NxStyleOptions,
} from "./presets/index.js";

// --- One-call workflow (scripts / tests) ---
export {
  archCheck,
  formatArchCheckText,
  formatLayerlockText,
  layerlockCheck,
} from "./public-api/layerlock-check.js";
export type {
  ArchCheckOptions,
  ArchCheckRun,
  LayerlockCheckOptions,
  LayerlockCheckResult,
} from "./public-api/layerlock-check.js";

// --- Config discovery (tooling integrations) ---
export { CONFIG_FILE_NAMES, findConfigPath } from "./config/config-discovery.js";
export { findAllArchConfigFiles, findAllLayerlockConfigFiles } from "./config/discover-configs.js";

// --- Config authoring (`layerlock.config.ts`) ---
export { defineArchitecture, layer, mergeForbiddenBySource } from "./config/define-architecture.js";
export { loadArchitectureConfigFile } from "./config/load-config-file.js";
export { resolveToValidatedArchitecture } from "./config/resolve-validated.js";
export type { DefineArchitectureInput, ResolvedArchitecture, ValidatedArchitecture } from "./config/model.js";
export type { LayerRuleBuilder } from "./config/define-architecture.js";

// --- Analysis (advanced / custom runners) ---
export { validateArchitecture } from "./analysis/validate-project.js";
export { assignLayer } from "./analysis/assign-layer.js";
export { collectImportSites } from "./analysis/collect-import-sites.js";

// --- Reporting ---
export {
  buildReportSummary,
  formatJsonReport,
  formatTextReport,
  sortViolationsStable,
  toPosixDisplayPath,
} from "./report/format-report.js";
export type { ReportSummary, FormatReportOptions } from "./report/format-report.js";
export { layerEdgesToDot, layerEdgesToMermaid } from "./report/layer-graph.js";

// --- Errors ---
export { ArchCheckError, LayerlockError } from "./errors.js";
export type { ArchCheckErrorCode, LayerlockErrorCode } from "./errors.js";

// --- Result types ---
export type {
  ArchitectureRule,
  CannotImportRule,
  LayerEdge,
  UnassignedFileIssue,
  ValidateResult,
  Violation,
} from "./types.js";

/** Alias for `validateArchitecture` (shorter name in scripts). */
export { validateArchitecture as validate } from "./analysis/validate-project.js";

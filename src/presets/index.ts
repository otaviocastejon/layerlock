import { cleanArchitectureFourLayer } from "./clean-architecture.js";
import { dddLite } from "./ddd-lite.js";
import { hexagonal } from "./hexagonal.js";
import { layeredFromInnerToOuter } from "./layered.js";
import { nestRecommended } from "./nest-recommended.js";
import { nxStyle } from "./nx-style.js";

export { layeredFromInnerToOuter } from "./layered.js";
export { cleanArchitectureFourLayer } from "./clean-architecture.js";
export { nestRecommended } from "./nest-recommended.js";
export { hexagonal } from "./hexagonal.js";
export { dddLite } from "./ddd-lite.js";
export { nxStyle } from "./nx-style.js";
export type { NestRecommendedOptions } from "./nest-recommended.js";
export type { CleanArchitectureFourLayerOptions, CleanArchitectureLayerId } from "./clean-architecture.js";
export type { LayeredFromInnerToOuterOptions } from "./layered.js";
export type { HexagonalLayerId, HexagonalOptions } from "./hexagonal.js";
export type { DddLiteLayerId, DddLiteOptions } from "./ddd-lite.js";
export type { NxStyleLayerId, NxStyleOptions } from "./nx-style.js";
export { LAYERLOCK_AI_CONFIG_GUIDE, ARCH_CHECK_AI_CONFIG_GUIDE } from "./ai-config-guide.js";

/** Namespaced preset helpers (easy to discover in autocompletion). */
export const presets = {
  layeredFromInnerToOuter,
  cleanArchitectureFourLayer,
  nestRecommended,
  hexagonal,
  dddLite,
  nxStyle,
} as const;

import type { DefineArchitectureInput } from "../config/model.js";
import { layeredFromInnerToOuter } from "./layered.js";

const DEFAULT_IDS = ["domain", "useCases", "infrastructure", "presentation"] as const;

export type CleanArchitectureLayerId = (typeof DEFAULT_IDS)[number];

export interface CleanArchitectureFourLayerOptions {
  /**
   * Directory under the project root that contains the four layer folders.
   * @default "src"
   */
  baseDir?: string;
  /**
   * Override globs per layer. Values replace the default single-glob convention for that layer.
   */
  globs?: Partial<Record<CleanArchitectureLayerId, readonly string[]>>;
}

/**
 * Opinionated **4-layer clean architecture** layout (names only; folders are yours):
 *
 * - `domain` — entities / value objects (innermost)
 * - `useCases` — application services / use cases
 * - `infrastructure` — DB, HTTP clients, frameworks
 * - `presentation` — HTTP handlers, UI, CLI entrypoints (outermost)
 *
 * Inner layers must not import outer layers. Adjust `globs` if your repo uses different paths.
 */
export function cleanArchitectureFourLayer(
  options: CleanArchitectureFourLayerOptions = {},
): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const base = options.baseDir ?? "src";
  const defaults: Record<CleanArchitectureLayerId, readonly string[]> = {
    domain: [`${base}/domain/**/*.ts`],
    useCases: [`${base}/use-cases/**/*.ts`, `${base}/application/**/*.ts`],
    infrastructure: [`${base}/infrastructure/**/*.ts`],
    presentation: [`${base}/presentation/**/*.ts`, `${base}/api/**/*.ts`],
  };

  const globs: Record<string, readonly string[]> = { ...defaults };
  if (options.globs) {
    for (const id of DEFAULT_IDS) {
      const override = options.globs[id];
      if (override) globs[id] = override;
    }
  }

  return layeredFromInnerToOuter({ layers: DEFAULT_IDS, globs });
}

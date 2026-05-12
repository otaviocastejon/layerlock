import type { DefineArchitectureInput } from "../config/model.js";
import { layeredFromInnerToOuter } from "./layered.js";

const LAYER_IDS = ["domain", "application", "infrastructure", "interfaces"] as const;

export type DddLiteLayerId = (typeof LAYER_IDS)[number];

export interface DddLiteOptions {
  /**
   * Directory under the project root used in default globs.
   * @default "src"
   */
  baseDir?: string;
  globs?: Partial<Record<DddLiteLayerId, readonly string[]>>;
}

/**
 * **DDD-friendly** naming on top of the same onion as clean architecture:
 *
 * - `domain` — aggregates, entities, domain events
 * - `application` — use cases / application services
 * - `infrastructure` — persistence, messaging, external systems
 * - `interfaces` — HTTP/GraphQL/CLI adapters and other delivery mechanisms
 *
 * This is a starting point; bounded contexts often need custom `globs`.
 */
export function dddLite(options: DddLiteOptions = {}): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const base = options.baseDir ?? "src";
  const defaults: Record<DddLiteLayerId, readonly string[]> = {
    domain: [`${base}/domain/**/*.ts`],
    application: [`${base}/application/**/*.ts`, `${base}/use-cases/**/*.ts`],
    infrastructure: [`${base}/infrastructure/**/*.ts`],
    interfaces: [`${base}/interfaces/**/*.ts`, `${base}/presentation/**/*.ts`, `${base}/api/**/*.ts`],
  };
  const globs: Record<string, readonly string[]> = { ...defaults };
  if (options.globs) {
    for (const id of LAYER_IDS) {
      const override = options.globs[id];
      if (override) globs[id] = override;
    }
  }
  return layeredFromInnerToOuter({ layers: [...LAYER_IDS], globs });
}

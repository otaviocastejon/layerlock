import type { DefineArchitectureInput } from "../config/model.js";
import { layeredFromInnerToOuter } from "./layered.js";

const LAYER_IDS = ["domain", "ports", "application", "adapters"] as const;

export type HexagonalLayerId = (typeof LAYER_IDS)[number];

export interface HexagonalOptions {
  /**
   * Directory under the project root that contains the hexagonal folders.
   * @default "src"
   */
  baseDir?: string;
  globs?: Partial<Record<HexagonalLayerId, readonly string[]>>;
}

/**
 * **Ports & adapters** layering (inner → outer):
 *
 * - `domain` — entities, value objects, domain services (pure core)
 * - `ports` — inbound/outbound interfaces (repository contracts, message ports)
 * - `application` — use cases / application services orchestrating ports + domain
 * - `adapters` — framework/IO implementations (DB, HTTP, queues, CLI glue)
 *
 * Dependency rule: inner layers must not import outer layers. Tune `globs` to match your tree.
 */
export function hexagonal(options: HexagonalOptions = {}): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const base = options.baseDir ?? "src";
  const defaults: Record<HexagonalLayerId, readonly string[]> = {
    domain: [`${base}/domain/**/*.ts`],
    ports: [`${base}/ports/**/*.ts`],
    application: [`${base}/application/**/*.ts`],
    adapters: [`${base}/adapters/**/*.ts`, `${base}/infrastructure/**/*.ts`],
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

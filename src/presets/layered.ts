import type { DefineArchitectureInput } from "../config/model.js";
import type { ArchitectureRule } from "../types.js";
import { layer } from "../config/define-architecture.js";

export interface LayeredFromInnerToOuterOptions {
  /**
   * Layer ids from **innermost (pure core)** → **outermost (delivery / UI / IO)**.
   * Dependency flow is assumed to point “outward”: inner layers must not import outer layers.
   */
  layers: readonly string[];
  /**
   * Picomatch patterns (relative to the project `root` in your config file) per layer id.
   */
  globs: Record<string, readonly string[]>;
}

/**
 * Builds `layers` + `cannotImport` rules for a strict **onion / clean layering** model:
 * each layer may only depend on layers **closer to the core** (to its left in `layers`).
 *
 * Example: `['domain', 'application', 'infrastructure', 'presentation']` forbids
 * `domain → application|infrastructure|presentation`, `application → infrastructure|presentation`, etc.
 */
export function layeredFromInnerToOuter(
  options: LayeredFromInnerToOuterOptions,
): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const order = options.layers;
  if (order.length === 0) {
    throw new Error("layeredFromInnerToOuter: `layers` must contain at least one layer id.");
  }

  const layers: Record<string, string[]> = {};
  for (const id of order) {
    const globs = options.globs[id];
    if (!globs || globs.length === 0) {
      throw new Error(`layeredFromInnerToOuter: missing globs for layer "${id}".`);
    }
    layers[id] = [...globs];
  }

  const rules: ArchitectureRule[] = [];
  for (let i = 0; i < order.length; i++) {
    const fromLayer = order[i]!;
    const forbidden = order.slice(i + 1);
    if (forbidden.length > 0) rules.push(layer(fromLayer).cannotImport(...forbidden));
  }

  return { layers, rules };
}

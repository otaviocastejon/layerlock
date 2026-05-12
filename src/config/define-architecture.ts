import type { ArchitectureRule, CannotImportRule } from "../types.js";
import type { DefineArchitectureInput, ResolvedArchitecture } from "./model.js";

const SUPPORTED_RULE_KINDS = new Set<ArchitectureRule["kind"]>(["cannotImport"]);

export function defineArchitecture(input: DefineArchitectureInput): ResolvedArchitecture {
  const tsconfig = input.tsconfig ?? "tsconfig.json";
  const unassigned = input.unassigned ?? "ignore";
  const layerIds = new Set(Object.keys(input.layers));

  if (layerIds.size === 0) {
    throw new Error("defineArchitecture: `layers` must define at least one layer.");
  }

  for (const rule of input.rules) {
    if (!SUPPORTED_RULE_KINDS.has(rule.kind)) {
      throw new Error(`defineArchitecture: unknown rule kind ${rule.kind}`);
    }
    if (!layerIds.has(rule.fromLayer)) {
      throw new Error(
        `defineArchitecture: rule references unknown fromLayer "${rule.fromLayer}". Known layers: ${[
          ...layerIds,
        ].join(", ")}`,
      );
    }
    for (const forbidden of rule.forbiddenLayers) {
      if (!layerIds.has(forbidden)) {
        throw new Error(
          `defineArchitecture: rule on "${rule.fromLayer}" references unknown layer "${forbidden}". Known layers: ${[
            ...layerIds,
          ].join(", ")}`,
        );
      }
    }
  }

  return {
    root: input.root,
    tsconfig,
    layers: input.layers,
    rules: input.rules,
    unassigned,
    ignoreFileGlobs: input.ignoreFileGlobs,
  };
}

export interface LayerRuleBuilder {
  cannotImport(...args: (string | { readonly exceptFrom?: readonly string[] })[]): CannotImportRule;
}

export function layer(fromLayer: string): LayerRuleBuilder {
  return {
    cannotImport(
      ...args: (string | { readonly exceptFrom?: readonly string[] })[]
    ): CannotImportRule {
      let exceptFromGlobs: readonly string[] | undefined;
      let targets: string[];

      const last = args[args.length - 1];
      if (
        last !== undefined &&
        typeof last === "object" &&
        last !== null &&
        "exceptFrom" in last
      ) {
        const opt = last as { readonly exceptFrom?: readonly string[] };
        exceptFromGlobs = opt.exceptFrom?.length ? [...opt.exceptFrom] : undefined;
        targets = args.slice(0, -1) as string[];
      } else {
        targets = args as string[];
      }

      if (targets.length === 0) {
        throw new Error(`layer("${fromLayer}").cannotImport() requires at least one target layer.`);
      }
      if (!targets.every((t) => typeof t === "string")) {
        throw new Error(`layer("${fromLayer}").cannotImport(): all targets must be layer name strings.`);
      }

      return {
        kind: "cannotImport",
        fromLayer,
        forbiddenLayers: [...targets],
        exceptFromGlobs,
      };
    },
  };
}

/**
 * Merges `cannotImport` targets per source layer (union of forbidden layer ids).
 * Per-rule `exceptFromGlobs` is ignored — use this for quick overviews, not enforcement logic.
 */
export function mergeForbiddenBySource(rules: ArchitectureRule[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const rule of rules) {
    if (rule.kind !== "cannotImport") continue;
    let set = map.get(rule.fromLayer);
    if (!set) {
      set = new Set();
      map.set(rule.fromLayer, set);
    }
    for (const t of rule.forbiddenLayers) set.add(t);
  }
  return map;
}

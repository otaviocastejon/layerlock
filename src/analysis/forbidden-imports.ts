import type { ArchitectureRule } from "../types.js";
import { matchesAnyGlob } from "./path-globs.js";

/** True if any `cannotImport` rule forbids `fromLayer` → `toLayer` for a source file at `fromFileRelPosix`. */
export function isForbiddenCannotImport(
  rules: readonly ArchitectureRule[],
  fromLayer: string,
  toLayer: string,
  fromFileRelPosix: string,
): boolean {
  for (const rule of rules) {
    if (rule.kind !== "cannotImport") continue;
    if (rule.fromLayer !== fromLayer) continue;
    if (!rule.forbiddenLayers.includes(toLayer)) continue;
    if (matchesAnyGlob(fromFileRelPosix, rule.exceptFromGlobs)) continue;
    return true;
  }
  return false;
}

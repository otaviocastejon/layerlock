import type { DefineArchitectureInput } from "../config/model.js";
import { layeredFromInnerToOuter } from "./layered.js";

const LAYER_IDS = ["foundation", "dataAccess", "feature", "deliverable"] as const;

export type NxStyleLayerId = (typeof LAYER_IDS)[number];

export interface NxStyleOptions {
  /**
   * Optional prefix for app sources (Nx `apps/<app>/src` vs plain `src` in a package).
   * When set, deliverable globs use that prefix plus a wildcard app segment and `src`.
   */
  appsGlob?: string;
  globs?: Partial<Record<NxStyleLayerId, readonly string[]>>;
}

/**
 * **Nx / monorepo-shaped** defaults (inner → outer):
 *
 * - `foundation` — shared utilities and primitives (`libs/shared`, `packages/shared`)
 * - `dataAccess` — persistence and remote IO libraries (`*-data-access`, `data-access`)
 * - `feature` — feature libraries (default globs match paths containing a `feature` segment under `libs`)
 * - `deliverable` — applications and publishable surfaces (see source defaults: apps tree and workspace package `src` folders)
 *
 * Real Nx repos vary; treat this as a template and override `globs` (often with tighter paths per lib type).
 */
export function nxStyle(options: NxStyleOptions = {}): Pick<DefineArchitectureInput, "layers" | "rules"> {
  const apps = options.appsGlob ?? "apps";
  const defaults: Record<NxStyleLayerId, readonly string[]> = {
    foundation: ["libs/shared/**/*.ts", "packages/shared/**/*.ts", "packages/*/src/lib/shared/**/*.ts"],
    dataAccess: ["libs/*-data-access/**/*.ts", "libs/data-access/**/*.ts", "libs/**/data-access/**/*.ts"],
    feature: ["libs/**/feature/**/*.ts", "libs/features/**/*.ts"],
    deliverable: [`${apps}/**/src/**/*.ts`, "packages/*/src/**/*.ts"],
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

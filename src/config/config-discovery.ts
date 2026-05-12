import fs from "node:fs";
import path from "node:path";

/** Filenames searched upward from `cwd` when no `--config` is passed (Layer Lock first, then legacy names). */
export const CONFIG_FILE_NAMES = [
  "layerlock.config.ts",
  "layerlock.config.mjs",
  "layerlock.config.cjs",
  "layerlock.config.js",
  "arch.config.ts",
  "architecture.config.ts",
  "arch.config.mjs",
  "arch.config.cjs",
  "arch.config.js",
] as const;

/**
 * Finds the nearest architecture config walking from `startDir` to filesystem root.
 */
export function findConfigPath(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (;;) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

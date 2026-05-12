import fs from "node:fs";
import path from "node:path";
import { CONFIG_FILE_NAMES } from "./config-discovery.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".turbo", ".nx", "coverage"]);

const CONFIG_SET = new Set<string>(CONFIG_FILE_NAMES);

/**
 * Finds every architecture config file under `rootDir` (recursive), excluding common
 * dependency and build directories. Paths are absolute, sorted for stable output.
 */
export function findAllLayerlockConfigFiles(rootDir: string): string[] {
  const root = path.resolve(rootDir);
  const out: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
      } else if (CONFIG_SET.has(e.name)) {
        out.push(p);
      }
    }
  }

  walk(root);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

/** @deprecated Use {@link findAllLayerlockConfigFiles} */
export const findAllArchConfigFiles = findAllLayerlockConfigFiles;

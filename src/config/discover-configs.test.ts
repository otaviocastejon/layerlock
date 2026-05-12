import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findAllLayerlockConfigFiles } from "./discover-configs.js";

describe("findAllLayerlockConfigFiles", () => {
  it("finds config files and skips node_modules", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "layerlock-discover-"));
    try {
      fs.mkdirSync(path.join(dir, "pkg-a"), { recursive: true });
      fs.writeFileSync(path.join(dir, "pkg-a", "arch.config.ts"), "// x");
      fs.mkdirSync(path.join(dir, "pkg-a", "node_modules", "nested"), { recursive: true });
      fs.writeFileSync(path.join(dir, "pkg-a", "node_modules", "nested", "arch.config.ts"), "// skip");
      const found = findAllLayerlockConfigFiles(dir);
      expect(found).toHaveLength(1);
      expect(found[0]).toContain("pkg-a");
      expect(found[0]).toContain("arch.config.ts");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

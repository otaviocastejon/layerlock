import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runInitScaffold } from "./init-scaffold.js";

describe("runInitScaffold", () => {
  it("creates layerlock.config.ts and layer dirs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arch-init-"));
    runInitScaffold({ cwd: dir, flavor: "clean", force: false });
    expect(fs.existsSync(path.join(dir, "layerlock.config.ts"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "src", "domain", ".gitkeep"))).toBe(true);
    expect(fs.readFileSync(path.join(dir, "layerlock.config.ts"), "utf8")).toContain("cleanArchitectureFourLayer");
  });

  it("scaffolds hexagonal preset dirs and config", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "layerlock-init-hex-"));
    runInitScaffold({ cwd: dir, flavor: "hexagonal", force: false });
    expect(fs.readFileSync(path.join(dir, "layerlock.config.ts"), "utf8")).toContain("presets.hexagonal");
    expect(fs.existsSync(path.join(dir, "src", "ports", ".gitkeep"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "src", "use-cases", ".gitkeep"))).toBe(false);
  });

  it("refuses overwrite without --force", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arch-init-"));
    runInitScaffold({ cwd: dir, flavor: "nest", force: false });
    expect(() => runInitScaffold({ cwd: dir, flavor: "nest", force: false })).toThrow(/already exists/);
  });

  it("overwrites with --force", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arch-init-"));
    runInitScaffold({ cwd: dir, flavor: "clean", force: false });
    fs.writeFileSync(path.join(dir, "layerlock.config.ts"), "// stale", "utf8");
    runInitScaffold({ cwd: dir, flavor: "nest", force: true });
    expect(fs.readFileSync(path.join(dir, "layerlock.config.ts"), "utf8")).toContain("nestRecommended");
  });
});

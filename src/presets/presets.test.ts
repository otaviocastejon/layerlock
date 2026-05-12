import { describe, expect, it } from "vitest";
import { layer } from "../config/define-architecture.js";
import { cleanArchitectureFourLayer } from "./clean-architecture.js";
import { layeredFromInnerToOuter } from "./layered.js";
import { nestRecommended } from "./nest-recommended.js";

describe("presets.layeredFromInnerToOuter", () => {
  it("forbids inner layers from importing outer layers", () => {
    const { layers, rules } = layeredFromInnerToOuter({
      layers: ["domain", "app", "infra"],
      globs: {
        domain: ["src/domain/**"],
        app: ["src/app/**"],
        infra: ["src/infra/**"],
      },
    });

    expect(Object.keys(layers)).toEqual(["domain", "app", "infra"]);
    expect(rules).toEqual([
      layer("domain").cannotImport("app", "infra"),
      layer("app").cannotImport("infra"),
    ]);
  });
});

describe("presets.cleanArchitectureFourLayer", () => {
  it("returns four default layers with onion rules", () => {
    const { layers, rules } = cleanArchitectureFourLayer({ baseDir: "src" });
    expect(layers.domain?.[0]).toBe("src/domain/**/*.ts");
    expect(rules.length).toBe(3);
  });
});

describe("presets.nestRecommended", () => {
  it("appends test globs to each rule by default", () => {
    const { rules } = nestRecommended({ relaxRulesInTests: true, baseDir: "src" });
    expect(rules.every((r) => r.kind === "cannotImport" && (r.exceptFromGlobs?.length ?? 0) > 0)).toBe(true);
  });

  it("can disable test relaxation", () => {
    const { rules } = nestRecommended({ relaxRulesInTests: false });
    expect(rules.every((r) => r.kind === "cannotImport" && !r.exceptFromGlobs)).toBe(true);
  });
});

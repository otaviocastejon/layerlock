import { describe, expect, it } from "vitest";
import { defineArchitecture, layer } from "./define-architecture.js";

describe("defineArchitecture", () => {
  it("rejects unknown fromLayer", () => {
    expect(() =>
      defineArchitecture({
        layers: { a: ["**/*.ts"] },
        rules: [layer("b").cannotImport("a")],
      }),
    ).toThrow(/unknown fromLayer/);
  });

  it("rejects unknown forbidden layer", () => {
    expect(() =>
      defineArchitecture({
        layers: { a: ["**/*.ts"] },
        rules: [layer("a").cannotImport("x")],
      }),
    ).toThrow(/unknown layer/);
  });

  it("accepts cannotImport with exceptFrom option", () => {
    const r = defineArchitecture({
      layers: { a: ["**/*.ts"], b: ["**/b/**"] },
      rules: [layer("a").cannotImport("b", { exceptFrom: ["**/*.test.ts"] })],
    });
    expect(r.rules[0]).toMatchObject({
      kind: "cannotImport",
      fromLayer: "a",
      forbiddenLayers: ["b"],
      exceptFromGlobs: ["**/*.test.ts"],
    });
  });
});

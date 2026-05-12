import path from "node:path";
import { describe, expect, it } from "vitest";
import { assignLayer } from "./assign-layer.js";

describe("assignLayer", () => {
  const root = path.join(path.sep, "repo");

  it("matches first layer in key order", () => {
    const layers = {
      a: ["src/**/*.ts"],
      b: ["src/core/**/*.ts"],
    };
    const file = path.join(root, "src", "core", "x.ts");
    expect(assignLayer(file, root, layers)).toBe("a");
  });

  it("returns null outside root", () => {
    const layers = { a: ["**/*.ts"] };
    const file = path.join(root, "..", "other", "x.ts");
    expect(assignLayer(path.normalize(file), root, layers)).toBeNull();
  });
});

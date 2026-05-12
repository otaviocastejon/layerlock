import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { layer, resolveToValidatedArchitecture, validateArchitecture } from "../../src/index.js";

const exampleRoot = path.dirname(fileURLToPath(import.meta.url));
const fakeConfigPath = path.join(exampleRoot, "layerlock.config.ts");

describe("examples/simple", () => {
  it("detects forbidden domain -> infra import", () => {
    const validated = resolveToValidatedArchitecture(
      {
        tsconfig: "tsconfig.json",
        layers: {
          domain: ["src/domain/**/*.ts"],
          infra: ["src/infra/**/*.ts"],
          api: ["src/api/**/*.ts"],
          db: ["src/db/**/*.ts"],
        },
        rules: [layer("domain").cannotImport("infra", "api", "db")],
      },
      fakeConfigPath,
    );

    const result = validateArchitecture(validated);
    expect(result.violations.length).toBeGreaterThan(0);
    const v = result.violations.find((x) => x.fromLayer === "domain" && x.toLayer === "infra");
    expect(v).toBeDefined();
    expect(v?.specifier).toContain("infra/db");
  });

  it("detects forbidden api -> db when db layer exists", () => {
    const validated = resolveToValidatedArchitecture(
      {
        tsconfig: "tsconfig.json",
        layers: {
          domain: ["src/domain/**/*.ts"],
          infra: ["src/infra/**/*.ts"],
          api: ["src/api/**/*.ts"],
          db: ["src/db/**/*.ts"],
        },
        rules: [layer("api").cannotImport("db")],
      },
      fakeConfigPath,
    );

    const result = validateArchitecture(validated);
    expect(result.violations.some((x) => x.fromLayer === "api" && x.toLayer === "db")).toBe(true);
  });
});

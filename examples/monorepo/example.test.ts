import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { layer, resolveToValidatedArchitecture, validateArchitecture } from "../../src/index.js";

const exampleRoot = path.dirname(fileURLToPath(import.meta.url));
const fakeConfigPath = path.join(exampleRoot, "layerlock.config.ts");

describe("examples/monorepo", () => {
  it("respects tsconfig paths and flags api -> infra", () => {
    const validated = resolveToValidatedArchitecture(
      {
        tsconfig: "tsconfig.json",
        layers: {
          api: ["packages/api/**/*.ts"],
          domain: ["packages/domain/**/*.ts"],
          infra: ["packages/infra/**/*.ts"],
        },
        rules: [layer("api").cannotImport("infra")],
      },
      fakeConfigPath,
    );

    const result = validateArchitecture(validated);
    expect(result.violations.some((v) => v.fromLayer === "api" && v.toLayer === "infra")).toBe(true);
  });
});

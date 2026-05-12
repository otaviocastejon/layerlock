import { describe, expect, it } from "vitest";
import { isForbiddenCannotImport } from "./forbidden-imports.js";
import { layer } from "../config/define-architecture.js";

describe("isForbiddenCannotImport", () => {
  const rules = [layer("domain").cannotImport("infra", { exceptFrom: ["**/*.spec.ts"] })];

  it("respects exceptFrom on the source file path", () => {
    expect(isForbiddenCannotImport(rules, "domain", "infra", "src/domain/x.ts")).toBe(true);
    expect(isForbiddenCannotImport(rules, "domain", "infra", "src/domain/x.spec.ts")).toBe(false);
  });

  it("returns false when no rule matches", () => {
    expect(isForbiddenCannotImport(rules, "api", "infra", "src/a.ts")).toBe(false);
  });
});

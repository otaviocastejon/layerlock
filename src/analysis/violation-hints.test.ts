import { describe, expect, it } from "vitest";
import { violationHint } from "./violation-hints.js";

describe("violationHint", () => {
  it("uses ASCII wording (no arrow punctuation)", () => {
    const h = violationHint({ fromLayer: "domain", toLayer: "infra" });
    expect(h).toContain('from "domain" to "infra"');
    expect(h).not.toMatch(/[\u2190-\u21ff]/);
  });
});

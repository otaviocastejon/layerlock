import { describe, expect, it } from "vitest";
import { layerEdgesToDot, layerEdgesToMermaid } from "./layer-graph.js";

describe("layer graph", () => {
  it("emits mermaid for edges", () => {
    const edges = [
      { fromLayer: "api", toLayer: "domain", count: 2 },
      { fromLayer: "api", toLayer: "infra", count: 1 },
    ];
    const out = layerEdgesToMermaid(edges).trimEnd();
    expect(out).toContain("flowchart LR");
    expect(out).toContain('api["api"]');
    expect(out).toContain('domain["domain"]');
    expect(out).toContain("x2");
  });

  it("emits dot with quoted ids when needed", () => {
    const edges = [{ fromLayer: "a-b", toLayer: "c.d", count: 3 }];
    expect(layerEdgesToDot(edges)).toContain(`"a-b" -> "c.d"`);
  });
});

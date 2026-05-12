import type { LayerEdge } from "../types.js";

function sanitizeMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

/** Observed cross-layer dependency graph (aggregated edge counts). */
export function layerEdgesToMermaid(edges: LayerEdge[]): string {
  const lines: string[] = ["flowchart LR"];
  for (const e of edges) {
    const from = sanitizeMermaidId(e.fromLayer);
    const to = sanitizeMermaidId(e.toLayer);
    lines.push(`  ${from}["${e.fromLayer}"] -->|"x${String(e.count)}"| ${to}["${e.toLayer}"]`);
  }
  if (edges.length === 0) lines.push("  noCrossLayerDeps[No cross-layer imports observed]");
  return `${lines.join("\n")}\n`;
}

function quoteDotId(id: string): string {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) return id;
  return `"${id.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function layerEdgesToDot(edges: LayerEdge[]): string {
  const lines: string[] = ["digraph LayerGraph {"];
  lines.push("  rankdir=LR;");
  for (const e of edges) {
    const from = quoteDotId(e.fromLayer);
    const to = quoteDotId(e.toLayer);
    lines.push(`  ${from} -> ${to} [label="x${String(e.count)}"];`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

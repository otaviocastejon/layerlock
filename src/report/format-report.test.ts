import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ValidateResult, Violation } from "../types.js";
import {
  buildReportSummary,
  formatJsonReport,
  formatTextReport,
  sortViolationsStable,
  toPosixDisplayPath,
} from "./format-report.js";

function v(partial: Partial<Violation> & Pick<Violation, "fromFile" | "toFile" | "fromLayer" | "toLayer">): Violation {
  return {
    kind: "forbiddenImport",
    specifier: "./x",
    line: 1,
    column: 1,
    message: "m",
    hint: "h",
    ...partial,
  };
}

describe("buildReportSummary", () => {
  it("aggregates by layer pair in stable order", () => {
    const result: ValidateResult = {
      violations: [
        v({ fromFile: "a", toFile: "b", fromLayer: "domain", toLayer: "infrastructure" }),
        v({ fromFile: "c", toFile: "d", fromLayer: "domain", toLayer: "presentation" }),
        v({ fromFile: "e", toFile: "f", fromLayer: "domain", toLayer: "infrastructure" }),
      ],
      unassignedIssues: [{ kind: "unassignedFile", file: "/u.ts" }],
      layerEdges: [],
    };
    const s = buildReportSummary(result);
    expect(s.forbiddenImports).toBe(3);
    expect(s.unassignedFiles).toBe(1);
    expect(s.byLayerPair.map((x) => `${x.pair}:${x.count}`)).toEqual([
      "domain -> infrastructure:2",
      "domain -> presentation:1",
    ]);
  });
});

describe("sortViolationsStable", () => {
  it("orders by path then position", () => {
    const sorted = sortViolationsStable([
      v({ fromFile: "b", toFile: "t", line: 2, column: 1, fromLayer: "a", toLayer: "b" }),
      v({ fromFile: "a", toFile: "t", line: 10, column: 1, fromLayer: "a", toLayer: "b" }),
      v({ fromFile: "a", toFile: "t", line: 1, column: 5, fromLayer: "a", toLayer: "b" }),
      v({ fromFile: "a", toFile: "t", line: 1, column: 1, fromLayer: "a", toLayer: "b" }),
    ]);
    expect(sorted.map((x) => `${x.fromFile}:${x.line}:${x.column}`)).toEqual([
      "a:1:1",
      "a:1:5",
      "a:10:1",
      "b:2:1",
    ]);
  });
});

describe("formatTextReport", () => {
  it("prints summary before violation list", () => {
    const result: ValidateResult = {
      violations: [v({ fromFile: "/p/a.ts", toFile: "/p/b.ts", fromLayer: "x", toLayer: "y" })],
      unassignedIssues: [],
      layerEdges: [],
    };
    const text = formatTextReport(result, "/p");
    expect(text.indexOf("Summary")).toBeLessThan(text.indexOf("Violation"));
  });
});

describe("formatJsonReport", () => {
  it("includes summary field", () => {
    const result: ValidateResult = {
      violations: [v({ fromFile: "a", toFile: "b", fromLayer: "x", toLayer: "y" })],
      unassignedIssues: [],
      layerEdges: [],
    };
    const j = JSON.parse(formatJsonReport(result, ".")) as { summary: { forbiddenImports: number } };
    expect(j.summary.forbiddenImports).toBe(1);
  });

  it("with ciDiff uses stable key order starting with violations", () => {
    const root = path.join(process.cwd(), ".vitest-ci-diff-root");
    const fromFile = path.join(root, "src", "a.ts");
    const toFile = path.join(root, "src", "b.ts");
    const result: ValidateResult = {
      violations: [v({ fromFile, toFile, fromLayer: "x", toLayer: "y" })],
      unassignedIssues: [],
      layerEdges: [],
    };
    const raw = formatJsonReport(result, root, { ciDiff: true });
    expect(raw.startsWith('{\n  "violations"')).toBe(true);
    const j = JSON.parse(raw) as { violations: { fromFile: string; kind: string }[] };
    expect(j.violations[0]!.kind).toBe("forbiddenImport");
    expect(j.violations[0]!.fromFile).toBe("src/a.ts");
  });
});

describe("toPosixDisplayPath", () => {
  it("returns repo-relative POSIX paths under root", () => {
    const root = path.join(process.cwd(), ".vitest-posix-root");
    const f = path.join(root, "lib", "x.ts");
    expect(toPosixDisplayPath(f, root)).toBe("lib/x.ts");
  });
});

describe("formatTextReport ciDiff", () => {
  it("shows POSIX relative paths in violation block", () => {
    const root = path.join(process.cwd(), ".vitest-ci-text-root");
    const fromFile = path.join(root, "packages", "app", "index.ts");
    const toFile = path.join(root, "packages", "lib", "x.ts");
    const result: ValidateResult = {
      violations: [v({ fromFile, toFile, fromLayer: "a", toLayer: "b" })],
      unassignedIssues: [{ kind: "unassignedFile", file: path.join(root, "orphan.ts") }],
      layerEdges: [],
    };
    const text = formatTextReport(result, root, { ciDiff: true });
    expect(text).toContain("packages/app/index.ts");
    expect(text).toContain("packages/lib/x.ts");
    expect(text).toContain("orphan.ts");
  });
});

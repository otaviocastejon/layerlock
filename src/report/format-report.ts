import path from "node:path";
import type { LayerEdge, UnassignedFileIssue, ValidateResult, Violation } from "../types.js";

export interface ReportSummary {
  forbiddenImports: number;
  /** Sorted by `pair` ascending for stable / diff-friendly output. */
  byLayerPair: { pair: string; count: number }[];
  unassignedFiles: number;
}

/** POSIX path: under `root` as repo-relative; otherwise absolute normalized with `/` separators. */
export function toPosixDisplayPath(absFile: string, root: string): string {
  const f = path.resolve(absFile);
  const r = path.resolve(root);
  const rel = path.relative(r, f);
  const posix = (s: string) => s.replace(/\\/g, "/");
  if (rel && !rel.startsWith("..") && rel !== "") return posix(rel);
  return posix(f);
}

export function sortViolationsStable(violations: readonly Violation[]): Violation[] {
  return [...violations].sort((a, b) => {
    const af = a.fromFile.localeCompare(b.fromFile);
    if (af !== 0) return af;
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    const tf = a.toFile.localeCompare(b.toFile);
    if (tf !== 0) return tf;
    return a.specifier.localeCompare(b.specifier);
  });
}

export function buildReportSummary(result: ValidateResult): ReportSummary {
  const pairCounts = new Map<string, number>();
  for (const v of result.violations) {
    const pair = `${v.fromLayer} -> ${v.toLayer}`;
    pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
  }
  const byLayerPair = [...pairCounts.entries()]
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => a.pair.localeCompare(b.pair));
  return {
    forbiddenImports: result.violations.length,
    byLayerPair,
    unassignedFiles: result.unassignedIssues.length,
  };
}

/** Plain `-` rules: readable everywhere (Windows conhost, CI, `TERM=dumb`, log files). */
const TEXT_RULE = "-".repeat(76);

function formatSummaryBlock(summary: ReportSummary): string {
  const lines: string[] = [
    TEXT_RULE,
    "Summary",
    TEXT_RULE,
    `  Forbidden import violations: ${String(summary.forbiddenImports)}`,
  ];
  if (summary.byLayerPair.length > 0) {
    lines.push("  Counts by forbidden layer edge:");
    for (const { pair, count } of summary.byLayerPair) {
      lines.push(`    - ${pair}: ${String(count)}`);
    }
  }
  if (summary.unassignedFiles > 0) {
    lines.push(`  Unassigned source files (match no layer glob): ${String(summary.unassignedFiles)}`);
  }
  lines.push(TEXT_RULE, "");
  return `${lines.join("\n")}\n`;
}

function formatViolation(index: number, total: number, v: Violation): string {
  return [
    TEXT_RULE,
    `Violation ${String(index)} of ${String(total)}`,
    TEXT_RULE,
    `  Rule:        cannotImport: "${v.fromLayer}" -> "${v.toLayer}"`,
    `  Explanation: ${v.message}`,
    `  Source:      ${v.fromFile}:${String(v.line)}:${String(v.column)}`,
    `  Import:      ${v.specifier}`,
    `  Resolves to: ${v.toFile}`,
    `  Hint:        ${v.hint}`,
  ].join("\n");
}

export interface FormatReportOptions {
  /** Deterministic ordering of violations / JSON / layer edges (diff-friendly CI logs). */
  stable?: boolean;
  /**
   * Stricter CI diff mode: implies **stable**, normalizes file paths to POSIX (repo-relative under `root`),
   * and emits JSON with deterministic key order.
   */
  ciDiff?: boolean;
}

function applyCiDiffPaths(result: ValidateResult, root: string): ValidateResult {
  return {
    violations: result.violations.map((v) => ({
      ...v,
      fromFile: toPosixDisplayPath(v.fromFile, root),
      toFile: toPosixDisplayPath(v.toFile, root),
    })),
    unassignedIssues: result.unassignedIssues.map((u) => ({
      ...u,
      file: toPosixDisplayPath(u.file, root),
    })),
    layerEdges: result.layerEdges,
  };
}

function normalizeResultForFormat(
  result: ValidateResult,
  root: string,
  options?: FormatReportOptions,
): ValidateResult {
  const stable = Boolean(options?.stable || options?.ciDiff);
  let r = result;
  if (stable) {
    r = {
      violations: sortViolationsStable(r.violations),
      unassignedIssues: [...r.unassignedIssues].sort((a, b) => a.file.localeCompare(b.file)),
      layerEdges: [...r.layerEdges].sort(
        (a, b) => a.fromLayer.localeCompare(b.fromLayer) || a.toLayer.localeCompare(b.toLayer),
      ),
    };
  }
  if (options?.ciDiff) {
    r = applyCiDiffPaths(r, root);
  }
  return r;
}

function violationJsonRecord(v: Violation): Record<string, unknown> {
  return {
    kind: v.kind,
    fromFile: v.fromFile,
    toFile: v.toFile,
    fromLayer: v.fromLayer,
    toLayer: v.toLayer,
    specifier: v.specifier,
    line: v.line,
    column: v.column,
    message: v.message,
    hint: v.hint,
  };
}

function unassignedJsonRecord(u: UnassignedFileIssue): Record<string, unknown> {
  return { kind: u.kind, file: u.file };
}

function layerEdgeJsonRecord(e: LayerEdge): Record<string, unknown> {
  return { fromLayer: e.fromLayer, toLayer: e.toLayer, count: e.count };
}

export function formatTextReport(
  result: ValidateResult,
  root: string,
  options?: FormatReportOptions,
): string {
  const r = normalizeResultForFormat(result, root, options);
  const parts: string[] = [];
  const rootNorm = path.resolve(root);

  const shorten = (p: string) => {
    if (options?.ciDiff) return toPosixDisplayPath(p, rootNorm);
    const rel = path.relative(rootNorm, p);
    return rel && !rel.startsWith("..") ? rel : p;
  };

  const hasIssues = r.violations.length > 0 || r.unassignedIssues.length > 0;
  if (hasIssues) {
    parts.push(formatSummaryBlock(buildReportSummary(r)));
  }

  if (r.violations.length > 0) {
    parts.push(
      `layerlock: ${String(r.violations.length)} violation(s) found.`,
      "",
    );
    let i = 0;
    for (const v of r.violations) {
      i += 1;
      const copy: Violation = options?.ciDiff
        ? v
        : {
            ...v,
            fromFile: shorten(v.fromFile),
            toFile: shorten(v.toFile),
          };
      parts.push(formatViolation(i, r.violations.length, copy));
      parts.push("");
    }
    parts.push(
      TEXT_RULE,
      "Machine-readable output:  npx layerlock -f json",
      'Config reference (AI / docs): import { LAYERLOCK_AI_CONFIG_GUIDE } from "layerlock"',
      TEXT_RULE,
      "",
    );
  }

  if (r.unassignedIssues.length > 0) {
    parts.push(
      TEXT_RULE,
      `Unassigned files (${String(r.unassignedIssues.length)})`,
      TEXT_RULE,
      "  These paths are under the project root but match no layer glob (and unassigned is set to error).",
      "",
    );
    for (const u of r.unassignedIssues) {
      parts.push(`  - ${options?.ciDiff ? u.file : shorten(u.file)}`);
    }
    parts.push("");
  }

  if (parts.length === 0) return "layerlock: OK (no violations).\n";
  return `${parts.join("\n").trimEnd()}\n`;
}

export function formatJsonReport(result: ValidateResult, root: string, options?: FormatReportOptions): string {
  const r = normalizeResultForFormat(result, root, options);
  const summary = buildReportSummary(r);

  if (options?.ciDiff) {
    const payload: Record<string, unknown> = {
      violations: r.violations.map(violationJsonRecord),
      unassignedIssues: r.unassignedIssues.map(unassignedJsonRecord),
      layerEdges: r.layerEdges.map(layerEdgeJsonRecord),
      summary: {
        forbiddenImports: summary.forbiddenImports,
        byLayerPair: summary.byLayerPair.map((x) => ({ pair: x.pair, count: x.count })),
        unassignedFiles: summary.unassignedFiles,
      },
    };
    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  const payload = { ...r, summary };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

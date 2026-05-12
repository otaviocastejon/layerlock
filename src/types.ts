export type ArchitectureRule = CannotImportRule;

export interface CannotImportRule {
  kind: "cannotImport";
  fromLayer: string;
  forbiddenLayers: readonly string[];
  /**
   * When the **source file** path (relative to project root) matches any of these picomatch patterns,
   * this rule does not apply (escape hatch for tests, e2e, generated glue, etc.).
   */
  exceptFromGlobs?: readonly string[];
}

export interface Violation {
  kind: "forbiddenImport";
  fromFile: string;
  toFile: string;
  fromLayer: string;
  toLayer: string;
  specifier: string;
  line: number;
  column: number;
  /** One-line summary for terminals and JSON consumers. */
  message: string;
  /** Actionable guidance for humans / coding agents. */
  hint: string;
}

export interface UnassignedFileIssue {
  kind: "unassignedFile";
  file: string;
}

export interface LayerEdge {
  fromLayer: string;
  toLayer: string;
  count: number;
}

export interface ValidateResult {
  violations: Violation[];
  unassignedIssues: UnassignedFileIssue[];
  layerEdges: LayerEdge[];
}

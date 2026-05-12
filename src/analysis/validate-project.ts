import path from "node:path";
import * as ts from "typescript";
import type { ValidatedArchitecture } from "../config/model.js";
import { assignLayer } from "./assign-layer.js";
import { collectImportSites } from "./collect-import-sites.js";
import { isForbiddenCannotImport } from "./forbidden-imports.js";
import { matchesAnyGlob, relativePosixWithinRoot } from "./path-globs.js";
import { readTsConfig } from "./read-tsconfig.js";
import { violationHint, violationSummary } from "./violation-hints.js";
import type { LayerEdge, UnassignedFileIssue, ValidateResult, Violation } from "../types.js";

function normalizePath(p: string): string {
  return path.normalize(p);
}

function addLayerEdge(map: Map<string, number>, fromLayer: string, toLayer: string) {
  const key = `${fromLayer}\0${toLayer}`;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToLayerEdges(map: Map<string, number>): LayerEdge[] {
  const edges: LayerEdge[] = [];
  for (const [key, count] of map) {
    const [fromLayer, toLayer] = key.split("\0");
    if (fromLayer && toLayer) edges.push({ fromLayer, toLayer, count });
  }
  edges.sort((a, b) => a.fromLayer.localeCompare(b.fromLayer) || a.toLayer.localeCompare(b.toLayer));
  return edges;
}

/**
 * Statically validates import boundaries for a TypeScript project described by `config`.
 */
export function validateArchitecture(config: ValidatedArchitecture): ValidateResult {
  const rootNorm = normalizePath(config.root);
  const tsconfigPath = path.isAbsolute(config.tsconfig)
    ? normalizePath(config.tsconfig)
    : normalizePath(path.join(rootNorm, config.tsconfig));

  const parsed = readTsConfig(tsconfigPath);
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
    projectReferences: parsed.projectReferences,
    configFileParsingDiagnostics: parsed.errors,
  });

  const options = program.getCompilerOptions();

  const violations: Violation[] = [];
  const unassignedIssues: UnassignedFileIssue[] = [];
  const layerEdgeCounts = new Map<string, number>();

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    const fileName = normalizePath(sourceFile.fileName);
    if (fileName.includes(`${path.sep}node_modules${path.sep}`)) continue;

    const fromRel = relativePosixWithinRoot(rootNorm, fileName);
    if (fromRel !== null && matchesAnyGlob(fromRel, config.ignoreFileGlobs)) continue;

    const fromLayer = assignLayer(fileName, rootNorm, config.layers);
    if (fromLayer === null) {
      if (config.unassigned === "error" && fileName.startsWith(rootNorm)) {
        unassignedIssues.push({ kind: "unassignedFile", file: fileName });
      }
      continue;
    }

    const imports = collectImportSites(sourceFile);
    for (const site of imports) {
      const resolved = ts.resolveModuleName(site.specifier, fileName, options, ts.sys).resolvedModule;
      if (!resolved || resolved.isExternalLibraryImport) continue;

      const toFile = normalizePath(resolved.resolvedFileName);
      const toLayer = assignLayer(toFile, rootNorm, config.layers);
      if (toLayer === null) continue;

      if (fromLayer !== toLayer) {
        addLayerEdge(layerEdgeCounts, fromLayer, toLayer);
      }

      const fromRelForRule = relativePosixWithinRoot(rootNorm, fileName) ?? "";
      if (
        isForbiddenCannotImport(config.rules, fromLayer, toLayer, fromRelForRule)
      ) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(site.specifierPos);
        const fromLayerName = fromLayer;
        const toLayerName = toLayer;
        violations.push({
          kind: "forbiddenImport",
          fromFile: fileName,
          toFile,
          fromLayer: fromLayerName,
          toLayer: toLayerName,
          specifier: site.specifier,
          line: line + 1,
          column: character + 1,
          message: violationSummary({ fromLayer: fromLayerName, toLayer: toLayerName, specifier: site.specifier }),
          hint: violationHint({ fromLayer: fromLayerName, toLayer: toLayerName }),
        });
      }
    }
  }

  return {
    violations,
    unassignedIssues,
    layerEdges: mapToLayerEdges(layerEdgeCounts),
  };
}

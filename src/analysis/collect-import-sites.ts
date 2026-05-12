import * as ts from "typescript";

export interface ImportSite {
  specifier: string;
  /** Start position of module specifier token for line/column. */
  specifierPos: number;
}

function isRequireImport(node: ts.CallExpression): boolean {
  if (!ts.isIdentifier(node.expression) || node.expression.text !== "require") return false;
  const arg = node.arguments[0];
  if (arg === undefined) return false;
  return ts.isStringLiteralLike(arg);
}

function isDynamicImportCall(node: ts.CallExpression): boolean {
  return node.expression.kind === ts.SyntaxKind.ImportKeyword;
}

/** Collect statically analyzable module specifiers from a source file. */
export function collectImportSites(sourceFile: ts.SourceFile): ImportSite[] {
  const sites: ImportSite[] = [];

  const add = (specifier: string, specifierNode: ts.Node) => {
    sites.push({ specifier, specifierPos: specifierNode.getStart(sourceFile, false) });
  };

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (spec !== undefined && ts.isStringLiteralLike(spec)) {
        add(spec.text, spec);
      }
    } else if (ts.isImportEqualsDeclaration(node)) {
      const ref = node.moduleReference;
      if (ts.isExternalModuleReference(ref) && ts.isStringLiteralLike(ref.expression)) {
        add(ref.expression.text, ref.expression);
      }
    } else if (ts.isCallExpression(node)) {
      if (isDynamicImportCall(node)) {
        const arg = node.arguments[0];
        if (arg !== undefined && ts.isStringLiteralLike(arg)) add(arg.text, arg);
      } else if (isRequireImport(node)) {
        const arg = node.arguments[0];
        if (arg !== undefined && ts.isStringLiteralLike(arg)) add(arg.text, arg);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return sites;
}

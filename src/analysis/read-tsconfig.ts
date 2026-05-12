import path from "node:path";
import * as ts from "typescript";

export function readTsConfig(tsconfigPath: string): ts.ParsedCommandLine {
  const read = ts.readConfigFile(tsconfigPath, (filePath) => ts.sys.readFile(filePath));
  if (read.error) {
    const message = ts.flattenDiagnosticMessageText(read.error.messageText, "\n");
    throw new Error(`Failed to read ${tsconfigPath}: ${message}`);
  }
  const basePath = path.dirname(tsconfigPath);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, basePath, undefined, tsconfigPath);
  if (parsed.errors.length > 0) {
    const message = parsed.errors
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      .join("\n");
    throw new Error(`Invalid tsconfig ${tsconfigPath}:\n${message}`);
  }
  return parsed;
}

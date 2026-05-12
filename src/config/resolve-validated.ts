import path from "node:path";
import { defineArchitecture } from "./define-architecture.js";
import type { DefineArchitectureInput, ValidatedArchitecture } from "./model.js";

/**
 * Applies the same root resolution rules as the CLI:
 * `root` defaults to the directory containing the config file.
 */
export function resolveToValidatedArchitecture(
  input: DefineArchitectureInput,
  configFilePath: string,
): ValidatedArchitecture {
  const absoluteConfig = path.resolve(configFilePath);
  const inferredRoot = path.dirname(absoluteConfig);
  const root = path.resolve(input.root ?? inferredRoot);
  const resolved = defineArchitecture({ ...input, root });
  return { ...resolved, root };
}

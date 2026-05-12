import { createJiti } from "jiti";
import type { DefineArchitectureInput } from "./model.js";

export async function loadArchitectureConfigFile(configPath: string): Promise<DefineArchitectureInput> {
  const jiti = createJiti(import.meta.url);
  const mod = await jiti.import<{ default?: DefineArchitectureInput }>(configPath);
  const candidate = mod.default ?? mod;
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error(`Config file ${configPath} did not export a valid architecture configuration.`);
  }
  if (!("layers" in candidate) || !("rules" in candidate)) {
    throw new Error(
      `Config file ${configPath} must export an object with "layers" and "rules" (use defineArchitecture(...)).`,
    );
  }
  return candidate;
}

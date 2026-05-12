import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.hexagonal({ baseDir: "src" }),
  /** Exercised by `src/application/bad-import.layerlock-ignored.ts` (skipped for violations). */
  ignoreFileGlobs: ["src/**/*.layerlock-ignored.ts"],
});

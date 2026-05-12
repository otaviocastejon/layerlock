import { defineArchitecture, layer } from "layerlock";

/** Tiny second package so `layerlock --discover` finds more than one config under this fixture. */
export default defineArchitecture({
  tsconfig: "tsconfig.json",
  layers: {
    core: ["src/core/**/*.ts"],
    shell: ["src/shell/**/*.ts"],
  },
  rules: [layer("core").cannotImport("shell")],
});

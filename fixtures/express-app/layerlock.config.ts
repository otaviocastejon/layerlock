import { defineArchitecture, layer } from "layerlock";

/**
 * Layers mapped to the default express-generator layout (`routes/`, `app.js`, `bin/`).
 * Adjust as you refactor toward a richer structure.
 */
export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ignoreFileGlobs: ["**/node_modules/**"],
  layers: {
    routes: ["routes/**/*.js"],
    shell: ["app.js", "bin/**/*.js"],
  },
  rules: [layer("routes").cannotImport("shell")],
});

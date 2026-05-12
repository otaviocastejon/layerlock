import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node18",
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    shims: false,
  },
  {
    entry: { cli: "src/cli/entry.ts" },
    format: ["esm"],
    target: "node18",
    dts: false,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    shims: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);

# Requirements and dependencies

This page supplements the [project README](../README.md). It describes the runtime and toolchain layerlock expects, and what ships inside the published package.

---

## Node.js

- **Supported:** Node.js **18** and later (`"engines": { "node": ">=18" }` in `package.json`).
- **Build target:** Prebuilt artifacts target the **Node 18** API surface (see the project’s `tsup` configuration).

---

## Module format

The **layerlock** package is published as **ESM** (`"type": "module"`). The CLI is a Node ESM entrypoint. Import the library from ESM scripts or use dynamic `import()` from CommonJS contexts if needed.

---

## TypeScript in your repository

layerlock builds a **TypeScript `Program`** from your **`tsconfig.json`**. Your sources should be part of a normal compiler project (including `paths`, `extends`, and typical monorepo references where applicable).

Use a **TypeScript 5.x** toolchain in your application for best alignment with the compiler API version bundled with layerlock. npm may dedupe `typescript` when your version range overlaps the dependency declared by layerlock.

---

## JavaScript-only projects

Analysis is driven by the **TypeScript compiler API**. Repositories without a meaningful TS program (for example, plain JavaScript with no `tsconfig` that includes those files) are not the primary target.

---

## Runtime dependencies bundled with layerlock

Installing `layerlock` also installs its **runtime** dependencies (you do not configure these separately):

| Package | Role |
|---------|------|
| [typescript](https://www.npmjs.com/package/typescript) | Compiler API: program creation, module resolution, and the import graph. |
| [picomatch](https://www.npmjs.com/package/picomatch) | Glob matching for layer definitions, `exceptFrom`, and `ignoreFileGlobs`. |
| [jiti](https://www.npmjs.com/package/jiti) | Loading `layerlock.config.ts` and compatible JavaScript variants. |

TypeScript is a **direct** dependency so the analyzer always has a compatible compiler API, without a fragile peer-dependency matrix across consumer projects.

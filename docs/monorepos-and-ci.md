# Monorepos and continuous integration

layerlock evaluates rules on **resolved** module paths after TypeScript resolution, so **`paths`** aliases and shared `tsconfig` bases behave the same way they do for `tsc`.

---

## Monorepos

- Prefer **one `layerlock.config.ts` per package** you want to guard, colocated with that package’s **`tsconfig.json`** (the CLI resolves `root` from the config file directory by default). Legacy **`arch.config.*`** filenames are still discovered.
- Alternatively, use a single `tsconfig` that includes multiple roots if that matches how you build; see the [`examples/monorepo`](../examples/monorepo) fixture in this repository.

---

## Turborepo

Add a package script (for example `check:arch`) that runs `layerlock`. In `turbo.json`, define a task with **`"outputs": []`** unless you intentionally cache emitted graph files (`--graph-out`, or the default **`layerlock-layers.mmd`** / **`layerlock-layers.dot`** under the package root when using **`--graph`** without **`--graph-out`**).

---

## Nx

Nx provides its own module-boundary tooling. layerlock can still be used as a **portable**, TypeScript-centric check on the static import graph, including in packages or layouts Nx does not cover.

---

## GitHub Actions

An example workflow is maintained at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Typical ordering: install dependencies, then run `layerlock` (no application build is strictly required beforehand; layerlock uses the TypeScript program API directly).

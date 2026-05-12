# Why not ESLint? (and how layerlock fits next to other tools)

Teams often ask whether **ESLint** (or **Nx** module boundaries) already covers “architecture.” Sometimes it does; often it does not, or the cost of keeping rules aligned with TypeScript is too high. This page is a **practical comparison**, not a dismissal of those tools.

---

## ESLint (`eslint-plugin-boundaries`, `eslint-plugin-import`, custom rules)

**Strengths**

- Huge ecosystem; same runner as style and correctness rules.
- Can express many import restrictions with enough configuration.

**Where friction often appears**

- **tsconfig `paths` and project references**: duplicating or re-deriving resolver behavior so ESLint agrees with `tsc` is easy to get wrong.
- **Semantics**: rules tend to be **file-folder or tag** oriented; expressing **onion / layer intent** as first-class concepts often spreads across many plugins and overrides.
- **Monorepos**: multiple packages, multiple `tsconfig`s, and shared configs multiply maintenance.
- **Reporting**: useful for CI, but rarely optimized for **“which architectural rule did I break?”** as the primary story.

**What layerlock optimizes for**

- One job: **static import graph vs named layers and `cannotImport` rules**.
- Resolution through the **TypeScript program API** (same mental model as `tsc`).
- **Presets** for common backend layouts (Nest, clean/hexagonal, monorepo-shaped globs).
- **`layerlock explain`** for opaque failures: two files in, layer + allowed/forbidden out.

**Typical combo**

- **ESLint**: style, correctness, some import hygiene.
- **layerlock**: **architectural direction** and layer edges you care about in CI.

---

## dependency-cruiser

Excellent for **exploring and validating graphs**, rules, and reports across a repo. More **analysis and exploration** oriented.

**layerlock** is narrower: **layer boundaries** with a small **authoring API** (`layer().cannotImport()`) and **presets**. If you already live in dependency-cruiser and it does everything you need, you may not need layerlock; if you want a **minimal, TS-native layer check** next to `tsc`, layerlock stays small.

---

## Nx (`enforce-module-boundaries`)

First-class when you are **all-in on Nx** and tags on libraries. Very strong inside that model.

**layerlock** is **stack-agnostic**: Nest-only repos, plain npm workspaces, Turborepo without Nx, or Nx monorepos where you still want a **portable** TS graph check (`--discover` across packages). Use Nx boundaries where they fit; use layerlock where you want the same rule file next to **`tsconfig.json`** without Nx metadata.

---

## madge / graph-only tools

Great for **visualizing** dependencies. They do not, by themselves, **fail CI on named architectural rules** the way a small `layerlock.config.ts` plus layerlock does.

---

## ArchUnit-style tools (other ecosystems)

Conceptually similar **intent** (architecture as rules). **layerlock** is **TypeScript-first** and **import-graph-first**, without trying to be a full enterprise rule engine.

---

## Summary

| Need | Good default |
|------|----------------|
| Lint + style + many code-quality dimensions | **ESLint** |
| Deep graph exploration, custom dependency rules | **dependency-cruiser** |
| Nx workspace enforcement | **Nx** + tags |
| **Minimal TS-native “these layers must not import those” in CI** | **layerlock** |

If a comparison here feels unfair or out of date, open an issue or PR with a correction.

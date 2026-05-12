# Overview and rationale

This document explains **why** architectural boundaries drift, **what** layerlock validates, and **what** it deliberately does not attempt. For usage, see the [**project README**](../README.md); for other guides, see the [**documentation index**](README.md).

---

## The problem

Large TypeScript codebases often diverge from their intended architecture. Teams agree on layering or modularity in principle, but incremental changes introduce imports that violate those intentions: domain code reaches into infrastructure, HTTP handlers import persistence directly, or shared folders accumulate dependencies from every direction.

That drift has real cost: onboarding conflicts with the actual dependency graph, refactors create surprising coupling, and generic lint rules or manual review do not always match **how TypeScript resolves modules** (`paths`, `extends`, monorepos). Automated editing and code generation can add imports that compile but break the intended dependency direction, unless there is a **machine-checkable contract** and **clear failure output** in CI.

---

## What layerlock provides

The validation pipeline (layers, rules, **`tsconfig`**, static imports, reports) is described in the [**project README — How it works**](../README.md#how-it-works). In short: boundaries live in **`layerlock.config.ts`** (or legacy **`arch.config.ts`**), optional **presets**, and CI or local scripts — not only in informal docs.

---

## Out of scope

- **Nx module boundaries** — layerlock does not replace Nx’s graph-based rules in Nx-centric workflows; it can complement them as a portable TypeScript import check.
- **General-purpose dependency exploration** — the API is intentionally small (`layer().cannotImport(...)`, presets), not a full rule programming language.
- **Dynamic module loading** — only statically analyzable import sites (typically string literals) are in scope for the current MVP; dynamic `import(variable)` is not modeled.
- **Runtime behavior** — layerlock does not instrument or validate your process at runtime; it validates the **static** module graph.

---

## Limitations (MVP)

- Analysis is limited to **string-literal** static imports, `export … from`, `require("…")`, and `import("…")` forms the extractor supports.
- **Layer membership** is **first match wins** according to the order of keys in your `layers` object.

---

## See also

[Documentation index](README.md) · [Requirements](requirements.md) · [NestJS](nestjs.md) · [Express / minimal HTTP](express-plain-node.md) · [Monorepos and CI](monorepos-and-ci.md)

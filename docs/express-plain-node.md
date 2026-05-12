# Express and minimal HTTP frameworks

layerlock is **framework-agnostic**: it validates **static TypeScript imports** against **`layerlock.config.ts`** (legacy **`arch.config.*`** is still discovered). It works well with **Express**, **Fastify**, **Hono**, or custom HTTP stacks when you want **clear layering** without adopting a full application framework.

For installation, **`layerlock init`**, CLI flags, and presets, use the [**project README**](../README.md). This page maps **Express-style** (and similar) apps onto the same layer model.

---

## Role compared to Nest

| Concern | Nest | Minimal HTTP stack + layerlock |
|---------|------|----------------------------------|
| HTTP and DI | Built-in modules, decorators, container | Your choice (routers, manual composition, optional libraries such as Awilix) |
| Import-level boundaries | Not enforced on the TypeScript graph | Declared with **`layer().cannotImport(...)`** and enforced in CI |
| Operational weight | Larger framework surface | **layerlock** is a **devDependency**; no runtime coupling to it |

layerlock does **not** provide dependency injection or HTTP abstractions. It **does** enforce **allowed dependency directions** between folders (for example domain → use cases → infrastructure → presentation), which is often the structural property teams want from layering, independent of framework.

---

## Layout aligned with `layerlock init`

```bash
npx layerlock init --clean
# or: npx layerlock init --nest   # same directories; rules include default test/e2e exceptions
```

Typical directory roles:

| Path | Role |
|------|------|
| **`src/domain/`** | Entities, value objects, domain errors — no HTTP framework types, no database drivers |
| **`src/use-cases/`**, **`src/application/`** | Application services and orchestration |
| **`src/infrastructure/`** | Persistence, messaging, third-party clients — concrete implementations |
| **`src/presentation/`**, **`src/api/`** | HTTP adapters, routers, request/response mapping |

**Convention:** restrict **`express`** (or peers) to **`presentation`** and **`api`** so domain and use-case code stay independent of **`Request`** / **`Response`** types.

---

## Configuration example

```ts
import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.cleanArchitectureFourLayer({ baseDir: "src" }),
});
```

To extend a preset, spread it **once** and append to **`rules`** as needed. **`presets.nestRecommended()`** is valid **without** Nest: the name indicates **test-friendly default exceptions**, not a Nest runtime dependency.

For additional rules, import **`layer`** from **`layerlock`** and use **`exceptFrom`** where tests legitimately need broader imports.

---

## Express wiring without violating layers

1. **Bootstrap** — Create the application and mount routers (for example `src/presentation/server.ts` or `src/main.ts` included via a **`presentation`** glob).
2. **Routers** — Presentation files call **use cases** or **application** services; they should not import concrete repositories from **infrastructure** directly when your rules forbid it.
3. **Use cases** — Depend on **ports** (interfaces) implemented under **infrastructure**.

Example router sketch:

```ts
// presentation/users.router.ts
import { Router } from "express";
import { registerUser } from "../use-cases/register-user.js";

export const usersRouter = Router();
usersRouter.post("/", async (req, res) => {
  await registerUser(req.body);
  res.status(201).send();
});
```

Use **`ignoreFileGlobs`** on **`defineArchitecture`** for generated clients or routes you do not want analyzed.

---

## Commands

Install, scaffold, and validate are the same as in the [project README](../README.md#install-and-quick-start) and [§ Scaffold a layout](../README.md#scaffold-a-layout). For this stack, **`init --clean`** is the usual preset; **`init --nest`** uses the same directories with **test/e2e** rule exceptions preconfigured.

## See also

[Monorepos and CI](monorepos-and-ci.md) · [Project README: AI-assisted development](../README.md#ai-assisted-development)

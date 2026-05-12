# NestJS

layerlock analyzes the **static TypeScript import graph** of a Nest application. It **does not** replace Nest’s runtime dependency injection or `@Module()` metadata. It **complements** Nest by enforcing **which files may import which other files**, according to rules you declare in **`layerlock.config.ts`** (legacy **`arch.config.ts`** is still discovered).

For installation, CLI, presets, and **`layerlock init`**, use the [**project README**](../README.md). This page covers Nest-specific layering and **`presets.nestRecommended()`** only.

---

## What you gain

- **Nest** continues to own module wiring and providers (`@Module({ imports, providers })`).
- **Forbidden imports** between layers are caught by layerlock; Nest does not validate “may this TypeScript file import that file?”
- **Refactors and generated code** that introduce illegal cross-layer imports fail in CI with precise locations (`message`, file coordinates, and `hint`).
- **Path aliases** (`paths`, `extends`) are resolved the same way TypeScript resolves them for compilation.

Typical layering goals:

- Keep **domain** code from importing **TypeORM**, HTTP clients, or other **infrastructure** concerns.
- Keep **controllers** (or resolvers) from bypassing **application** services to reach repositories or drivers directly, when your folder layout reflects those roles.
- In **Nx + Nest** workspaces, layerlock can act as an additional or stricter **TypeScript-level** boundary check.

---

## What remains outside layerlock

- The **`@Module({ imports: [...] })` graph** at runtime — layerlock only sees **TypeScript imports** between source files.
- **`DynamicModule`**, **`forwardRef(() => X)`**, and similar patterns — targets that are not ordinary **string-literal** static imports may not appear in the analysis (the same limitation applies to most static TS tools).
- **Decorators** such as `@Injectable()` — boundaries are enforced on **`import`** relationships, not on decorator metadata alone.

Teams that rely heavily on dynamic `import(expression)` or opaque barrels should treat those edges as higher risk in review; layerlock still catches most accidental coupling.

---

## Recommended workflow

**Scaffold:** from the package root,

```bash
npx layerlock init --nest
```

This creates **`layerlock.config.ts`** using **`presets.nestRecommended()`** and the default four-layer directories under **`src/`**. Use **`--force`** only when you intend to replace an existing **`layerlock.config.ts`** (or legacy **`arch.config.ts`**).

**Layout:** organize folders by **architectural role**, not only by Nest artifact names, for example:

| Area | Typical contents |
|------|-------------------|
| `src/domain/**` | Entities, value objects, domain services |
| `src/application/**` | Use cases, application services |
| `src/infrastructure/**` | TypeORM repositories, external APIs, adapters |
| `src/presentation/**` | Controllers, GraphQL resolvers, HTTP-facing mapping |

Feature-based trees (`src/modules/<feature>/...`) are fine: express layers with **role** subfolders or **glob patterns** per concern.

**Configuration:** place **`layerlock.config.ts`** beside the **`tsconfig.json`** that builds the application you want to validate (often the API package root in a monorepo).

**CI:** run **`layerlock`** (or **`npm run layerlock`** / **`npm run layerlock check`** if your script is **`"layerlock": "layerlock"`**) after installing dependencies; a **`nest build`** is not required beforehand (layerlock uses the TypeScript program API). Example GitHub Actions and monorepo patterns: [**Monorepos and CI**](monorepos-and-ci.md).

---

## Nest-oriented features

### `presets.nestRecommended()`

Same four-layer onion as **`presets.cleanArchitectureFourLayer()`** (`domain` → `useCases` → `infrastructure` → `presentation`), with **default `exceptFrom` globs** on each **`cannotImport`** rule so unit tests, e2e tests, and common test directories can compose Nest testing utilities without repeating exceptions on every rule.

- Disable test relaxation: **`nestRecommended({ relaxRulesInTests: false })`**
- Customize test paths: **`nestRecommended({ testFileGlobs: ["**/*.e2e-spec.ts"] })`**
- Override layer globs: same **`globs`** shape as **`cleanArchitectureFourLayer`**

### Per-rule exceptions: `exceptFrom`

```ts
layer("domain").cannotImport("infrastructure", {
  exceptFrom: ["**/*.spec.ts", "test/**", "e2e/**"],
});
```

When the **source file** path (relative to project root) matches a pattern, that rule is skipped for that file.

### Global ignores: `ignoreFileGlobs`

On **`defineArchitecture`**, set **`ignoreFileGlobs`** (for example `["**/generated/**"]`) to exclude generated files from analysis entirely.

---

## Example configuration

**Preset-based (recommended starting point):**

```ts
import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.nestRecommended({ baseDir: "src" }),
});
```

Override globs when the default layout does not match your repository, for example **`nestRecommended({ globs: { domain: ["src/modules/**/domain/**/*.ts"], ... } })`**.

**Manual layers (full control):**

```ts
import { defineArchitecture, layer } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  layers: {
    domain: ["src/domain/**/*.ts"],
    application: ["src/application/**/*.ts"],
    infrastructure: ["src/infrastructure/**/*.ts"],
    presentation: ["src/presentation/**/*.ts", "src/**/*.controller.ts"],
  },
  rules: [
    layer("domain").cannotImport("application", "infrastructure", "presentation"),
    layer("application").cannotImport("infrastructure", "presentation"),
    layer("infrastructure").cannotImport("presentation"),
  ],
});
```

---

## CI and monorepos

Add a script such as **`check:arch`** that runs **`layerlock`** (see the [project README](../README.md#install-and-quick-start)). For **multiple packages**, **`--config`**, and CI wiring, use [**Monorepos and CI**](monorepos-and-ci.md).

## See also

- [Project README: presets and rules](../README.md#presets--rules)
- [Project README: CLI reference](../README.md#cli-reference)
- [Monorepos and CI](monorepos-and-ci.md)

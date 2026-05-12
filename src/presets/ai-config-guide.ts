/**
 * Copy this into an AI assistant when you want it to **author or refactor** `layerlock.config.ts`.
 * It describes the contract this library enforces at build time.
 */
export const LAYERLOCK_AI_CONFIG_GUIDE = `You are editing a Layer Lock (layerlock) configuration for a TypeScript repo.

Goal
- Declare named "layers" (picomatch globs relative to the layerlock.config.ts directory unless root is set).
- Declare rules: inner layers must not import outer layers (use presets when possible).
- The build runs: npx layerlock (or: npx layerlock check)
- Any violation prints file:line:column, rule, and hint; use -f json for tools.

API (TypeScript module layerlock.config.ts)
- import { defineArchitecture, layer, presets } from "layerlock"
- Nest-friendly: export default defineArchitecture({ tsconfig: "tsconfig.json", ...presets.nestRecommended() })
- Generic onion: ...presets.cleanArchitectureFourLayer({ baseDir: "src" })
- Custom onion: ...presets.layeredFromInnerToOuter({ layers: [...], globs: {...} })
- Escape hatch (tests, e2e): layer("domain").cannotImport("infra", { exceptFrom: ["**/*.spec.ts", "e2e/**"] })
- Skip generated files: ignoreFileGlobs: ["**/*.generated.ts"]

Output requirements
- Export default defineArchitecture({ ... }) OR a plain object with { layers, rules, tsconfig?, unassigned?, ignoreFileGlobs? }.
- Do NOT set root unless the user explicitly wants a non-default root; the CLI defaults root to the config directory.

When fixing violations reported by layerlock
- Read fromFile, toFile, specifier, message, and hint (JSON: -f json).
- Prefer moving code so dependencies point inward (toward domain), or introduce interfaces in the inner layer.
- Only relax layerlock.config if the user confirms the dependency is intentional.

Presets
- presets.nestRecommended({ baseDir?, globs?, relaxRulesInTests?, testFileGlobs? })
- presets.cleanArchitectureFourLayer({ baseDir?, globs?: {...} })
- presets.layeredFromInnerToOuter({ layers: ["a","b","c"], globs: { a: ["src/a/**"], ... } })
`;

/** @deprecated Use {@link LAYERLOCK_AI_CONFIG_GUIDE} */
export const ARCH_CHECK_AI_CONFIG_GUIDE = LAYERLOCK_AI_CONFIG_GUIDE;

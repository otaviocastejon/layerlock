import { defineArchitecture, layeredFromInnerToOuter, layer } from "layerlock";

/**
 * Demo layering for a Nest app: domain → atomic vs orchestration use cases → infra → integration → HTTP.
 * Extra rules tighten edges Nest often blurs (controller → repository, integration → HTTP).
 */
const { layers, rules } = layeredFromInnerToOuter({
  layers: [
    "domain",
    "useCasesAtomic",
    "useCasesOrchestration",
    "infrastructure",
    "integration",
    "presentation",
  ],
  globs: {
    domain: ["src/domain/**/*.ts"],
    useCasesAtomic: ["src/use-cases/atomic/**/*.ts"],
    useCasesOrchestration: ["src/use-cases/orchestration/**/*.ts"],
    infrastructure: ["src/infrastructure/**/*.ts"],
    integration: ["src/integration/**/*.ts"],
    presentation: ["src/**/*controller.ts", "src/main.ts"],
  },
});

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ignoreFileGlobs: ["**/node_modules/**", "**/dist/**", "**/*.spec.ts", "test/**"],
  layers,
  rules: [
    ...rules,
    layer("presentation").cannotImport(
      "infrastructure",
      "integration",
      "domain",
      "useCasesAtomic",
    ),
  ],
});

import { defineArchitecture, layer } from "../../src/index.ts";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  layers: {
    domain: ["src/domain/**/*.ts"],
    infra: ["src/infra/**/*.ts"],
    api: ["src/api/**/*.ts"],
    db: ["src/db/**/*.ts"],
  },
  rules: [
    layer("domain").cannotImport("infra", "api", "db"),
    layer("api").cannotImport("db"),
  ],
});

import { defineArchitecture, layer } from "../../src/index.ts";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  layers: {
    api: ["packages/api/**/*.ts"],
    domain: ["packages/domain/**/*.ts"],
    infra: ["packages/infra/**/*.ts"],
  },
  rules: [layer("api").cannotImport("infra"), layer("domain").cannotImport("infra")],
});

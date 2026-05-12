/**
 * Programmatic API smoke against the published `layerlock` package surface.
 * Run from fixture root: `node scripts/layerlock-api-smoke.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  ARCH_CHECK_AI_CONFIG_GUIDE,
  CONFIG_FILE_NAMES,
  LAYERLOCK_AI_CONFIG_GUIDE,
  archCheck,
  assignLayer,
  buildReportSummary,
  cleanArchitectureFourLayer,
  collectImportSites,
  dddLite,
  findAllArchConfigFiles,
  findAllLayerlockConfigFiles,
  findConfigPath,
  formatArchCheckText,
  formatJsonReport,
  formatLayerlockText,
  formatTextReport,
  hexagonal,
  layer,
  layerEdgesToDot,
  layerEdgesToMermaid,
  layeredFromInnerToOuter,
  layerlockCheck,
  loadArchitectureConfigFile,
  mergeForbiddenBySource,
  nestRecommended,
  nxStyle,
  presets,
  resolveToValidatedArchitecture,
  sortViolationsStable,
  toPosixDisplayPath,
  validate,
} from "layerlock";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(CONFIG_FILE_NAMES.includes("layerlock.config.ts"), "CONFIG_FILE_NAMES should list layerlock.config.ts");
assert(typeof LAYERLOCK_AI_CONFIG_GUIDE === "string" && LAYERLOCK_AI_CONFIG_GUIDE.length > 200, "AI guide string");
assert(typeof ARCH_CHECK_AI_CONFIG_GUIDE === "string", "deprecated ARCH_CHECK_AI_CONFIG_GUIDE alias");

const hex = presets.hexagonal({ baseDir: "src" });
assert(hex.rules.length >= 1, "hexagonal preset should emit rules");
assert(hexagonal === presets.hexagonal, "hexagonal named export matches presets.hexagonal");
assert(typeof presets.nestRecommended === "function", "presets.nestRecommended");
assert(nestRecommended().rules.length >= 1, "nestRecommended preset");
assert(cleanArchitectureFourLayer().layers.domain, "cleanArchitectureFourLayer preset");
assert(dddLite().layers.domain, "dddLite preset");
assert(nxStyle().layers.foundation, "nxStyle preset");
const custom = layeredFromInnerToOuter({
  layers: ["inner", "outer"],
  globs: { inner: ["src/_unused_inner/**"], outer: ["src/_unused_outer/**"] },
});
assert(custom.rules.length === 1, "layeredFromInnerToOuter");
const built = layer("inner").cannotImport("outer");
assert(built.kind === "cannotImport" && built.forbiddenLayers.includes("outer"), "layer().cannotImport()");
const schemaPath = require.resolve("layerlock/schema");
assert(fs.existsSync(schemaPath), "layerlock/schema should resolve on disk");

const cfgPath = path.join(root, "layerlock.config.ts");
assert(findConfigPath(root) === cfgPath, "findConfigPath(fixture root) should resolve main config");

const allConfigs = findAllLayerlockConfigFiles(root);
assert(allConfigs.length >= 3, `expected multiple configs for discover smoke, got ${String(allConfigs.length)}`);
assert(findAllArchConfigFiles(root).length === allConfigs.length, "findAllArchConfigFiles alias should match");

const raw = await loadArchitectureConfigFile(cfgPath);
const validated = resolveToValidatedArchitecture(raw, cfgPath);
assert(validated.root === root, "validated root should match fixture directory");

const fromDomain = path.join(root, "src/domain/user.ts");
const fromApp = path.join(root, "src/application/get-user.ts");
assert(assignLayer(fromDomain, validated.root, validated.layers) === "domain", "assignLayer domain");
assert(assignLayer(fromApp, validated.root, validated.layers) === "application", "assignLayer application");

const result = validate(validated);
assert(result.violations.length === 0, "validate() should report no violations for this fixture");
assert(Array.isArray(result.layerEdges), "layerEdges should be an array");

const summary = buildReportSummary(result);
assert(summary.forbiddenImports === 0, "summary.forbiddenImports");
assert(sortViolationsStable([]).length === 0, "sortViolationsStable empty");

const posix = toPosixDisplayPath(fromDomain, validated.root);
assert(posix.startsWith("src/"), `toPosixDisplayPath should be repo-relative: ${posix}`);

const mmd = layerEdgesToMermaid(result.layerEdges);
const dot = layerEdgesToDot(result.layerEdges);
assert(mmd.includes("flowchart") || mmd.includes("graph"), "mermaid output");
assert(dot.includes("digraph"), "dot output");

const text = formatTextReport(result, validated.root, { stable: true });
assert(text.includes("OK"), "formatTextReport");

const json = formatJsonReport(result, validated.root, { ciDiff: true });
assert(JSON.parse(json).violations.length === 0, "formatJsonReport ciDiff parse");

const run = await layerlockCheck({ cwd: root });
assert(run.ok, "layerlockCheck ok");
const layered = formatLayerlockText(run);
assert(layered.includes("OK"), "formatLayerlockText");

const legacyRun = await archCheck({ cwd: root });
assert(legacyRun.ok, "archCheck deprecated alias");
assert(formatArchCheckText(legacyRun) === layered, "formatArchCheckText matches formatLayerlockText");

const merged = mergeForbiddenBySource(validated.rules);
assert(merged.get("domain")?.has("adapters"), "mergeForbiddenBySource should map domain -> adapters");

const samplePath = path.join(root, "src/application/get-user.ts");
const sf = ts.createSourceFile(
  samplePath,
  fs.readFileSync(samplePath, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
const sites = collectImportSites(sf);
assert(sites.some((s) => s.specifier.includes("domain")), "collectImportSites should find local imports");

// eslint-disable-next-line no-console -- intentional smoke harness
console.log("layerlock-api-smoke: all programmatic checks passed.");

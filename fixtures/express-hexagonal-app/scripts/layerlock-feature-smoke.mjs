/**
 * CLI smoke: exercises layerlock flags and subcommands used from this fixture.
 * Run from fixture root: `node scripts/layerlock-feature-smoke.mjs`
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cli = path.join(root, "node_modules/layerlock/dist/cli.js");

function run(args, { expectExit = 0 } = {}) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  const code = r.status ?? 1;
  if (code !== expectExit) {
    throw new Error(
      `layerlock ${args.join(" ")}: expected exit ${String(expectExit)}, got ${String(code)}.\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`,
    );
  }
}

function runCapture(args) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(
      `layerlock ${args.join(" ")} failed (exit ${String(r.status)}).\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`,
    );
  }
  return `${r.stdout}${r.stderr}`;
}

function rmTmp() {
  const d = path.join(root, ".tmp");
  fs.rmSync(d, { recursive: true, force: true });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

rmTmp();
fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });

// Default validate + optional "check" / "validate" token stripping
run([]);
run(["check"]);
run(["validate"]);

// Output modes
const textStable = runCapture(["--stable"]);
assert(textStable.includes("layerlock: OK"), "stable text should report OK");

const json = JSON.parse(runCapture(["-f", "json"]));
assert(Array.isArray(json.violations), "json should include violations array");
assert(json.violations.length === 0, "fixture should have zero violations");

const jsonCi = JSON.parse(runCapture(["--ci-diff", "-f", "json"]));
assert(Array.isArray(jsonCi.violations), "ci-diff json should include violations");
assert(jsonCi.summary && typeof jsonCi.summary.forbiddenImports === "number", "ci-diff json should include summary");

// Pinned config path
run(["-c", "layerlock.config.ts"]);

// Layer graphs (single-package only; stderr announces output path)
run(["--graph", "mermaid", "--graph-out", ".tmp/layers.mmd"]);
assert(fs.existsSync(path.join(root, ".tmp/layers.mmd")), "mermaid graph file should exist");

run(["--graph", "dot", "--graph-out", ".tmp/layers.dot"]);
assert(fs.existsSync(path.join(root, ".tmp/layers.dot")), "dot graph file should exist");

// Discover every config under this fixture (root + packages/demo-widget + legacy arch.config)
const discoverOut = runCapture(["--discover", "--stable"]);
const discoverBlocks = (discoverOut.match(/\n=== /g) || []).length;
assert(discoverBlocks >= 3, `discover should print a section per config (>=3), got ${String(discoverBlocks)}:\n${discoverOut.slice(0, 800)}`);

// Explain: allowed (ports may depend on domain)
runCapture(["explain", "src/ports/user-repository.port.ts", "src/domain/user.ts"]);

// Explain: forbidden (domain must not depend on ports)
run(["explain", "src/domain/user.ts", "src/ports/user-repository.port.ts"], { expectExit: 1 });

// Explain: forbidden (application must not depend on adapters / infrastructure)
run(
  ["explain", "src/application/get-user.ts", "src/infrastructure/in-memory-user-repository.ts"],
  { expectExit: 1 },
);

// Help surfaces (exit 0, no scaffold)
runCapture(["--help"]);
runCapture(["explain", "--help"]);
runCapture(["init", "--help"]);

// npm-style extra "check" token (see CLI parseArgv)
runCapture(["check", "-f", "json"]);

// eslint-disable-next-line no-console -- intentional smoke harness
console.log("layerlock-feature-smoke: all CLI checks passed.");

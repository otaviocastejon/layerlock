import fs from "node:fs";
import path from "node:path";

/** Matches default globs from `cleanArchitectureFourLayer` / `nestRecommended` with `baseDir: "src"`. */
export const DEFAULT_SCAFFOLD_DIRS = [
  "src/domain",
  "src/use-cases",
  "src/application",
  "src/infrastructure",
  "src/presentation",
  "src/api",
] as const;

/** Default folders for `presets.hexagonal()` (`adapters` preset glob also matches `src/infrastructure/**`). */
export const HEXAGONAL_SCAFFOLD_DIRS = [
  "src/domain",
  "src/ports",
  "src/application",
  "src/adapters",
  "src/infrastructure",
] as const;

const ARCH_NEST = `import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.nestRecommended({ baseDir: "src" }),
});
`;

const ARCH_CLEAN = `import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.cleanArchitectureFourLayer({ baseDir: "src" }),
});
`;

const ARCH_HEXAGONAL = `import { defineArchitecture, presets } from "layerlock";

export default defineArchitecture({
  tsconfig: "tsconfig.json",
  ...presets.hexagonal({ baseDir: "src" }),
});
`;

const DEFAULT_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "rootDir": ".",
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "layerlock.config.ts", "arch.config.ts"]
}
`;

export type InitFlavor = "nest" | "clean" | "hexagonal";

export interface InitScaffoldOptions {
  cwd: string;
  flavor: InitFlavor;
  force: boolean;
}

/**
 * Writes `layerlock.config.ts`, creates default layer directories (with `.gitkeep`),
 * and adds a minimal `tsconfig.json` only if one is missing.
 */
export function runInitScaffold(options: InitScaffoldOptions): void {
  const configPath = path.join(options.cwd, "layerlock.config.ts");
  if (fs.existsSync(configPath) && !options.force) {
    throw new Error(
      "layerlock.config.ts already exists. Remove it, or re-run with --force to overwrite.",
    );
  }

  const body =
    options.flavor === "nest"
      ? ARCH_NEST
      : options.flavor === "hexagonal"
        ? ARCH_HEXAGONAL
        : ARCH_CLEAN;
  fs.writeFileSync(configPath, body, "utf8");

  const dirs = options.flavor === "hexagonal" ? HEXAGONAL_SCAFFOLD_DIRS : DEFAULT_SCAFFOLD_DIRS;
  for (const dir of dirs) {
    const full = path.join(options.cwd, dir);
    fs.mkdirSync(full, { recursive: true });
    const keep = path.join(full, ".gitkeep");
    if (!fs.existsSync(keep)) {
      fs.writeFileSync(keep, "", "utf8");
    }
  }

  const tsconfigPath = path.join(options.cwd, "tsconfig.json");
  let wroteTsconfig = false;
  if (!fs.existsSync(tsconfigPath)) {
    fs.writeFileSync(tsconfigPath, `${DEFAULT_TSCONFIG}\n`, "utf8");
    wroteTsconfig = true;
  }

  process.stdout.write(
    [
      `Created layerlock.config.ts (${
        options.flavor === "nest"
          ? "presets.nestRecommended"
          : options.flavor === "hexagonal"
            ? "presets.hexagonal"
            : "presets.cleanArchitectureFourLayer"
      }).`,
      `Created layer folders under src/ (see ${dirs.join(", ")}).`,
      wroteTsconfig ? "Created minimal tsconfig.json (no tsconfig was present)." : "Left existing tsconfig.json unchanged.",
      "",
      "Next: npm i -D layerlock typescript",
      "Then: npx layerlock   (or: npm run layerlock if your package.json has a script)",
      "",
    ].join("\n"),
  );
}

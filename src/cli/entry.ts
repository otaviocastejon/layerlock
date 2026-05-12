import { parseArgv, printCliHelp, printExplainHelp, printInitHelp } from "./parse-args.js";
import { runInitScaffold } from "./init-scaffold.js";
import { runCli } from "./run.js";
import { runExplain } from "./explain.js";

const cwd = process.cwd();

void (async () => {
  try {
    const parsed = parseArgv(process.argv.slice(2));

    if (parsed.kind === "init") {
      if (parsed.options.help) {
        printInitHelp();
        process.exit(0);
      }
      runInitScaffold({
        cwd,
        flavor: parsed.options.flavor,
        force: parsed.options.force,
      });
      process.exit(0);
    }

    if (parsed.kind === "explain") {
      if (parsed.options.help) {
        printExplainHelp();
        process.exit(0);
      }
      const code = await runExplain(cwd, {
        from: parsed.options.from,
        to: parsed.options.to,
        configPath: parsed.options.configPath,
      });
      process.exit(code);
    }

    if (parsed.options.help) {
      printCliHelp();
      process.exit(0);
    }

    const code = await runCli(cwd, parsed.options);
    process.exit(code);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
})();

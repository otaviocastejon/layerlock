import { describe, expect, it } from "vitest";
import { parseArgv, parseInitArgs } from "./parse-args.js";

describe("parseInitArgs", () => {
  it("parses --nest and --force", () => {
    expect(parseInitArgs(["--nest", "--force"])).toEqual({
      flavor: "nest",
      force: true,
      help: false,
    });
  });

  it("parses --hexagonal", () => {
    expect(parseInitArgs(["--hexagonal"])).toEqual({
      flavor: "hexagonal",
      force: false,
      help: false,
    });
  });

  it("treats --clean-arch like --clean", () => {
    expect(parseInitArgs(["--clean-arch"])).toEqual({
      flavor: "clean",
      force: false,
      help: false,
    });
  });

  it("requires exactly one flavor", () => {
    expect(() => parseInitArgs([])).toThrow(/exactly one/);
    expect(() => parseInitArgs(["--nest", "--clean"])).toThrow(/exactly one/);
    expect(() => parseInitArgs(["--nest", "--hexagonal"])).toThrow(/exactly one/);
  });
});

describe("parseArgv", () => {
  it("routes init subcommand", () => {
    expect(parseArgv(["init", "--clean"]).kind).toBe("init");
  });

  it("routes init --hexagonal", () => {
    const p = parseArgv(["init", "--hexagonal"]);
    expect(p.kind).toBe("init");
    if (p.kind === "init") expect(p.options.flavor).toBe("hexagonal");
  });

  it("routes explain subcommand", () => {
    expect(parseArgv(["explain", "a.ts", "b.ts"]).kind).toBe("explain");
  });

  it("accepts optional check subcommand before flags", () => {
    const p = parseArgv(["check", "--stable"]);
    expect(p.kind).toBe("check");
    if (p.kind === "check") expect(p.options.stable).toBe(true);
  });

  it("strips redundant check when npm appends an extra check (script was layerlock check)", () => {
    const p = parseArgv(["check", "check", "--stable"]);
    expect(p.kind).toBe("check");
    if (p.kind === "check") expect(p.options.stable).toBe(true);
  });

  it("routes check by default", () => {
    expect(parseArgv(["-h"]).kind).toBe("check");
  });
});

describe("parseCliArgs", () => {
  it("rejects --discover together with --config", () => {
    expect(() => parseArgv(["--discover", "-c", "x/arch.config.ts"])).toThrow(/not both/);
  });

  it("parses --watch and --stable", () => {
    const p = parseArgv(["--watch", "--stable"]);
    expect(p.kind).toBe("check");
    if (p.kind === "check") {
      expect(p.options.watch).toBe(true);
      expect(p.options.stable).toBe(true);
    }
  });

  it("parses --ci-diff", () => {
    const p = parseArgv(["--ci-diff"]);
    expect(p.kind).toBe("check");
    if (p.kind === "check") expect(p.options.ciDiff).toBe(true);
  });
});

# Contributing to layerlock

Thank you for your interest in the project. This document describes how to work on the repository and how releases are prepared.

---

## Development

```bash
npm ci
npm run build
npm test
npm run lint
```

---

The **`fixtures/`** directory (if present on your machine) is **gitignored** and not published to GitHub — keep local scratch apps there if you need them.

## Source layout

| Directory | Responsibility |
|-----------|----------------|
| [`src/config/`](src/config/) | Configuration model, `defineArchitecture`, config discovery, `jiti` loader |
| [`src/analysis/`](src/analysis/) | TypeScript program wiring, import extraction, validation |
| [`src/report/`](src/report/) | Text and JSON reports, Mermaid and DOT graph emitters |
| [`src/public-api/`](src/public-api/) | `layerlockCheck()` and related orchestration |
| [`src/cli/`](src/cli/) | CLI entrypoint and argument parsing |
| [`src/presets/`](src/presets/) | Built-in presets and `LAYERLOCK_AI_CONFIG_GUIDE` |

---

## Publishing (maintainers)

1. Confirm **`repository`**, **`homepage`**, and **`bugs`** in [`package.json`](package.json) match your GitHub repo (update if you fork or rename).
2. Run **`npm run build`** (also runs on **`prepack`**).
3. Publish with **`npm publish --access public`** (use **`--access public`** when the package name is scoped but the package is public).

A commented tag-release workflow template lives at [`.github/workflows/gitflow-release.yml.disabled`](.github/workflows/gitflow-release.yml.disabled); rename and uncomment when you are ready to automate publishes from git tags.

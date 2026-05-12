# Examples (copy-paste starters)

Small **self-contained** projects under this folder show real **`layerlock.config.ts`** setups and **forbidden imports** you can run locally.

| Example | What it shows |
|---------|----------------|
| [**simple**](simple/) | Single package: `domain` / `api` / `infra` layers, one intentional violation, `npm run layerlock`. |
| [**monorepo**](monorepo/) | npm workspaces + `paths`: API code imports domain; check flags **cross-layer** issues the way `tsc` resolution sees them. |

From the repo root:

```bash
cd examples/simple && npm i && npm run layerlock
cd examples/monorepo && npm i && npm run layerlock
```

For **Nest**-shaped layouts and **`layerlock init --nest`**, see [**docs/nestjs.md**](../docs/nestjs.md) and the **`fixtures/nest-app`** tree in this repository (used in development tests).

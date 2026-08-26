---
name: nodes-dev
description: "Develop and verify the standalone Nodes repository, its Core, Editor, Layout, Worker, UI, and centralized static Storybook. Use metafor-dev only for product integration."
---

# Nodes development

Built for [MetaFor](https://github.com/zavx0z/metafor) as reusable node-system infrastructure.

Use the exact Nodes checkout supplied for the task. Preserve its branch or detached HEAD, unrelated changes, listeners, and browser targets. `@nodes/storybook` owns one no-HMR process, one origin, and one target; package isolation comes from routes and separate bundles rather than extra servers.

Before changing a contract, read repository `ARCHITECTURE.md`, the owning package `requirements.md` or layout requirement, public types, and focused tests. A new law belongs in its real owner before implementation.

The shared HTML shell declares one Engine-owned `engine-default-font` meta URL.
Editor and UI pages call `UiRuntime.create()` without a package font path; a
custom runtime font bypasses the meta request. The build copies one exact Engine
asset into application output, while production Nodes packages never own or
eagerly load it.

## Package catalog

| Package page | Overview | Presentation |
| --- | --- | --- |
| catalog | `/` | DOM package catalog |
| `@nodes/core` | `/core/` | DOM runtime/document |
| `@nodes/editor` | `/editor/` | WebGPU authoring editor |
| `@nodes/layout` | `/layout/` | WebGPU Workbench + numeric policies |
| `@nodes/worker` | `/worker/` | DOM wire protocol |
| `@nodes/ui` | `/ui/` | WebGPU story catalog |

Every overview ends in `/`; exact leaves do not. Unknown suffixes fail closed.

- Read [references/catalog-dom.md](references/catalog-dom.md) for catalog, Core, and Worker evidence.
- Read [references/editor-webgpu.md](references/editor-webgpu.md) for authoring, cache, and topology evidence.
- Read [references/layout-webgpu.md](references/layout-webgpu.md) for fixed, adaptive and top-down Workbench evidence.
- Read [references/ui-webgpu.md](references/ui-webgpu.md) for Node UI, accepted-reference readiness, and retained evidence.

## Lifecycle

```bash
SKILL=.agents/skills/nodes-dev
"$SKILL/scripts/nodes-dev.sh" status  "$PWD"
"$SKILL/scripts/nodes-dev.sh" ensure  "$PWD"
"$SKILL/scripts/nodes-dev.sh" restart "$PWD"
```

Run read-only `status` first and `ensure` before the first lifecycle or browser operation. `ensure`, `start`, and `restart` may remain foreground owners of the exact Bun child, so retain their long-lived PTY. Foreign listeners are never adopted or stopped.

For an isolated test that must not inspect the real browser, use tests, typecheck, the static build, and an ephemeral HTTP server. `NODES_DEV_TEST_MODE=1` permits a separate lifecycle port; browser actions additionally require an explicitly isolated `NODES_DEV_CDP_PORT`.

If the request forbids starting or stopping any process, do not run lifecycle commands beyond `status`, browser helpers, `server.test.ts`, the static HTTP smoke, or any broad test selection that may spawn Bun. Use typecheck and only focused pure tests whose implementation has been inspected for process creation.

After an applicable change under `packages/**` or a linked Engine, Layout, or UI dependency, finish a stable source checkpoint, restart once, and reload every route needed for evidence.

## Background browser evidence

```bash
bun "$SKILL/scripts/nodes-browser.ts" targets "$PWD"
bun "$SKILL/scripts/nodes-browser.ts" reload "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" canvas "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id" \
  --output /tmp/nodes-layout-coffman-graham.png
```

Run `targets` first. Open `/` only when the origin has no target. Multiple targets are explicit ambiguity. The helpers never focus an OS window. Catalog, Core and Worker reject canvas, touch, profile, and interaction actions. Editor, Layout and UI require an exact non-black `#nodes-storybook-canvas`; package-specific interaction plans remain explicit.

## Static and acceptance evidence

`bun run build` must produce a self-contained `dist` for Pages base `/node/`,
including all six page shells, lazy chunks, the Engine font, accepted reference
catalog and raster, fail-closed deep-link recovery, and schema-1 manifest with
exact revisions, emitted sizes and SHA-256 hashes. The shared shell shows the
Russian `Главная` action and `Создано для MetaFor` footer without a floating
header badge over the work area.

GitHub Pages deployment is manual and owner-gated. Never dispatch
`.github/workflows/pages.yml`, run `gh workflow run`, change repository Pages
settings, or deploy an artifact unless the owner explicitly requests deployment
in the current task. `bun run build` and checks verify `dist`; they do not
authorize publishing it.

Tests and typechecks prove package contracts. DOM, console, page, and canvas evidence prove only the exact route and target. Reference assets remain evidence-only; automated captures do not become owner acceptance. Product runtime behavior and GPU timing require their own scoped verification.

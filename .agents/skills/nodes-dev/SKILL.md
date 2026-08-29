---
name: nodes-dev
description: "Develop and verify the standalone Nodes repository and its Core, Editor, Layout, Worker, UI, external declarations, and package-specific acceptance semantics."
---

# Nodes development

Built for [MetaFor](https://github.com/zavx0z/metafor) as reusable node-system infrastructure.

Use the exact Nodes checkout supplied for the task. Preserve its branch or detached HEAD, unrelated changes, listeners, and browser targets. Nodes publishes only project/package declarations and owner resources; the global `$storybook` owns the one external server, shared Workbench and exact package tabs.

Before changing a contract, read repository `ARCHITECTURE.md`, the owning package `requirements.md` or layout requirement, public types, and focused tests. A new law belongs in its real owner before implementation.

The external shell owns the Engine font and DOM-to-WebGPU renderer. Nodes
runtimes receive the shell's exact `@zavx0z/dom` Document/canvas context and
mount only owner story nodes. Production packages never own or eagerly load a
font, Storybook shell or renderer.

## Workbench catalog

| Package | Historical route prefix | Secondary content |
| --- | --- | --- |
| `NodeTree` | `/core/` | Core runtime scenarios |
| `NodeTreeEditor` | `/editor/` | authoring scenarios |
| `Раскладка` | `/layout/` | Fixed, Adaptive, Dagre Layered, Coffman–Graham |
| `Worker` | `/worker/` | exact worker policies |
| Node UI owners | `/ui/` | NodeEditor, Parameters, Sockets, Frame, Link, Comparison |

The project declaration is `.storybook/manifest.json`; package declarations
live under `packages/<owner>/.storybook/`. Each package opens in its own tab in
the one external origin. Package/category/subject overviews are real states and
never substitute a first variant. Exact leaves retain all 159 historical route
strings. Former section prefixes are grouping metadata with explicit remaps in
`.storybook/overview-remap.json`, not another navigation panel.

- Read [references/workbench-sections.md](references/workbench-sections.md) for the shared catalog hierarchy and Core/Worker evidence.
- Read [references/editor-webgpu.md](references/editor-webgpu.md) for authoring, cache, and topology evidence.
- Read [references/layout-webgpu.md](references/layout-webgpu.md) for fixed, adaptive and top-down Workbench evidence.
- Read [references/ui-webgpu.md](references/ui-webgpu.md) for Node UI, accepted-reference readiness, and retained evidence.

## Storybook boundary

Use the single global `$storybook` against the Nodes project declaration for
attach/check/open and exact-route browser evidence. This skill contains no
lifecycle/browser scripts, selector, port, process state or copied generic
Storybook rules. There is no `@nodes/storybook` package or package-local server.

Each Nodes package remains semantic owner of its category/subject/dock order,
stories, accepted reference readiness, cache/topology interaction plans and
route-specific observations. No package creates a router, canvas, Workbench,
server or DOM shell. The references above contain only domain evidence;
`$storybook` supplies generic lifecycle and safety laws.

At handoff report affected Nodes owners, focused and repository checks, exact
route-specific evidence where applicable, and every remaining product or owner
gate.

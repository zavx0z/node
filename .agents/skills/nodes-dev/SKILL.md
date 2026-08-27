---
name: nodes-dev
description: "Develop and verify the standalone Nodes repository and its Core, Editor, Layout, Worker, UI, and package-specific acceptance semantics. Use the global storybook skill for @nodes/storybook and metafor-dev only for product integration."
---

# Nodes development

Built for [MetaFor](https://github.com/zavx0z/metafor) as reusable node-system infrastructure.

Use the exact Nodes checkout supplied for the task. Preserve its branch or detached HEAD, unrelated changes, listeners, and browser targets. `@nodes/storybook` owns one Nodes catalog inside one shared Workbench; the global `$storybook` owns its package-named lifecycle and exact browser target.

Before changing a contract, read repository `ARCHITECTURE.md`, the owning package `requirements.md` or layout requirement, public types, and focused tests. A new law belongs in its real owner before implementation.

The shared HTML shell declares one Engine-owned `engine-default-font` meta URL.
Only the root entry calls `UiRuntime.create()` without a package font path;
Editor and UI adapters reuse that runtime. A custom runtime font bypasses the
meta request. The build copies one exact Engine asset into application output,
while production Nodes packages never own or eagerly load it.

## Workbench catalog

| Primary section | Overview | Secondary content |
| --- | --- | --- |
| `NodeTree` | `/core/` | Core runtime scenarios |
| `NodeTreeEditor` | `/editor/` | authoring scenarios |
| `Раскладка` | `/layout/` | Fixed, Adaptive, Dagre Layered, Coffman–Graham |
| `Worker` | `/worker/` | exact worker policies |
| Node UI owners | `/ui/` | NodeEditor, Parameters, Sockets, Frame, Link, Comparison |

`/` opens the same Workbench with the representative Core overview. It is not a
landing page and contains no package cards. Every overview ends in `/`; exact
leaves do not. A primary overview shows common information and every secondary
item; a secondary overview shows all variants. It never renders the first leaf
as a hidden fallback. Unknown suffixes fail closed.

- Read [references/workbench-sections.md](references/workbench-sections.md) for the shared catalog hierarchy and Core/Worker evidence.
- Read [references/editor-webgpu.md](references/editor-webgpu.md) for authoring, cache, and topology evidence.
- Read [references/layout-webgpu.md](references/layout-webgpu.md) for fixed, adaptive and top-down Workbench evidence.
- Read [references/ui-webgpu.md](references/ui-webgpu.md) for Node UI, accepted-reference readiness, and retained evidence.

## Storybook boundary

Use the single global `$storybook` with exact package `@nodes/storybook` for
lifecycle, automatic origin, static build, exact-route browser evidence,
interaction and profiling. This skill contains no lifecycle/browser scripts,
selector, port, process state or copied generic Storybook rules.

Nodes remains the semantic owner of primary/secondary/dock hierarchy, owner
stories, accepted reference readiness, cache/topology interaction plans and
route-specific expected observations. No package creates a second router,
canvas, `UiRuntime`, Workbench or DOM shell. The references above contain only
domain evidence; `$storybook` supplies all generic commands and safety laws.

At handoff report affected Nodes owners, focused and repository checks, exact
route-specific evidence where applicable, and every remaining product or owner
gate.

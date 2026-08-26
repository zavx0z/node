---
name: nodes-dev
description: "Develop and verify the standalone Nodes repository and its Core, Editor, Layout, Worker, UI, and package-specific acceptance semantics. Use the global storybook skill for @nodes/storybook and metafor-dev only for product integration."
---

# Nodes development

Built for [MetaFor](https://github.com/zavx0z/metafor) as reusable node-system infrastructure.

Use the exact Nodes checkout supplied for the task. Preserve its branch or detached HEAD, unrelated changes, listeners, and browser targets. `@nodes/storybook` owns the Nodes catalog and package pages; the global `$storybook` owns their package-named lifecycle and exact browser target.

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

## Storybook boundary

Use the single global `$storybook` with exact package `@nodes/storybook` for
lifecycle, automatic origin, static build, exact-route browser evidence,
interaction and profiling. This skill contains no lifecycle/browser scripts,
selector, port, process state or copied generic Storybook rules.

Nodes remains the semantic owner of package catalog order, DOM/WebGPU page
meaning, accepted reference readiness, cache/topology interaction plans and
route-specific expected observations. The references above contain only that
domain evidence; `$storybook` supplies all generic commands and safety laws.

At handoff report affected Nodes owners, focused and repository checks, exact
route-specific evidence where applicable, and every remaining product or owner
gate.

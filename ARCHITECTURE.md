# Nodes architecture

**Built for [MetaFor](https://github.com/zavx0z/metafor), while keeping the node-system core reusable for independent agents, complex systems, and immersive applications.**

## Position in the repository family

```text
MetaFor product integration
  └─ @nodes/storybook and product adapters
       ├─ @nodes/ui ────────────────> @ui/components / @ui/elements
       │      └─────────────────────> @layout/core ─> @engine/core
       ├─ @nodes/editor ────────────> @nodes/core
       ├─ @nodes/worker ────────────> @nodes/layout
       └─ @nodes/layout + @nodes/core
```

The direction is intentionally acyclic. Core does not know about layout, workers, WebGPU, or products. Editor changes Core without importing a solver. UI receives an already positioned projection or an explicit projector adapter. Storybook is the only package that composes every owner.

Cross-repository owners:

| Owner | Repository | Contract consumed by Nodes |
| --- | --- | --- |
| Engine | [zavx0z/engine](https://github.com/zavx0z/engine) | `@engine/core` retained scene and renderer |
| Layout UI runtime | [zavx0z/layout](https://github.com/zavx0z/layout) | `@layout/core` runtime, surfaces, Flex, and polyline geometry |
| UI | [zavx0z/ui](https://github.com/zavx0z/ui) | `@ui/elements`, `@ui/components`, and `@ui/storybook` |
| Nodes | [zavx0z/node](https://github.com/zavx0z/node) | graph, editor, solver, worker, view, and Storybook packages |
| Product | [zavx0z/metafor](https://github.com/zavx0z/metafor) | authorized product integration only |

## Workspace boundaries

### `@nodes/core`

Core owns `NodeTree → Frame / Node → Parameter → Socket → Link`. Parameter is the only store of its value. `snapshot()` is JSON-compatible; `document()` is ID-addressed authoring data; `project()` coordinates cacheable derived views. Selection, viewport, pan, zoom, hover, and rendering never enter canonical graph state.

### `@nodes/editor`

Editor creates bounded forward and inverse JSON Patch operations against a fresh document and exact expected revision. A successful structural command performs one Core reconcile. Layout freshness is explicit and solver-free.

### `@nodes/layout`

Layout accepts only finite numeric graph data. Fixed and adaptive policies own placement, socket sides, compound boundaries, route clearance, deterministic ordering, and machine-readable failure witnesses. It never reads a live NodeTree or renderer.

### `@nodes/worker`

Worker owns structured-clone-safe transports and exact fixed/adaptive client and executor entrypoints. Client bundles contain no solver. There are no compatibility package aliases or legacy package paths.

### `@nodes/ui`

UI owns retained NodeCanvas and NodeEditor views, render-plan contracts, culling, picking, selection, interaction, and the neutral node-view presets. Public entrypoints are `node`, `projection`, `node-editor`, `parameter`, and `link-curve`; source-branded identifiers and compatibility re-exports are not part of the API.

### `@nodes/storybook`

Storybook consumes only public package entrypoints. Its DOM, SVG, and WebGPU pages remain independent bundles. Static output uses `/node/`, copies the accepted reference catalog verbatim, and keeps raster evidence outside production exports.

## Naming and icon associations

Directory and file names are lowercase; multiword names use kebab-case. Story entrypoints end in `.stories.ts`. The source tree follows semantic names recognized by the Atom Material UI association vocabulary without copying its icon assets:

| Name | Association |
| --- | --- |
| `packages` | Packages |
| `core` | Core |
| `layout` | Layouts |
| `storybook` and `stories` | Storybook |
| `ui` | UI |
| `pages` | Views |
| `fixtures` | Fixtures |
| `scripts` | Scripts |
| `tests` | Tests |
| `types` | TypeScript |

`editor` and `worker` remain exact domain names even though the association table has no generic icon for them. Inventing an unrelated icon name would weaken discoverability.

## Projection and performance laws

One live tree may have several simultaneous projections. A projection separates intrinsic measurement, global placement/routing, and final local render plans. Cache keys distinguish these phases. Value-only changes that do not affect intrinsic geometry do not rerun global layout. Pan and zoom update only the retained content-root transform.

Performance-sensitive work should record CPU layout and materialization time, allocations, upload bytes, draw calls, frame p50/p95/p99, input-to-present latency, and retained memory. A smaller demo is not proof if it changes route geometry, clipping, picking, or identity.

## Static Storybook pipeline

`packages/storybook/build.ts` builds six source entrypoints into independent `dist/@storybook-assets/<page>/` directories, writes package HTML shells, copies the Engine font and accepted evidence, emits `.nojekyll`, and creates a project-base-aware 404 recovery page. The Pages workflow checks out and registers Engine, Layout, and UI before installing Nodes from its frozen lockfile.

The workflow file does not enable Pages or mutate repository settings. Deployment remains an owner-controlled GitHub setting.

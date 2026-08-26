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
| UI | [zavx0z/ui](https://github.com/zavx0z/ui) | `@ui/elements` and `@ui/components` |
| Shared Storybook | private `@zavx0z/storybook` owner repository | dev-only router, Workbench, server and static builder through exact `@zavx0z/storybook/*` subpaths |
| Nodes | [zavx0z/node](https://github.com/zavx0z/node) | graph, editor, solver, worker, view, and Storybook packages |
| Product | [zavx0z/metafor](https://github.com/zavx0z/metafor) | authorized product integration only |

## Workspace boundaries

### `@nodes/core`

Core owns `NodeTree → Frame / Node → Parameter → Socket → Link`. Parameter is the only store of its value. `snapshot()` is JSON-compatible; `document()` is ID-addressed authoring data; `project()` coordinates cacheable derived views. Selection, viewport, pan, zoom, hover, and rendering never enter canonical graph state.

### `@nodes/editor`

Editor creates bounded forward and inverse JSON Patch operations against a fresh document and exact expected revision. A successful structural command performs one Core reconcile. Layout freshness is explicit and solver-free.

### `@nodes/layout`

Layout accepts only finite numeric graph data. Fixed and adaptive policies share
the compound `WEST/EAST` solver. `Dagre Layered` owns compact flat DAGs with
`SOUTH/NORTH` endpoints and one Codex-compatible rounded-corner edge pipeline.
`Coffman–Graham Layered` is a separate width-bounded policy for larger flat
DAGs; it limits real nodes per layer before deterministic crossing reduction
and uses the same geometric law of straight sections with only local rounded
corners. Neither layered policy imports the compound solver or selects another
algorithm from input size.
Every policy is a separate public module graph;
there is no production registry or runtime policy switch. Layout never reads a
live NodeTree or renderer.

### `@nodes/worker`

Worker owns structured-clone-safe transports and exact fixed, adaptive,
Dagre Layered and Coffman–Graham Layered client/executor entrypoints. Each executor imports one layout
policy, while client bundles contain no solver. There are no compatibility
package aliases or legacy package paths.

### `@nodes/ui`

UI owns retained NodeCanvas and NodeEditor views, render-plan contracts, culling, picking, selection, interaction, and the neutral node-view presets. Public entrypoints are `node`, `projection`, `node-editor`, `parameter`, and `link-curve`; source-branded identifiers and compatibility re-exports are not part of the API.

### `@nodes/storybook`

Each package owns its dev-only stories under `packages/<owner>/storybook/**`.
The repository Storybook consumes those descriptors and production code only
through exact public entrypoints. Shared application infrastructure comes from
exact `@zavx0z/storybook/*` subpaths and remains a private app dependency. Its
DOM, SVG, and WebGPU pages remain independent bundles. Static output uses
`/node/`, copies the accepted reference catalog verbatim, and keeps raster
evidence outside production exports.

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

Production layout policies are optimized as isolated artifacts rather than as
branches of one universal engine. Under the pinned build toolchain, adding a
policy must preserve the exact bytes, hashes and source markers of existing
policy executors. Shared runtime code is
allowed only for policy-neutral leaf primitives whose extraction is proven not
to pull another solver into a bundle. Search budgets are fixed and bounded;
input size may increase work, but consumer options may not unlock an
unbounded algorithm.

## Static Storybook pipeline

`packages/storybook/build.ts` passes the Node-owned typed app manifest to
`@zavx0z/storybook/build`. The shared builder builds six source entrypoints into
independent `dist/@storybook-assets/<page>/` directories, writes package HTML
shells, copies one exact Engine font asset and accepted evidence, emits
`.nojekyll`, and creates a project-base-aware fail-closed 404 recovery page.
`storybook-manifest.json` records exact source/dependency revisions, page
graphs, emitted sizes and SHA-256 hashes. Each shell declares the shared font
URL once through inert meta; Editor and UI create `UiRuntime` without
package-owned font paths, while a custom runtime font bypasses the default
request.

The workflow file does not enable Pages or mutate repository settings and has
no push trigger. Its cold build checks out every external owner at an exact Git
revision, registers Highlighter and the shared Storybook directly, and never
registers the removed `@ui/storybook` implementation. The frozen Nodes install
and check run only after those links exist. Build and deployment run only after
an explicit owner dispatch.

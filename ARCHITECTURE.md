# Nodes architecture

**Built for [MetaFor](https://github.com/zavx0z/metafor), while keeping the node-system core reusable for independent agents, complex systems, and immersive applications.**

## Position in the repository family

```text
MetaFor product integration
  └─ @nodes/storybook and product adapters
       ├─ @nodes/ui ────────────────> @zavx0z/dom
       ├─ @nodes/editor ────────────> @nodes/core
       ├─ @nodes/worker ────────────> @nodes/layout
       └─ @nodes/layout + @nodes/core
```

The direction is intentionally acyclic. Core does not know about layout,
workers, WebGPU, or products. Editor changes Core without importing a solver.
UI receives already positioned graph props as standard DOM. Storybook is the
only package that composes DOM, renderer, Engine font and every domain owner.

Cross-repository owners:

| Owner | Repository | Contract consumed by Nodes |
| --- | --- | --- |
| Renderer | [zavx0z/renderer](https://github.com/zavx0z/renderer) | `@zavx0z/dom`, CPU renderer and browser/WebGPU adapters |
| Engine | [zavx0z/engine](https://github.com/zavx0z/engine) | `@engine/core` WebGPU primitives and default font |
| Shared Storybook | private `@zavx0z/storybook` owner repository | dev-only DOM catalog, Workbench, router, server and static builder through exact subpaths |
| Nodes | [zavx0z/node](https://github.com/zavx0z/node) | graph, editor, solver, worker, view, and Storybook packages |
| Product | [zavx0z/metafor](https://github.com/zavx0z/metafor) | authorized product integration only |

## DOM production target

New Node UI production slices author one standard DOM tree. `@nodes/ui`
creates and updates semantic elements through `@zavx0z/dom`; it does not
receive a Surface, Engine object, manual paint host or renderer resource.
The application/Storybook composition root connects that same tree to
`@zavx0z/renderer → @zavx0z/renderer-webgpu → @engine/core`.

Functions are authoring factories, not a replacement runtime hierarchy. A
factory returns one stable standard element plus typed refs/controller, while
the observable prototype chain remains `Node → Element → HTMLElement`.
Positioned Node coordinates remain domain scene data, but ordinary internal
structure and geometry belong to HTML/CSS flow.

The first bounded production proof is package-private
`packages/ui/dom/single-node-canvas.ts`: one pre-positioned Node, no Frame,
Socket, Link, Parameter or pan/zoom. Subsequent keyed Graph, Parameter/Socket,
NodeTree, Layout, Worker and NodeWorkbench slices now cover all 224 registered
Storybook route nodes. The former hybrid bootstrap and retained app
entry/preview/overview/story loader graph have been removed; the final private
Storybook has one DOM entry and no compatibility alias.

Domain views may own package-private standard DOM projections without moving
their computation into DOM. `@nodes/layout` keeps four independent pure
numeric policy entrypoints; `packages/layout/dom/layout-presentation.ts`
receives only their completed geometry and diagnostics. `@nodes/worker` keeps
its exact clients/executors and presents their structured-clone envelopes
through `packages/worker/dom/worker-protocol.ts`. Neither projection is a
public solver/transport entrypoint, and neither imports generic `@layout/core`
or retained UI Elements.

`packages/ui/dom/parameter-socket.ts` is the common package-private DOM
composition for every Parameter and Socket catalog route. It projects existing
kind/variant data onto standard input/select/checkbox authoring controls and
keeps Socket kind, capability direction and visual side independent. Composite
Field values use an explicit string projection; the controller does not copy
or re-export the retained UI Field DSL. Parameter and Socket route data remain
separate lazy modules, but both update the same keyed DOM contract through
ordinary events.

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

UI owns standard-DOM `GraphCanvas`, `NodeWorkbench`, `ParameterSocket` and
`NodeTreeEditor`. Public factories return exact semantic elements, CSS and
stable typed controllers. Applications own domain geometry and renderer
composition. Removed retained Node/NodeEditor/Parameter/Link/projection
entrypoints have no aliases or compatibility re-exports.

### `@nodes/storybook`

Each package owns its dev-only stories under `packages/<owner>/storybook/**`.
The repository Storybook consumes those descriptors and production code only
through exact public entrypoints. Shared application infrastructure comes from
exact `@zavx0z/storybook/*` subpaths and remains a private app dependency. Its
single root Workbench owns one document, canvas, runtime and route tree;
package implementations remain independent lazy story chunks rather than
independent user-facing pages. Static output uses `/node/`, copies the accepted
reference catalog verbatim, and keeps raster evidence outside production
exports.

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
`@zavx0z/storybook/build`. The shared builder emits one root Workbench entry
with lazy owner/story chunks, writes one HTML shell, copies one exact Engine
font asset and accepted evidence, emits
`.nojekyll`, and creates a project-base-aware fail-closed 404 recovery page.
`storybook-manifest.json` records exact source/dependency revisions, page
graphs, emitted sizes and SHA-256 hashes. Each shell declares the shared font
URL once through inert meta; the one document renderer runtime receives the
Engine-owned font without package-owned font paths.

No Pages workflow is stored while the independent DOM/renderer owners have no
immutable delivered revisions. Static build remains local evidence; publication
requires a separate owner decision after the exact linked graph is deliverable.

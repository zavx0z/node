# Nodes architecture

**Built for [MetaFor](https://github.com/zavx0z/metafor), while keeping the node-system core reusable for independent agents, complex systems, and immersive applications.**

## Position in the repository family

```text
MetaFor product integration
  └─ @nodes/ui and product adapters
       ├─ @nodes/ui ────────────────> @zavx0z/dom + @zavx0z/react + @zavx0z/template + @ui/components/field
       ├─ @nodes/editor ────────────> @nodes/core
       ├─ @nodes/worker ────────────> @nodes/layout
       └─ @nodes/layout + @nodes/core

external Storybook tool <── JSON declarations + owner-local dev stories
```

The direction is intentionally acyclic. Core does not know about layout,
workers, WebGPU, or products. Editor changes Core without importing a solver.
UI receives already positioned graph props as standard DOM. The external
Storybook tool composes the shared Workbench/renderer; Nodes packages expose
only JSON declarations, structural runtimes and owner-local stories.

Cross-repository owners:

| Owner | Repository | Contract consumed by Nodes |
| --- | --- | --- |
| Renderer | [zavx0z/renderer](https://github.com/zavx0z/renderer) | `@zavx0z/dom`, CPU renderer and browser/WebGPU adapters |
| Engine | [zavx0z/engine](https://github.com/zavx0z/engine) | `@engine/core` WebGPU primitives and default font |
| External Storybook | standalone `zavx0z/storybook` tool | declaration schemas, one server/origin, shared Workbench, package sessions and generated loaders; no consumer dependency |
| UI | [zavx0z/ui](https://github.com/zavx0z/ui) | exact universal `@ui/components/field` used inside Parameters and Node properties |
| Nodes | [zavx0z/node](https://github.com/zavx0z/node) | graph, editor, solver, worker, DOM view and owner declaration packages |
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

The production UI now exposes natural DOM owners for Node, Parameter, Socket,
Link and NodeEditor in addition to GraphCanvas, NodeWorkbench and NodeTree.
NodeEditor preserves compact coloured headers, collapse/preview, embedded
universal Fields, typed socket endpoints, Frame/Link/Node selection, grid,
fit/pan/zoom, culling and stable keyed identity without restoring Surface
signatures or a second runtime hierarchy. Package-private
`packages/ui/dom/single-node-canvas.ts` and multi-node controllers remain
bounded fixtures only.

`@nodes/ui/node-system` is the compiled TSX composition over the same standard
DOM realm. It subscribes to Core's cached immutable snapshot through
`useSyncExternalStore`; keyed Node, Parameter, Socket and Link components are a
projection of that snapshot, never a second graph or value store. Writes remain
caller-owned and the canonical Storybook adapter routes them through the one
`NodeTreeEditor`.

Domain views may own package-private standard DOM projections without moving
their computation into DOM. `@nodes/layout` keeps four independent pure
numeric policy entrypoints; `packages/layout/dom/layout-presentation.ts`
receives only their completed geometry and diagnostics. `@nodes/worker` keeps
its exact clients/executors and presents their structured-clone envelopes
through `packages/worker/dom/worker-protocol.ts`. Neither projection is a
public solver/transport entrypoint, and neither imports generic `@layout/core`
or retained UI Elements.

`packages/ui/dom/parameter.ts` embeds the exact universal
`@ui/components/field` owner, so composite color/vector/rotation/matrix,
reference, collection and path values retain their real controlled contracts.
`packages/ui/dom/socket.ts` independently owns typed kind, direction, side,
shape and color presets. The older `parameter-socket.ts` remains a bounded
catalog controller, not the production Node composition or a string substitute
for universal Fields.

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

UI owns standard-DOM `Node`, `Parameter`, `Socket`, `Link`, `NodeEditor`,
`GraphCanvas`, `NodeWorkbench`, `ParameterSocket` and `NodeTreeEditor`. Public
factories return exact semantic elements, CSS and stable typed controllers.
Applications own domain geometry and renderer composition. These natural
leaves preserve the former visible/interaction contract without restoring old
Surface signatures, aliases or compatibility re-exports.

The compiled `NodeSystem`, `NodeCard`, `ParameterRow`, `SocketPort` and
`NodeConnection` functions compose those same semantic concepts through
`@zavx0z/react` and build-time `@zavx0z/template`. They expose one `style`
override authored as one real `css\`\`` template, publish no style transport and
retain keyed DOM identity from canonical entity ids.

### External development declarations

`.storybook/manifest.json` composes the five production owners without creating
a sixth npm package. Every `packages/<owner>/.storybook/manifest.json` points to
one data-only catalog, plain `storybook-runtime/3` adapter and owner-local story
modules. Каждый subject объявляет inherited `story-presentation/1`; runtime
атомарно публикует `{node, componentRoot, source, values}` без style/source
transport. No consumer installs/imports Storybook or owns a server/build/port.

The canonical baseline contains 159 exact leaves. Category and subject route
overrides preserve historical prefixes; former section prefixes remain variant
group metadata and map to their subject overview through
`.storybook/overview-remap.json`. One external origin opens one package per tab
and derives navigation/search/build lookup from the same normalized graph.

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

Compiled NodeSystem performance is checked at 1k and 10k canonical Nodes with
the same six-Node viewport projection. Value work is scoped through exact
Parameter subscriptions; topology uses a revision-fenced additive Core path and
structurally shared topology snapshot. Offscreen changes must produce no DOM
mutation or renderer plan, while applicable unclipped Rect runs are discovered
by the backend's default safe instancing rather than UI hints.

Production layout policies are optimized as isolated artifacts rather than as
branches of one universal engine. Under the pinned build toolchain, adding a
policy must preserve the exact bytes, hashes and source markers of existing
policy executors. Shared runtime code is
allowed only for policy-neutral leaf primitives whose extraction is proven not
to pull another solver into a bundle. Search budgets are fixed and bounded;
input size may increase work, but consumer options may not unlock an
unbounded algorithm.

## External Storybook package sessions

The standalone tool discovers this repository through its project declaration.
Each package session generates literal runtime/story imports, records exact
module realpaths and publishes immutable candidate/active/last-good revisions.
An error in one Nodes package leaves the server and other package tabs alive.
The global landing loads declaration metadata only; package runtime code loads
only in its own tab and an owner story loads only for an exact variant.

The Engine font and shared DOM-to-WebGPU renderer belong to the external shell.
Workbench, preview and HUD share its one Document/Canvas/Renderer/Space/ViewPoint;
Nodes stories create no presentation realm. Packages that consume production UI
declare exact `@ui/components/theme.css` through the verified local dependency
closure before their own package CSS.
Accepted Blender evidence remains under `packages/ui/.storybook/references/` and
outside production exports. Pages publication is not part of this repository.

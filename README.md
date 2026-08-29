# Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor). Designed as reusable, high-performance node infrastructure for agents, complex systems, and immersive WebGPU tools.**

[Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

Nodes is a Bun monorepo for building live graph runtimes and visual node editors without coupling canonical graph state to a renderer, layout engine, browser, or product. It combines transactional authoring, deterministic compound layout, isolated workers, standard-DOM Node views, and owner-local external Storybook declarations.

The accepted implementation was migrated from `pkg/nodes` at MetaFor revision `23057c8447e718d441e68e4cd4c86134915b08b8`. The repository history still preserves the earlier standalone visual-programming prototype; the current working tree now owns the reusable package family.

## What it optimizes for

- Live `NodeTree` identity with Parameter-owned values and immutable snapshots.
- Atomic ID-addressed authoring through bounded JSON Patch transactions.
- Deterministic fixed/adaptive compound layout and isolated top-down DAG layout.
- Worker clients that remain solver-free and executors that remain policy-exact.
- Standard-DOM Node graph controllers plus compiled TSX composition with keyed identity and ordinary events.
- Independent package entrypoints, lazy external Storybook chunks, and measurable integration boundaries.
- Immutable owner-local reference evidence outside production exports.

## Packages

| Package | Responsibility | Runtime dependencies | Publication |
| --- | --- | --- | --- |
| `@nodes/core` | Live graph entities, Parameter stores, snapshots, revisions, and projection coordination | none | Internal |
| `@nodes/editor` | Headless transactional authoring and explicit layout freshness gates | `@nodes/core` | Internal |
| `@nodes/layout` | Pure numeric placement and orthogonal routing policies | none | Internal |
| `@nodes/worker` | Serializable fixed/adaptive/top-down worker clients, transports, and executors | `@nodes/layout` | Internal |
| `@nodes/ui` | Blender-like DOM Node, Parameter, Socket, Link, NodeEditor, GraphCanvas and compiled NodeSystem views | `@zavx0z/dom`, `@zavx0z/react`, `@zavx0z/template`, exact `@ui/components/field` | Internal |

Every package is `private: true`. Repository separation does not imply registry publication or a compatibility promise.

## Storybook

Nodes is attached to the standalone external Storybook through
`.storybook/manifest.json`. Core, Editor, Layout, Worker and UI each own a
package manifest, catalog, structural runtime and story resources. One external
server/origin supplies the shared Workbench; one package opens per browser tab.
No Nodes package installs or imports Storybook or owns a server/port/build.

All 159 historical leaf route strings remain explicit catalog routes. Package,
category and subject overviews are real states; former section prefixes are
variant grouping metadata with documented remaps in
`.storybook/overview-remap.json`. Unknown routes fail closed and never select a
first descendant.

## Repository family

| Repository | Role |
| --- | --- |
| [Renderer](https://github.com/zavx0z/renderer) | HTML DOM realm, CPU CSS/layout/hit pipeline and browser/WebGPU adapters |
| [Engine](https://github.com/zavx0z/engine) | Target-neutral WebGPU rendering primitives |
| [UI](https://github.com/zavx0z/ui) | Shared DOM components and Field controls |
| [Nodes](https://github.com/zavx0z/node) | Graph runtime, authoring, layout policies, workers and DOM node views |
| [MetaFor](https://github.com/zavx0z/metafor) | Product integration and immersive domain projections |

Dependencies point toward their real owner. `@nodes/ui` consumes the DOM owner
and the exact universal Field component; applications compose Engine/Renderer
explicitly. No upstream repository imports Nodes or product semantics.

## Requirements

- [Bun](https://bun.sh/) `1.4.0`
- sibling `engine` and `renderer` checkouts registered through Bun links
- sibling `ui` checkout registered for `@ui/components/field`
- a WebGPU-capable browser for Editor and UI stories

## Development

Register the sibling packages once in a coordinated local checkout:

```bash
(cd ../../../renderer/packages/dom && bun link)
(cd ../../../renderer/packages/core && bun link)
(cd ../../../renderer/packages/browser && bun link)
(cd ../../../renderer/packages/webgpu && bun link)
(cd ../engine/packages/core && bun link)
```

Then install and verify Nodes:

```bash
bun install --frozen-lockfile
bun run check
bun run bench:node-system
```

Use the global `$storybook` to attach this project declaration and open an exact
package id such as `@nodes/ui`. The external tool owns lifecycle and browser
targets; generated `dist/`, dependency directories, logs, and runtime evidence
remain ignored.

## Accepted reference evidence

Reference raster data is dev-only and never enters production package exports. [`catalog.json`](./packages/ui/.storybook/references/catalog.json) and its sibling PNG are owned by `@nodes/ui`; they preserve provenance, exact SHA-256, viewport, DPR, compatibility, acceptance and the MetaFor source revision.

## License

[MIT](./LICENSE)

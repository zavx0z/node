# Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor). Designed as reusable, high-performance node infrastructure for agents, complex systems, and immersive WebGPU tools.**

[Live Nodes Storybook](https://zavx0z.github.io/node/) · [Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

Nodes is a Bun monorepo for building live graph runtimes and visual node editors without coupling canonical graph state to a renderer, layout engine, browser, or product. It combines transactional authoring, deterministic compound layout, isolated workers, standard-DOM Node views, and a static WebGPU Storybook.

The accepted implementation was migrated from `pkg/nodes` at MetaFor revision `23057c8447e718d441e68e4cd4c86134915b08b8`. The repository history still preserves the earlier standalone visual-programming prototype; the current working tree now owns the reusable package family.

## What it optimizes for

- Live `NodeTree` identity with Parameter-owned values and immutable snapshots.
- Atomic ID-addressed authoring through bounded JSON Patch transactions.
- Deterministic fixed/adaptive compound layout and isolated top-down DAG layout.
- Worker clients that remain solver-free and executors that remain policy-exact.
- Standard-DOM Node graph controllers plus compiled TSX composition with keyed identity and ordinary events.
- Independent package entrypoints, lazy Storybook chunks, and measurable integration boundaries.
- Static, project-base-safe Storybook output with accepted reference evidence.

## Packages

| Package | Responsibility | Runtime dependencies | Publication |
| --- | --- | --- | --- |
| `@nodes/core` | Live graph entities, Parameter stores, snapshots, revisions, and projection coordination | none | Internal |
| `@nodes/editor` | Headless transactional authoring and explicit layout freshness gates | `@nodes/core` | Internal |
| `@nodes/layout` | Pure numeric placement and orthogonal routing policies | none | Internal |
| `@nodes/worker` | Serializable fixed/adaptive/top-down worker clients, transports, and executors | `@nodes/layout` | Internal |
| `@nodes/ui` | Blender-like DOM Node, Parameter, Socket, Link, NodeEditor, GraphCanvas and compiled NodeSystem views | `@zavx0z/dom`, `@zavx0z/react`, `@zavx0z/template`, exact `@ui/components/field` | Internal |
| `@nodes/storybook` | One static/local Workbench, lazy owner stories, and accepted evidence | all package owners above | Internal |

Every package is `private: true`. Repository separation does not imply registry publication or a compatibility promise.

## Storybook

The Storybook is one root Workbench with one document, canvas, runtime and
route tree. There is no separate package landing page: `/` immediately shows a
representative Core overview. Core, Editor, Layout, Worker and UI keep prefixed routes
inside that Workbench, while their exact implementations load as independent
lazy chunks. The primary panel selects owners such as `Раскладка` or `Сокеты`,
the secondary panel selects a policy or Socket kind, and the dock selects its
scenario or direction. Owner and secondary overview routes render their own
aggregate information before an exact detail is selected.

Static output can be built locally with the project base `/node/`. Deep links
recover through the same route manifest, while reference metadata and the
accepted raster remain separate evidence assets under `dist/references/`.
No Pages workflow is kept until all DOM/renderer owners have immutable remote
revisions and publication is separately authorized.

The default TTF remains owned by Engine. The shared Storybook HTML shell
declares its served URL once, and the one document renderer runtime uses that
font for the WebGPU page. Node packages and story modules do not own font
routes; a custom runtime font skips the default request.

## Repository family

| Repository | Role |
| --- | --- |
| [Renderer](https://github.com/zavx0z/renderer) | HTML DOM realm, CPU CSS/layout/hit pipeline and browser/WebGPU adapters |
| [Engine](https://github.com/zavx0z/engine) | Target-neutral WebGPU rendering primitives |
| [UI](https://github.com/zavx0z/ui) | DOM components and repository Storybook |
| [Nodes](https://github.com/zavx0z/node) | Graph runtime, authoring, layout policies, workers and DOM node views |
| [MetaFor](https://github.com/zavx0z/metafor) | Product integration and immersive domain projections |

Dependencies point toward their real owner. `@nodes/ui` consumes the DOM owner
and the exact universal Field component; applications compose Engine/Renderer
explicitly. No upstream repository imports Nodes or product semantics.

## Requirements

- [Bun](https://bun.sh/) `1.4.0`
- sibling `engine`, `renderer`, and `storybook` checkouts
  registered through Bun links
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
(cd ../../../storybook && bun link)
```

Then install and verify Nodes:

```bash
bun install --frozen-lockfile
bun run check
bun run bench:node-system
```

Use `$storybook ensure @nodes/storybook` for the local runtime. Generated
`dist/`, dependency directories, logs, and runtime evidence are ignored.

## Accepted reference evidence

Reference raster data is dev-only and never enters production package exports. [`catalog.json`](./packages/storybook/assets/references/catalog.json) records provenance, exact SHA-256, viewport, DPR, compatibility, acceptance, and the MetaFor source revision. User-facing routes and public TypeScript APIs use neutral product vocabulary; source identity appears only in evidence provenance.

## License

[MIT](./LICENSE)

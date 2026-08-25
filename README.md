# Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor). Designed as reusable, high-performance node infrastructure for agents, complex systems, and immersive WebGPU tools.**

[Live Nodes Storybook](https://zavx0z.github.io/node/) · [Architecture](./ARCHITECTURE.md) · [Contributing](./CONTRIBUTING.md)

Nodes is a Bun monorepo for building live graph runtimes and visual node editors without coupling canonical graph state to a renderer, layout engine, browser, or product. It combines transactional authoring, deterministic compound layout, isolated workers, retained WebGPU views, and a static package Storybook.

The accepted implementation was migrated from `pkg/nodes` at MetaFor revision `23057c8447e718d441e68e4cd4c86134915b08b8`. The repository history still preserves the earlier standalone visual-programming prototype; the current working tree now owns the reusable package family.

## What it optimizes for

- Live `NodeTree` identity with Parameter-owned values and immutable snapshots.
- Atomic ID-addressed authoring through bounded JSON Patch transactions.
- Deterministic fixed/adaptive compound layout and isolated top-down DAG layout.
- Worker clients that remain solver-free and executors that remain policy-exact.
- Retained WebGPU node views where pan and zoom update one transform hierarchy.
- Independent package entrypoints, browser bundles, and measurable integration boundaries.
- Static, project-base-safe Storybook output with accepted reference evidence.

## Packages

| Package | Responsibility | Runtime dependencies | Publication |
| --- | --- | --- | --- |
| `@nodes/core` | Live graph entities, Parameter stores, snapshots, revisions, and projection coordination | none | Internal |
| `@nodes/editor` | Headless transactional authoring and explicit layout freshness gates | `@nodes/core` | Internal |
| `@nodes/layout` | Pure numeric placement and orthogonal routing policies | none | Internal |
| `@nodes/worker` | Serializable fixed/adaptive/top-down worker clients, transports, and executors | `@nodes/layout` | Internal |
| `@nodes/ui` | Retained NodeCanvas, NodeEditor, Frame, Node, Parameter, Socket, and Link views | Engine, Layout, UI, Core | Internal |
| `@nodes/storybook` | Static and local package catalog, visual stories, and accepted evidence | all package owners above | Internal |

Every package is `private: true`. Repository separation does not imply registry publication or a compatibility promise.

## Storybook

The Storybook is a real application with six independent browser bundles:

- `/` — package catalog;
- `/core/` — live graph document and snapshot evidence;
- `/editor/` — transactional authoring projected into a WebGPU editor;
- `/layout/` — standard UI Workbench with lazy fixed, adaptive and top-down geometry stories;
- `/worker/` — serializable request, response, generation, and failure envelopes;
- `/ui/` — the complete retained Node UI story catalog and accepted-reference comparison.

Static output is built for the GitHub Pages project base `/node/`. Deep links recover through the same route manifest, while reference metadata and the accepted raster remain separate evidence assets under `dist/references/`.

The default TTF remains owned by Engine. The shared Storybook HTML shell
declares its served URL once, and all WebGPU pages let `UiRuntime` load the
shared font lazily. Node packages and story modules do not own font routes; a
custom runtime font skips the default request.

## Repository family

| Repository | Role | Pages |
| --- | --- | --- |
| [Engine](https://github.com/zavx0z/engine) | Retained WebGPU rendering primitives | [Engine Storybook](https://zavx0z.github.io/engine/) |
| [Layout](https://github.com/zavx0z/layout) | UI runtime, surfaces, Flex composition, HUD, and display targets | [Layout Storybook](https://zavx0z.github.io/layout/) |
| [UI](https://github.com/zavx0z/ui) | Reusable interface elements, controls, HUD composition, and shared Storybook shell | [UI Storybook](https://zavx0z.github.io/ui/) |
| [Nodes](https://github.com/zavx0z/node) | Graph runtime, authoring, layout policies, workers, and node views | [Nodes Storybook](https://zavx0z.github.io/node/) |
| [MetaFor](https://github.com/zavx0z/metafor) | Product integration and immersive domain projections | Product-owned surfaces |

Dependencies point toward their real owner: Nodes consumes Engine, Layout, and UI; none of those repositories imports Nodes or product semantics.

## Requirements

- [Bun](https://bun.sh/) `1.4.0`
- sibling `engine`, `layout`, and `ui` checkouts registered through Bun links
- a WebGPU-capable browser for Editor and UI stories

## Development

Register the sibling packages once in a coordinated local checkout:

```bash
(cd ../engine/packages/core && bun link)
(cd ../layout/packages/core && bun link)
(cd ../ui/packages/elements && bun link)
(cd ../ui/packages/components && bun link)
(cd ../ui/packages/storybook && bun link)
```

Then install and verify Nodes:

```bash
bun install --frozen-lockfile
bun run check
bun run storybook
```

The local Storybook listens at `http://127.0.0.1:4018`. Generated `dist/`, dependency directories, logs, and runtime evidence are ignored.

## Accepted reference evidence

Reference raster data is dev-only and never enters production package exports. [`catalog.json`](./packages/storybook/assets/references/catalog.json) records provenance, exact SHA-256, viewport, DPR, compatibility, acceptance, and the MetaFor source revision. User-facing routes and public TypeScript APIs use neutral product vocabulary; source identity appears only in evidence provenance.

## License

[MIT](./LICENSE)

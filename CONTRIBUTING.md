# Contributing to Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor) and maintained as reusable high-performance node infrastructure.**

Changes should preserve both sides of that promise: MetaFor receives a precise node-system foundation, while reusable packages stay free of hidden product semantics.

## Setup

Use Bun `1.4.0` from [`.bun-version`](./.bun-version). Register the sibling Engine, Layout, and UI package links described in the [README](./README.md), then run:

```bash
bun install
bun run check
```

Run the catalog with `$storybook ensure @nodes/storybook`.

## Ownership

- `packages/core` owns live graph identity and projection coordination.
- `packages/editor` owns headless graph authoring.
- `packages/layout` owns pure numeric placement and routing.
- `packages/worker` owns structured-clone transport and executor boundaries.
- `packages/ui` owns retained node views and interaction.
- `packages/storybook` owns dev/static stories and reference evidence.
- Product integration belongs in [MetaFor](https://github.com/zavx0z/metafor).

Read the affected package requirements, public types, and focused tests before changing a contract. A new invariant belongs in its real owner before code and evidence are changed.

## Naming

- Use lowercase directories and kebab-case multiword filenames.
- Story entrypoints end in `.stories.ts`; tests end in `.test.ts`.
- Use neutral role names in public API and Storybook labels.
- Exact source-product names belong only in evidence assets, manifests, and comparison provenance.
- Do not add compatibility aliases, duplicate barrels, or legacy re-exports.
- Preserve the semantic Atom Material UI folder vocabulary documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Dependency changes

Import from the real package owner:

- GPU scene primitives from `@engine/core`;
- runtime, surfaces, Flex, and polyline geometry from `@layout/core`;
- controls and element semantics from `@ui/*`;
- graph contracts from exact `@nodes/*` packages.

Do not hide a sibling dependency behind a local wrapper. Local Bun links are coordinated development wiring, not publication or immutable release evidence.

## Story and evidence requirements

A Storybook change should preserve route canonicalization, one root entry with lazy story-chunk isolation, WebGPU capability boundaries, and the `/node/` static base. Reference changes must update the asset, SHA-256, viewport, DPR, provenance, compatibility, and acceptance in one manifest change. Automated captures remain candidates until the owner accepts them.

## Checks

```bash
bun run typecheck
bun run test
bun run --cwd packages/storybook build
git diff --check
```

For visible WebGPU changes, use `$storybook` with `@nodes/storybook` to inspect
the exact route, canvas, console and retained behavior. A successful static
build does not prove visual correctness.

## Delivery boundary

Do not commit generated `dist/`, dependency directories, logs, or runtime captures. Enabling Pages, publishing packages, pushing branches, updating MetaFor, or changing sibling repositories are separate owner-controlled actions.

# Contributing to Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor) and maintained as reusable high-performance node infrastructure.**

Changes should preserve both sides of that promise: MetaFor receives a precise node-system foundation, while reusable packages stay free of hidden product semantics.

## Setup

Use Bun `1.4.0` from [`.bun-version`](./.bun-version). Register the sibling Renderer, Engine and UI package links described in the [README](./README.md), then run:

```bash
bun install
bun run check
```

Attach `.storybook/manifest.json` with the global external `$storybook`; open
the exact owning package and route needed for evidence.

## Ownership

- `packages/core` owns live graph identity and projection coordination.
- `packages/editor` owns headless graph authoring.
- `packages/layout` owns pure numeric placement and routing.
- `packages/worker` owns structured-clone transport and executor boundaries.
- `packages/ui` owns standard-DOM node views, interaction and accepted visual evidence.
- Every package owns its dev-only `storybook/` stories and `.storybook/` declarations.
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

- semantic HTML DOM from `@zavx0z/dom`;
- CSS, layout, display, and hit projection from `@zavx0z/renderer`;
- retained GPU realization from `@zavx0z/renderer-webgpu` and scene primitives
  from `@engine/core`;
- browser lifecycle composition from `@zavx0z/renderer-browser`;
- shared controls from `@ui/components`;
- graph contracts from exact `@nodes/*` packages.

The live owner chain is `@zavx0z/dom` → `@zavx0z/renderer` →
`@zavx0z/renderer-webgpu` → `@engine/core`. Generic Layout and
`@ui/elements` are retired; `@nodes/layout` remains the independent domain
owner of numeric placement and routing.

Do not hide a sibling dependency behind a local wrapper. Local Bun links are coordinated development wiring, not publication or immutable release evidence.

## Story and evidence requirements

An external Storybook change must preserve exact package ownership, the 159-leaf route baseline, real overview states, lazy runtime/story boundaries and one shared Workbench. Reference changes update the `@nodes/ui` asset and provenance catalog together. Automated captures remain candidates until the owner accepts them.

## Checks

```bash
bun run typecheck
bun run test
git diff --check
```

For visible WebGPU changes, use external `$storybook` with the exact `@nodes/*`
package and route to inspect canvas, console and behavior. A successful package
build does not prove visual correctness.

## Delivery boundary

Do not commit generated `dist/`, dependency directories, logs, or runtime captures. Enabling Pages, publishing packages, pushing branches, updating MetaFor, or changing sibling repositories are separate owner-controlled actions.

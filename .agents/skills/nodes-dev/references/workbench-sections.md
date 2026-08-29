# Shared Workbench sections

All lifecycle and browser operations use the global external `$storybook` and
the canonical Nodes project declaration. Its origin is automatic; package ids
are `@nodes/core`, `@nodes/editor`, `@nodes/layout`, `@nodes/worker`, `@nodes/ui`.

## Catalog hierarchy

Each package tab uses the same six-region Workbench. The global landing only
selects projects/packages; it never loads a Nodes runtime or story.

The primary panel contains semantic owners. The secondary panel contains that
owner's implementations or public kinds. The dock contains variants of the
selected secondary item.

Clicking a category opens its own aggregate overview: no subject or dock
variant is selected. Clicking a subject opens its aggregate of all
variants: the dock is populated, but no exact variant is selected. Only a leaf
renders one detail story.

- `Раскладка` → Fixed, Adaptive, Dagre Layered, Coffman–Graham → policy scenarios.
- `Сокеты` → every public Socket kind → Input, Output, Bidirectional.
- `Параметры` → every public Field kind → field, input, output, both, connected.

Socket kinds belong to `@nodes/ui`; layout policies belong to `@nodes/layout`.
Do not put Sockets under Layout or use disclosure-only group headers as routes.
`/ui/socket/` renders all public kinds together; `/ui/socket/<kind>/` renders
all three directions together.

## Core

Route `/core/node-tree/live` renders the live Core scenario inside the shared
preview Surface. It shows `snapshot()`, ID-addressed `document()`, revisions and
ordered Parameter events without a second DOM document or shell.

## Worker

Routes `/worker/<policy>/default` render serializable request/result/error
envelopes inside the shared preview Surface. They preserve request id and
generation and load the exact selected worker policy lazily.

For every route verify external package readiness, the exact story route,
console `0`, and a non-black canvas.

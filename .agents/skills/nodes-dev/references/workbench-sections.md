# Shared Workbench sections

All lifecycle and browser operations use global `$storybook` with exact package
`@nodes/storybook`; its origin is automatic.

## Catalog hierarchy

The root route `/` is the same five-panel Workbench as every detail route. It
selects the `core` overview without replacing the pathname with a landing or
creating package cards.

The primary panel contains semantic owners. The secondary panel contains that
owner's implementations or public kinds. The dock contains variants of the
selected secondary item.

Clicking a primary owner opens its own aggregate overview: no secondary item or
dock variant is selected. Clicking a secondary item opens its aggregate of all
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

For every route verify `nodesStorybook=ready`, the exact story marker, console
`0`, and a non-black canvas.

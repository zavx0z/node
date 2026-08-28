# @nodes/storybook

**Built for [MetaFor](https://github.com/zavx0z/metafor).**

Один private Storybook всего репозитория Nodes работает без HMR на
автоматически выделенном порту и
собирается как static `/node/`. Один semantic Document, root canvas, document
renderer runtime, Router и DOM Workbench
показывают Core, Editor, Layout, Worker и UI как разделы общего каталога без
landing page и package-specific shells. Owners хранят stories рядом с собой в
`packages/<owner>/storybook/**`; root eager-загружает только metadata, а exact
implementations остаются lazy chunks. Общие router, shell, server и builder
приходят из точных subpaths `@zavx0z/storybook/*`.

Exact route `/ui/node-editor/scene/compiled-general` is the real compiled TSX
slice: one Core `NodeTree`, one `NodeTreeEditor`, a `useSyncExternalStore`
projection and class-free `@nodes/ui/node-system` composition. Browser and
static builds use the `@zavx0z/template` compiler plugin; npm React is absent.

Node-owned reference evidence остаётся dev-only в `assets/references/`.

# @nodes/storybook

**Built for [MetaFor](https://github.com/zavx0z/metafor).**

Один private Storybook всего репозитория Nodes работает без HMR на
автоматически выделенном порту и
собирается как static `/node/`. Один root canvas, `UiRuntime`, Router и Workbench
показывают Core, Editor, Layout, Worker и UI как разделы общего каталога без
landing page и package-specific shells. Owners хранят stories рядом с собой в
`packages/<owner>/storybook/**`; root eager-загружает только metadata, а exact
implementations остаются lazy chunks. Общие router, shell, server и builder
приходят из точных subpaths `@zavx0z/storybook/*`.

Node-owned reference evidence остаётся dev-only в `assets/references/`.

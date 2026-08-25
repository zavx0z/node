# @nodes/storybook

**Built for [MetaFor](https://github.com/zavx0z/metafor).**

Один private Storybook всего репозитория Nodes работает без HMR на `4018` и
собирается как static `/node/`. Core, Editor, Layout, Worker и UI хранят свои
stories рядом с собой в `packages/<owner>/storybook/**`; это приложение только
соединяет их routes и отдельные browser bundles. Общие router, shell, server и
builder приходят из точных subpaths `@zavx0z/storybook/*`.

Node-owned reference evidence остаётся dev-only в `assets/references/`.

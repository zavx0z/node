# Требования семейства Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor).**

Этот документ владеет композицией независимых Nodes packages и parent
storybook. Runtime-законы принадлежат [`@nodes/core`](../packages/core/requirements.md),
authoring-команды — [`@nodes/editor`](../packages/editor/requirements.md),
алгоритмические законы — [`@nodes/layout`](../packages/layout/README.md), Worker boundary —
`@nodes/worker`, WebGPU view — [`@nodes/ui`](../packages/ui/requirements.md), а
единый dev-каталог — [`@nodes/storybook`](../packages/storybook/requirements.md).

## Package boundary

1. `@nodes/core`, `@nodes/editor`, `@nodes/layout`, `@nodes/worker` и `@nodes/ui`
   сохраняют независимые production entrypoints и не загружают соседние
   реализации без точного импорта.
2. Central storybook является dev-only workspace consumer. Он не входит в
   production exports пакетов семейства.
3. Package-specific storybook modules принадлежат одному `@nodes/storybook`,
   но сохраняют package semantics и независимые exact routes.
4. Один `$nodes-dev` process и один browser origin заменяют прежние root,
   layout и UI selectors без compatibility servers.

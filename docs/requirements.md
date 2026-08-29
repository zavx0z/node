# Требования семейства Nodes

**Built for [MetaFor](https://github.com/zavx0z/metafor).**

Этот документ владеет композицией независимых Nodes packages и внешних
declarations. Runtime-законы принадлежат [`@nodes/core`](../packages/core/requirements.md),
authoring-команды — [`@nodes/editor`](../packages/editor/requirements.md),
алгоритмические законы — [`@nodes/layout`](../packages/layout/README.md), Worker boundary —
`@nodes/worker`, standard-DOM view — [`@nodes/ui`](../packages/ui/requirements.md),
а общий shell/server принадлежит самостоятельному внешнему Storybook tool.

## Package boundary

1. `@nodes/core`, `@nodes/editor`, `@nodes/layout`, `@nodes/worker` и `@nodes/ui`
   сохраняют независимые production entrypoints и не загружают соседние
   реализации без точного импорта.
2. Каждый package владеет dev-only `.storybook/manifest.json`, `catalog.json`,
   structural runtime и story modules рядом с semantic owner; production exports
   не меняются.
3. Consumer packages не зависят и не импортируют `@zavx0z/storybook`, не имеют
   private `@scope/storybook`, server/build/launcher или собственного порта.
4. Один внешний `$storybook` process/origin подключает project declaration,
   открывает package tabs и изолирует package revisions/diagnostics.
5. Все 159 leaf routes сохраняются. Package/category/subject overview являются
   настоящими состояниями; прежний section — только variant group metadata с
   явным remap к owning subject overview.

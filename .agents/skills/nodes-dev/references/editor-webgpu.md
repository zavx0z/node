# Editor WebGPU page

| Property | Value |
| --- | --- |
| Route | `/editor/live-node-tree` |
| Ready | `nodesStorybook=ready`, `nodesStorybookPage=editor` |
| Canvas | `#nodes-storybook-canvas` |

This page proves `NodeTreeEditor → NodeTree → projection → NodeEditor` while
the layout calculation remains explicitly gated by F9.

```bash
bun test packages/core packages/editor \
  packages/ui/projection.test.ts \
  packages/editor/storybook
bun run typecheck
$storybook restart @nodes/storybook
$storybook browser reload @nodes/storybook \
  --route /editor/live-node-tree --target-id "$target_id"
$storybook browser canvas @nodes/storybook \
  --route /editor/live-node-tree --target-id "$target_id" \
  --output /tmp/nodes-editor.png
```

For value-cache evidence after an exact reload:

```bash
$storybook browser interact @nodes/storybook \
  --route /editor/live-node-tree --target-id "$target_id" \
  --plan .agents/skills/nodes-dev/references/editor-cache-invalidation.plan.json
```

For structural authoring and manual layout:

```bash
$storybook browser interact @nodes/storybook \
  --route /editor/live-node-tree --target-id "$target_id" \
  --plan .agents/skills/nodes-dev/references/editor-topology.plan.json
```

Before F9, tree/topology revisions advance while projection revisions stay old
and `nodeTreeLayoutDirty=true`. After F9, exact revisions match, dirty is false,
console is empty and canvas is non-black.

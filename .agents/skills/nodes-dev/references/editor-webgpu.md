# Editor section in the shared WebGPU Workbench

| Property | Value |
| --- | --- |
| Route | `/editor/node-tree/live` |
| Ready | `nodesStorybook=ready`, exact `nodesStorybookStory` |
| Canvas | `#nodes-storybook-canvas` |

This section proves `NodeTreeEditor → NodeTree → projection → NodeEditor` while
the layout calculation remains explicitly gated by the retained dock's manual
rebuild action. Its package-owned preview/dock Surfaces live inside the one root
Workbench.

```bash
bun test packages/core packages/editor \
  packages/ui/projection.test.ts \
  packages/editor/storybook
bun run typecheck
$storybook restart @nodes/storybook
$storybook browser reload @nodes/storybook \
  --route /editor/node-tree/live --target-id "$target_id"
$storybook browser canvas @nodes/storybook \
  --route /editor/node-tree/live --target-id "$target_id" \
  --output /tmp/nodes-editor.png
```

Use the visible retained dock for add/remove Parameter, add/remove Node,
disconnect/connect, value Store updates and manual `rebuildLayout`. Before the
manual rebuild, tree/topology revisions advance while projection revisions stay
old and `nodeTreeLayoutDirty=true`. After rebuild, exact revisions match, dirty
is false, console is empty and canvas is non-black.

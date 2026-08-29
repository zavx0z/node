# Editor section in the shared WebGPU Workbench

| Property | Value |
| --- | --- |
| Package | `@nodes/editor` |
| Route | `editor/node-tree/live` |
| Ready | external package ready + exact route |
| Canvas | shared external Storybook canvas |

This section proves `NodeTreeEditor → NodeTree → projection → NodeEditor` while
the layout calculation remains explicitly gated by the retained dock's manual
rebuild action. Its package-owned preview/dock Surfaces live inside the one root
Workbench.

```bash
bun test packages/core packages/editor \
  packages/ui/projection.test.ts \
  packages/editor/storybook
bun run typecheck
$storybook check /Users/zavx0z/repozitarium/webxr-space/projects/node
$storybook open @nodes/editor editor/node-tree/live
```

Use the visible retained dock for add/remove Parameter, add/remove Node,
disconnect/connect, value Store updates and manual `rebuildLayout`. Before the
manual rebuild, tree/topology revisions advance while projection revisions stay
old and `nodeTreeLayoutDirty=true`. After rebuild, exact revisions match, dirty
is false, console is empty and canvas is non-black.

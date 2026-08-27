# Node UI sections in the shared WebGPU Workbench

| Property | Value |
| --- | --- |
| Representative detail route | `/ui/socket/boolean/input` |
| Ready | `nodesStorybook=ready`, exact `nodesStorybookStory` |
| Canvas | `#nodes-storybook-canvas` |

The `ui/` owner prefix preserves all NodeEditor, Parameter, Socket, Frame, Link,
and accepted-reference comparison story ids. Strip only the `ui/` prefix when
choosing a story module. These are primary sections of the same root Workbench,
not a nested package page.

```bash
bun test packages/ui packages/ui/storybook
bun run --cwd packages/ui typecheck
bun run typecheck
$storybook restart @nodes/storybook
story_route=/ui/node-editor/scene/default
$storybook browser reload @nodes/storybook \
  --route "$story_route" --target-id "$target_id"
$storybook browser dom @nodes/storybook \
  --route "$story_route" --target-id "$target_id"
$storybook browser console @nodes/storybook \
  --route "$story_route" --target-id "$target_id"
$storybook browser canvas @nodes/storybook \
  --route "$story_route" --target-id "$target_id" \
  --output /tmp/nodes-ui.png
```

Ready is published only after the reference texture reaches ready and a later
frame renders. Verify exact story route/source/args, console `0` and non-black
canvas.

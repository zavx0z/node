# Node UI sections in the shared WebGPU Workbench

| Property | Value |
| --- | --- |
| Package | `@nodes/ui` |
| Representative detail route | `ui/socket/boolean/input` |
| Ready | external package ready + exact route |
| Canvas | shared external Storybook canvas |

The `ui/` route prefix preserves all NodeEditor, Parameter, Socket, Frame, Link
and accepted-reference story ids inside the `@nodes/ui` package tab. The
generated loader selects the exact declared story factory; no nested shell or
route switch exists.

```bash
bun test packages/ui packages/ui/storybook
bun run --cwd packages/ui typecheck
bun run typecheck
$storybook check /Users/zavx0z/repozitarium/webxr-space/projects/node
$storybook open @nodes/ui ui/node-editor/scene/default
```

Ready is published only after the reference texture reaches ready and a later
frame renders. Verify exact story route/source/args, console `0` and non-black
canvas.

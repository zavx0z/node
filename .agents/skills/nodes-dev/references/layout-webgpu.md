# Layout WebGPU Workbench

| Property | Value |
| --- | --- |
| Reference route | `/layout/top-down/blender-area/default` |
| Dense stress route | `/layout/top-down/dense/default` |
| Other policies | `/layout/fixed/baseline/right`, `/layout/adaptive/shared/right` |
| Ready | `nodesStorybook=ready`, `nodesLayoutStorybook=ready` |
| Canvas | `#nodes-storybook-canvas` |

This page uses the shared retained Workbench and exact UI Elements/Components.
Each lazy story imports one production policy entrypoint; the top-down route
shows the frozen Blender Area topology without supplied ranks, coordinates or
routes.

```bash
SKILL=.agents/skills/nodes-dev
bun test packages/layout/src packages/layout/storybook packages/worker
bun run --cwd packages/layout typecheck
bun run typecheck
"$SKILL/scripts/nodes-dev.sh" restart "$PWD"
bun "$SKILL/scripts/nodes-browser.ts" reload "$PWD" \
  --route /layout/top-down/dense/default --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" dom "$PWD" \
  --route /layout/top-down/dense/default --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" canvas "$PWD" \
  --route /layout/top-down/dense/default --target-id "$target_id" \
  --output /tmp/nodes-layout-top-down-dense.png
bun "$SKILL/scripts/nodes-browser.ts" console "$PWD" \
  --route /layout/top-down/dense/default --target-id "$target_id"
```

DOM evidence proves the exact story route, retained Workbench diagnostics and
ready markers. Canvas evidence proves only the rendered route and target;
frozen result hashes and policy bundle gates remain the geometry and isolation
proof.

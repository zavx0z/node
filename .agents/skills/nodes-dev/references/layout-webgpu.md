# Layout WebGPU Workbench

| Property | Value |
| --- | --- |
| Dagre Layered route | `/layout/dagre-layered/default/default` |
| Coffman–Graham Layered route | `/layout/coffman-graham/default/default` |
| Other policies | `/layout/fixed/baseline/right`, `/layout/adaptive/shared/right` |
| Ready | `nodesStorybook=ready`, `nodesLayoutStorybook=ready` |
| Canvas | `#nodes-storybook-canvas` |

This page uses the shared retained Workbench and exact UI Elements/Components.
Each lazy story imports one production policy entrypoint. Dagre Layered shows
the frozen compact reference without supplied ranks, coordinates or routes;
Coffman–Graham Layered owns the separate width-bounded large-graph scenario.

```bash
SKILL=.agents/skills/nodes-dev
bun test packages/layout/src packages/layout/storybook packages/worker
bun run --cwd packages/layout typecheck
bun run typecheck
"$SKILL/scripts/nodes-dev.sh" restart "$PWD"
bun "$SKILL/scripts/nodes-browser.ts" reload "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" dom "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" canvas "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id" \
  --output /tmp/nodes-layout-coffman-graham.png
bun "$SKILL/scripts/nodes-browser.ts" console "$PWD" \
  --route /layout/coffman-graham/default/default --target-id "$target_id"
```

DOM evidence proves the exact story route, retained Workbench diagnostics and
ready markers. Canvas evidence proves only the rendered route and target;
frozen result hashes and policy bundle gates remain the geometry and isolation
proof.

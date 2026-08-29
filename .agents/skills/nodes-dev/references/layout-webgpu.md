# Layout section in the shared WebGPU Workbench

| Property | Value |
| --- | --- |
| Package | `@nodes/layout` |
| Dagre Layered route | `layout/dagre-layered/default/default` |
| Coffman–Graham Layered route | `layout/coffman-graham/default/default` |
| Other policies | `layout/fixed/baseline/right`, `layout/adaptive/shared/right` |
| Ready | external package ready + exact route |
| Canvas | shared external Storybook canvas |

This section uses the one shared retained Workbench and exact UI Elements/Components.
Each lazy story imports one production policy entrypoint. Dagre Layered shows
the frozen compact reference without supplied ranks, coordinates or routes;
Coffman–Graham Layered owns the separate width-bounded large-graph scenario.

```bash
bun test packages/layout/src packages/layout/storybook packages/worker
bun run --cwd packages/layout typecheck
bun run typecheck
$storybook check /Users/zavx0z/repozitarium/webxr-space/projects/node
$storybook open @nodes/layout layout/coffman-graham/default/default
```

DOM evidence proves the exact story route, retained Workbench diagnostics and
ready markers. Canvas evidence proves only the rendered route and target;
frozen result hashes and policy bundle gates remain the geometry and isolation
proof.

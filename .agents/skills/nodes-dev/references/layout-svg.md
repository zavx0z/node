# Layout SVG page

| Property | Value |
| --- | --- |
| Route | `/layout/fixed-adaptive` |
| Ready | `nodesStorybook=ready`, `nodesLayoutStorybook=ready` |
| Presentation | `#svg-view svg` |

This DOM-only page runs the public fixed/adaptive policies against the six
frozen RIGHT/DOWN fixtures. It must not load Engine, WebGPU, NodeTree or editor.

```bash
SKILL=.agents/skills/nodes-dev
bun test packages/layout/storybook packages/layout/src
bun run --cwd packages/layout typecheck
bun run typecheck
"$SKILL/scripts/nodes-dev.sh" restart "$PWD"
bun "$SKILL/scripts/nodes-browser.ts" reload "$PWD" \
  --route /layout/fixed-adaptive --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" dom "$PWD" \
  --route /layout/fixed-adaptive --target-id "$target_id"
bun "$SKILL/scripts/nodes-browser.ts" console "$PWD" \
  --route /layout/fixed-adaptive --target-id "$target_id"
```

Canvas/touch/profile/interaction actions are unsupported. DOM proves the exact
ready SVG page; frozen result and SVG hashes prove geometry.

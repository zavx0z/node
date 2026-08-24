import {resolveStorybookRouteTree} from "@ui/storybook/route-tree"
import {storybookPublicPath} from "@ui/storybook/environment"
import {
  CORE_STORYBOOK_BASE_PATH,
  CORE_STORYBOOK_ROUTE_TREE,
} from "./core-navigation.ts"

document.documentElement.dataset.nodesStorybook = "starting"
document.documentElement.dataset.nodesStorybookPage = "core"

const resolution = resolveStorybookRouteTree(
  CORE_STORYBOOK_ROUTE_TREE,
  window.location,
  {basePath: storybookPublicPath(CORE_STORYBOOK_BASE_PATH)},
)
if (resolution.kind === "not-found") throw new Error(`Unknown core storybook route: ${window.location.pathname}`)
document.documentElement.dataset.nodesStorybookRouteKind = resolution.node.kind
await import("./core-detail.ts")

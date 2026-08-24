import {
  storybookRouteTreeUrl,
  resolveStorybookRouteTree,
  type StorybookRouteTree,
  type StorybookRouteTreeResolution,
} from "@ui/storybook/route-tree"
import {
  NODE_EDITOR_STORYBOOK_ROUTE_TREE,
} from "../pages/editor/editor-navigation.ts"
import {
  CORE_STORYBOOK_ROUTE_TREE,
} from "../pages/core/core-navigation.ts"
import {
  LAYOUT_STORYBOOK_ROUTE_TREE,
} from "../pages/layout/layout-navigation.ts"
import {
  WORKER_STORYBOOK_ROUTE_TREE,
} from "../pages/worker/worker-navigation.ts"
import {NODE_STORYBOOK_ROUTE_TREE} from "../pages/ui/ui-navigation.ts"
import {
  nodesPackageCatalogEntry,
  nodesPackageForPath,
  type NodesPackageCatalogEntry,
  type NodesPackageStorybookId,
} from "./package-catalog.ts"

const NODES_PACKAGE_ROUTE_TREES: Readonly<Record<NodesPackageStorybookId, StorybookRouteTree<string>>> =
  Object.freeze({
    core: CORE_STORYBOOK_ROUTE_TREE,
    editor: NODE_EDITOR_STORYBOOK_ROUTE_TREE,
    layout: LAYOUT_STORYBOOK_ROUTE_TREE,
    "worker": WORKER_STORYBOOK_ROUTE_TREE,
    ui: NODE_STORYBOOK_ROUTE_TREE,
  })

export type NodesPackageRouteResolution = Readonly<{
  package: NodesPackageCatalogEntry
  resolution: StorybookRouteTreeResolution<string>
}>

export function nodesPackageRouteTree(id: NodesPackageStorybookId): StorybookRouteTree<string> {
  return NODES_PACKAGE_ROUTE_TREES[id]
}

export function nodesPackageOverviewRoute(id: NodesPackageStorybookId): string {
  const entry = nodesPackageCatalogEntry(id)
  return storybookRouteTreeUrl(nodesPackageRouteTree(id), "", {basePath: entry.routePrefix})
}

export function resolveNodesPackageRoute(pathname: string): NodesPackageRouteResolution | null {
  const entry = nodesPackageForPath(pathname)
  if (entry === null) return null
  return Object.freeze({
    package: entry,
    resolution: resolveStorybookRouteTree(
      nodesPackageRouteTree(entry.id),
      {pathname},
      {basePath: entry.routePrefix},
    ),
  })
}

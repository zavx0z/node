import {defineStorybookRouteTree} from "@zavx0z/storybook/route-tree"
import type {StorybookDomNavigationItem} from "@zavx0z/storybook/workbench"
import {
  NODE_PARAMETER_FIELD_KINDS,
  NODE_PARAMETER_FIELD_LABELS,
  NODE_PARAMETER_VARIANTS,
  NODE_PARAMETER_VARIANT_LABELS,
} from "../../ui/storybook/parameter-catalog.ts"
import {
  NODE_SOCKET_DIRECTIONS,
  NODE_SOCKET_DIRECTION_LABELS,
  NODE_SOCKET_KINDS,
  NODE_SOCKET_LABELS,
  type NodeSocketKind,
} from "../../ui/storybook/socket-catalog.ts"
import {
  NODE_EDITOR_DOM_LEAVES,
  UI_AUXILIARY_DOM_LEAVES,
  type UiDomLeafMetadata,
} from "../../ui/storybook/dom/remaining-route-catalog.ts"

export type NodesStoryDescriptor = Readonly<{
  kind: "overview" | "detail"
  route: string
  title: string
  apiName: string
  searchText: string
  primary: Readonly<{id: string; label: string; route: string}>
  secondary: Readonly<{id: string; label: string; route: string}>
  variant: Readonly<{id: string; label: string}>
}>

const CORE = Object.freeze([
  detail("core/node-tree/live", "NodeTree · Живой runtime", "NodeTree",
    {id: "core", label: "NodeTree", route: "core"},
    {id: "node-tree", label: "Runtime", route: "core/node-tree"},
    {id: "live", label: "Живой"}),
])
const EDITOR = Object.freeze([
  detail("editor/node-tree/live", "NodeTreeEditor · Живой authoring", "NodeTreeEditor",
    {id: "editor", label: "NodeTreeEditor", route: "editor"},
    {id: "node-tree", label: "Authoring", route: "editor/node-tree"},
    {id: "live", label: "Живой"}),
])
const LAYOUT = Object.freeze([
  layout("fixed/baseline/right", "Fixed · RIGHT", "layoutFixed", "fixed", "Фиксированная", "baseline", "Базовая топология", "right", "RIGHT"),
  layout("fixed/baseline/down", "Fixed · DOWN", "layoutFixed", "fixed", "Фиксированная", "baseline", "Базовая топология", "down", "DOWN"),
  layout("adaptive/shared/right", "Adaptive shared · RIGHT", "layoutAdaptive", "adaptive", "Адаптивная", "shared", "Общий порт", "right", "Общий порт · RIGHT"),
  layout("adaptive/shared/down", "Adaptive shared · DOWN", "layoutAdaptive", "adaptive", "Адаптивная", "shared", "Общий порт", "down", "Общий порт · DOWN"),
  layout("adaptive/compound/right", "Adaptive compound · RIGHT", "layoutAdaptive", "adaptive", "Адаптивная", "compound", "Контейнеры", "right", "Контейнеры · RIGHT"),
  layout("adaptive/compound/down", "Adaptive compound · DOWN", "layoutAdaptive", "adaptive", "Адаптивная", "compound", "Контейнеры", "down", "Контейнеры · DOWN"),
  layout("dagre-layered/default/default", "Dagre Layered", "layoutTopDown", "dagre-layered", "Dagre Layered", "default", "Default", "default", "Default"),
  layout("coffman-graham/default/default", "Coffman–Graham · W = 4", "layoutCoffmanGraham", "coffman-graham", "Coffman–Graham", "default", "Default", "default", "W = 4"),
])
const WORKER = Object.freeze([
  worker("fixed", "Fixed", "runFixedWorkerRequest"),
  worker("adaptive", "Adaptive", "runAdaptiveWorkerRequest"),
  worker("dagre-layered", "Dagre Layered", "runTopDownWorkerRequest"),
  worker("coffman-graham", "Coffman–Graham", "runCoffmanGrahamWorkerRequest"),
])
const NODE_EDITOR = Object.freeze(NODE_EDITOR_DOM_LEAVES.map(uiMetadata))
const PARAMETER = Object.freeze(NODE_PARAMETER_FIELD_KINDS.flatMap((kind) =>
  NODE_PARAMETER_VARIANTS.map((variant) => detail(
    `ui/parameter/${kind}/${variant}`,
    `${NODE_PARAMETER_FIELD_LABELS[kind]} · ${NODE_PARAMETER_VARIANT_LABELS[variant]}`,
    "Parameter",
    {id: "parameter", label: "Параметры", route: "ui/parameter"},
    {id: kind, label: NODE_PARAMETER_FIELD_LABELS[kind], route: `ui/parameter/${kind}`},
    {id: variant, label: NODE_PARAMETER_VARIANT_LABELS[variant]},
  )),
))
const AUXILIARY = Object.freeze(UI_AUXILIARY_DOM_LEAVES.map(uiMetadata))
const SOCKET = Object.freeze(NODE_SOCKET_KINDS.flatMap((kind) =>
  NODE_SOCKET_DIRECTIONS.map((direction) => detail(
    `ui/socket/${kind}/${direction}`,
    `${NODE_SOCKET_LABELS[kind]} · ${NODE_SOCKET_DIRECTION_LABELS[direction]}`,
    "SocketView",
    {id: "socket", label: "Сокеты", route: "ui/socket"},
    {id: kind, label: NODE_SOCKET_LABELS[kind], route: `ui/socket/${kind}`},
    {id: direction, label: NODE_SOCKET_DIRECTION_LABELS[direction]},
  )),
))

export const NODES_STORIES: readonly NodesStoryDescriptor[] = Object.freeze([
  ...CORE, ...EDITOR, ...LAYOUT, ...WORKER, ...NODE_EDITOR, ...PARAMETER, ...AUXILIARY, ...SOCKET,
])

export const NODES_STORY_ROUTE_TREE = defineStorybookRouteTree({
  leaves: NODES_STORIES.map(({route}) => route),
})

const OVERVIEWS = Object.freeze([
  createRootOverviewDescriptor(),
  ...collectOverviewPaths(NODES_STORIES).map(createOverviewDescriptor),
])
const PRESENTATIONS = Object.freeze([...OVERVIEWS, ...NODES_STORIES])
const PRIMARY_ORDER = Object.freeze([
  "core", "editor", "layout", "worker", "node-editor", "parameter", "socket", "frame", "link", "comparison",
] as const)

export function nodesStoryPresentationRoute(path: string): string {
  const node = NODES_STORY_ROUTE_TREE.find(path)
  if (!node) throw new Error(`Unknown Nodes Storybook route: ${path}`)
  nodesStoryDescriptor(node.path)
  return node.path
}

export function nodesStoryDescriptor(route: string): NodesStoryDescriptor {
  const descriptor = PRESENTATIONS.find((item) => item.route === route)
  if (!descriptor) throw new Error(`Unknown Nodes story: ${route}`)
  return descriptor
}

export function nodesPrimaryItems(): readonly StorybookDomNavigationItem[] {
  const items = uniqueItems(NODES_STORIES, ({primary}) => ({id: primary.id, label: primary.label, route: primary.route}))
  return [...items].sort((left, right) =>
    PRIMARY_ORDER.indexOf(left.id as typeof PRIMARY_ORDER[number]) -
    PRIMARY_ORDER.indexOf(right.id as typeof PRIMARY_ORDER[number]))
}

export function nodesSecondaryItems(route: string): readonly StorybookDomNavigationItem[] {
  const selected = nodesStoryDescriptor(route)
  return uniqueItems(
    NODES_STORIES.filter(({primary}) => primary.id === selected.primary.id),
    ({secondary}) => ({id: secondary.id, label: secondary.label, route: secondary.route}),
  )
}

export function nodesVariantItems(route: string): readonly StorybookDomNavigationItem[] {
  const selected = nodesStoryDescriptor(route)
  if (selected.secondary.id === "overview") return Object.freeze([])
  return NODES_STORIES.filter(({secondary}) => secondary.route === selected.secondary.route).map((item) => ({
    id: item.variant.id,
    label: item.variant.label,
    route: item.route,
  }))
}
export function nodesPrimaryRoute(route: string): string { return nodesStoryDescriptor(route).primary.route }
export function nodesSecondaryRoute(route: string): string { return nodesStoryDescriptor(route).secondary.route }
export function nodesPrimarySelection(route: string): string | null {
  const candidate = nodesPrimaryRoute(route)
  return nodesPrimaryItems().some(({route: itemRoute}) => itemRoute === candidate) ? candidate : null
}
export function nodesSecondarySelection(route: string): string | null {
  const candidate = nodesSecondaryRoute(route)
  return nodesSecondaryItems(route).some(({route: itemRoute}) => itemRoute === candidate) ? candidate : null
}
export function nodesScenarioRoute(route: string): string | null {
  return nodesStoryDescriptor(route).kind === "detail" ? route : null
}
export function nodesDockTitle(route: string): string {
  const owner = nodesStoryDescriptor(route).primary.id
  return owner === "socket" ? "Направление" : owner === "parameter" ? "Варианты" : "Сценарии"
}

function layout(
  suffix: string,
  title: string,
  apiName: string,
  componentId: string,
  componentLabel: string,
  sectionId: string,
  sectionLabel: string,
  variantId: string,
  variantLabel: string,
): NodesStoryDescriptor {
  return detail(
    `layout/${suffix}`, title, apiName,
    {id: "layout", label: "Раскладка", route: "layout"},
    {id: componentId, label: componentLabel, route: `layout/${componentId}`},
    {id: `${sectionId}/${variantId}`, label: variantLabel},
  )
}
function worker(id: string, label: string, apiName: string): NodesStoryDescriptor {
  return detail(
    `worker/${id}/default`, `Worker · ${label}`, apiName,
    {id: "worker", label: "Worker", route: "worker"},
    {id, label, route: `worker/${id}`},
    {id: "default", label: "Request / result"},
  )
}
function uiMetadata(item: UiDomLeafMetadata): NodesStoryDescriptor {
  return detail(item.route, item.title, item.apiName, item.primary, item.secondary, item.variant)
}
function detail(
  route: string,
  title: string,
  apiName: string,
  primary: NodesStoryDescriptor["primary"],
  secondary: NodesStoryDescriptor["secondary"],
  variant: NodesStoryDescriptor["variant"],
): NodesStoryDescriptor {
  return Object.freeze({
    kind: "detail",
    route,
    title,
    apiName,
    primary,
    secondary,
    variant,
    searchText: `${primary.label} ${secondary.label} ${variant.label} ${apiName}`,
  })
}

function collectOverviewPaths(stories: readonly NodesStoryDescriptor[]): readonly string[] {
  const seen = new Set<string>()
  for (const {route} of stories) {
    const segments = route.split("/")
    for (let length = 1; length < segments.length; length += 1) seen.add(segments.slice(0, length).join("/"))
  }
  return [...seen]
}
function createOverviewDescriptor(path: string): NodesStoryDescriptor {
  const representative = NODES_STORIES.find(({route}) => route.startsWith(`${path}/`))
  if (!representative) throw new Error(`Nodes overview has no detail descendant: ${path}`)
  const syntheticUiRoot = path === "ui"
  const primary = syntheticUiRoot ? {id: "ui", label: "Node UI", route: "ui"} : representative.primary
  const primaryOverview = path === primary.route
  const secondary = syntheticUiRoot || primaryOverview
    ? {id: "overview", label: "Обзор", route: path}
    : representative.secondary
  const items = overviewItems(path, representative)
  const title = primaryOverview || syntheticUiRoot ? `${primary.label} · Обзор` : `${secondary.label} · Обзор`
  return Object.freeze({
    kind: "overview",
    route: path,
    title,
    apiName: path.startsWith("ui/socket") ? "SocketView" : primary.label,
    searchText: `${title} ${items.map(({label}) => label).join(" ")}`,
    primary,
    secondary,
    variant: {id: "overview", label: "Обзор"},
  })
}
function createRootOverviewDescriptor(): NodesStoryDescriptor {
  const core = createOverviewDescriptor("core")
  return Object.freeze({...core, route: "", secondary: {id: "overview", label: "Обзор", route: ""}, searchText: `${core.searchText} root`})
}
function overviewItems(path: string, representative: NodesStoryDescriptor): readonly Readonly<{label: string; route: string}>[] {
  if (path === "ui") return uniqueItems(
    NODES_STORIES.filter(({route}) => route.startsWith("ui/")),
    ({primary}) => ({id: primary.id, label: primary.label, route: primary.route}),
  ).map(({label, route}) => ({label, route}))
  if (path === representative.primary.route) return uniqueItems(
    NODES_STORIES.filter(({primary}) => primary.id === representative.primary.id),
    ({secondary}) => ({id: secondary.id, label: secondary.label, route: secondary.route}),
  ).map(({label, route}) => ({label, route}))
  if (path === representative.secondary.route) return NODES_STORIES
    .filter(({secondary}) => secondary.route === representative.secondary.route)
    .map(({variant, route}) => ({label: variant.label, route}))
  const prefix = `${path}/`
  const seen = new Set<string>()
  return NODES_STORIES.flatMap((item) => {
    if (!item.route.startsWith(prefix)) return []
    const child = item.route.slice(prefix.length).split("/")[0]
    if (!child || seen.has(child)) return []
    seen.add(child)
    return [{label: child, route: `${path}/${child}`}]
  })
}
function uniqueItems(
  source: readonly NodesStoryDescriptor[],
  select: (item: NodesStoryDescriptor) => StorybookDomNavigationItem,
): readonly StorybookDomNavigationItem[] {
  const seen = new Set<string>()
  return source.flatMap((item) => {
    const selected = select(item)
    if (seen.has(selected.id)) return []
    seen.add(selected.id)
    return [selected]
  })
}

export type NodesSocketKind = NodeSocketKind

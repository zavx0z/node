import {defineStorybookRouteTree} from "@zavx0z/storybook/route-tree"
import type {
  StorybookStoryArgs,
  StorybookStoryIndexItem,
  StorybookStoryModule,
} from "@zavx0z/storybook/stories"
import type {StorybookNavigationItem} from "@zavx0z/storybook/workbench"
import {LAYOUT_STORIES} from "../../layout/storybook/layout-stories.ts"
import {
  NODE_COMPONENT_STORIES,
  NODE_SOCKET_STORIES,
  isNodeComponentStoryRoute,
} from "../../ui/storybook/ui-story-catalog.ts"
import type {NodeTreeEditorStoryModule} from "../../editor/storybook/editor-story.ts"
import type {NodeUiStoryModule} from "../../ui/storybook/node-ui-story.ts"
import type {NodeSocketKind} from "../../ui/storybook/socket-catalog.ts"

export type NodesStoryModule = StorybookStoryModule | NodeTreeEditorStoryModule | NodeUiStoryModule

export type NodesStoryDescriptor = Readonly<{
  kind: "overview" | "detail"
  route: string
  title: string
  apiName: string
  searchText: string
  primary: Readonly<{id: string; label: string; route: string}>
  secondary: Readonly<{id: string; label: string; route: string}>
  variant: Readonly<{id: string; label: string}>
  load(): Promise<NodesStoryModule>
}>

const CORE_STORIES = Object.freeze([
  story({
    route: "core/node-tree/live",
    title: "NodeTree · Живой runtime",
    apiName: "NodeTree",
    primary: {id: "core", label: "NodeTree", route: "core"},
    secondary: {id: "node-tree", label: "Runtime", route: "core/node-tree"},
    variant: {id: "live", label: "Живой"},
    load: async () => import("../../core/storybook/core-story.ts").then(({createCoreRuntimeStory}) =>
      createCoreRuntimeStory()),
  }),
])

const EDITOR_STORIES = Object.freeze([
  story({
    route: "editor/node-tree/live",
    title: "NodeTreeEditor · Живой authoring",
    apiName: "NodeTreeEditor",
    primary: {id: "editor", label: "NodeTreeEditor", route: "editor"},
    secondary: {id: "node-tree", label: "Authoring", route: "editor/node-tree"},
    variant: {id: "live", label: "Живой"},
    load: async () => import("../../editor/storybook/editor-story.ts").then(({createNodeTreeEditorStoryModule}) =>
      createNodeTreeEditorStoryModule()),
  }),
])

const LAYOUT_OWNER_STORIES = Object.freeze(LAYOUT_STORIES.index.map((item) => story({
  route: `layout/${item.route}`,
  title: item.title,
  apiName: item.apiName,
  searchText: item.searchText,
  primary: {id: "layout", label: "Раскладка", route: "layout"},
  secondary: {
    id: item.componentId,
    label: item.componentLabel,
    route: `layout/${item.componentId}`,
  },
  variant: {
    id: `${item.sectionId}/${item.variantId}`,
    label: layoutVariantLabel(item.componentId, item.sectionLabel, item.variantLabel),
  },
  load: () => LAYOUT_STORIES.load(item.route),
})))

const WORKER_STORIES = Object.freeze([
  workerStory("fixed", "Fixed", "runFixedWorkerRequest", "loadFixedWorkerStory"),
  workerStory("adaptive", "Adaptive", "runAdaptiveWorkerRequest", "loadAdaptiveWorkerStory"),
  workerStory("dagre-layered", "Dagre Layered", "runTopDownWorkerRequest", "loadDagreLayeredWorkerStory"),
  workerStory("coffman-graham", "Coffman–Graham", "runCoffmanGrahamWorkerRequest", "loadCoffmanGrahamWorkerStory"),
])

const UI_STORIES = Object.freeze([
  ...NODE_COMPONENT_STORIES.index.map((item) => uiStory(item, async () => {
    const module = await NODE_COMPONENT_STORIES.load(item.route)
    if (!["node-editor", "frame", "link", "comparison"].includes(item.componentId)) return module
    if (!isNodeComponentStoryRoute(item.route)) throw new Error(`Invalid Node UI story route: ${item.route}`)
    const {createNodeUiStoryModule} = await import("../../ui/storybook/node-ui-story.ts")
    return createNodeUiStoryModule(item.route, module)
  })),
  ...NODE_SOCKET_STORIES.index.map((item) => uiStory(item, () => NODE_SOCKET_STORIES.load(item.route))),
])

export const NODES_STORIES: readonly NodesStoryDescriptor[] = Object.freeze([
  ...CORE_STORIES,
  ...EDITOR_STORIES,
  ...LAYOUT_OWNER_STORIES,
  ...WORKER_STORIES,
  ...UI_STORIES,
])

export const NODES_STORY_ROUTE_TREE = defineStorybookRouteTree({
  leaves: NODES_STORIES.map(({route}) => route),
})

const NODES_OVERVIEWS: readonly NodesStoryDescriptor[] = Object.freeze(
  [createRootOverviewDescriptor(), ...collectOverviewPaths(NODES_STORIES).map(createOverviewDescriptor)],
)

const NODES_PRESENTATIONS: readonly NodesStoryDescriptor[] = Object.freeze([
  ...NODES_OVERVIEWS,
  ...NODES_STORIES,
])

const PRIMARY_ORDER = Object.freeze([
  "core",
  "editor",
  "layout",
  "worker",
  "node-editor",
  "parameter",
  "socket",
  "frame",
  "link",
  "comparison",
] as const)

const loadCache = new Map<string, Promise<NodesStoryModule>>()

export function nodesStoryPresentationRoute(path: string): string {
  const node = NODES_STORY_ROUTE_TREE.find(path)
  if (node === undefined) throw new Error(`Unknown Nodes Storybook route: ${path}`)
  nodesStoryDescriptor(node.path)
  return node.path
}

export function nodesStoryDescriptor(route: string): NodesStoryDescriptor {
  const descriptor = NODES_PRESENTATIONS.find((item) => item.route === route)
  if (descriptor === undefined) throw new Error(`Unknown Nodes story: ${route}`)
  return descriptor
}

export function loadNodesStory(route: string): Promise<NodesStoryModule> {
  const descriptor = nodesStoryDescriptor(route)
  const cached = loadCache.get(route)
  if (cached !== undefined) return cached
  const pending = descriptor.load().then(validateStoryModule).catch((error) => {
    if (loadCache.get(route) === pending) loadCache.delete(route)
    throw error
  })
  loadCache.set(route, pending)
  return pending
}

export function nodesPrimaryItems(): readonly StorybookNavigationItem<string>[] {
  const items = uniqueItems(NODES_STORIES, ({primary}) => ({
    id: primary.id,
    label: primary.label,
    route: primary.route,
  }))
  return [...items].sort((left, right) => (
    PRIMARY_ORDER.indexOf(left.id as typeof PRIMARY_ORDER[number]) -
    PRIMARY_ORDER.indexOf(right.id as typeof PRIMARY_ORDER[number])
  ))
}

export function nodesSecondaryItems(route: string): readonly StorybookNavigationItem<string>[] {
  const selected = nodesStoryDescriptor(route)
  return uniqueItems(
    NODES_STORIES.filter(({primary}) => primary.id === selected.primary.id),
    ({secondary}) => ({id: secondary.id, label: secondary.label, route: secondary.route}),
  )
}

export function nodesVariantItems(route: string): readonly StorybookNavigationItem<string>[] {
  const selected = nodesStoryDescriptor(route)
  if (selected.secondary.id === "overview") return Object.freeze([])
  return NODES_STORIES.filter(({secondary}) => secondary.route === selected.secondary.route).map((item) => ({
    id: item.variant.id,
    label: item.variant.label,
    route: item.route,
  }))
}

export function nodesPrimaryRoute(route: string): string {
  return nodesStoryDescriptor(route).primary.route
}

export function nodesSecondaryRoute(route: string): string {
  return nodesStoryDescriptor(route).secondary.route
}

export function nodesDockTitle(route: string): string {
  const owner = nodesStoryDescriptor(route).primary.id
  if (owner === "socket") return "Направление"
  if (owner === "parameter") return "Варианты"
  return "Сценарии"
}

function workerStory(
  id: string,
  label: string,
  apiName: string,
  loader: "loadFixedWorkerStory" | "loadAdaptiveWorkerStory" |
    "loadDagreLayeredWorkerStory" | "loadCoffmanGrahamWorkerStory",
): NodesStoryDescriptor {
  return story({
    route: `worker/${id}/default`,
    title: `Worker · ${label}`,
    apiName,
    primary: {id: "worker", label: "Worker", route: "worker"},
    secondary: {id, label, route: `worker/${id}`},
    variant: {id: "default", label: "Request / result"},
    load: async () => {
      const module = await import("../../worker/storybook/worker-stories.ts")
      return module[loader]()
    },
  })
}

function uiStory(
  item: StorybookStoryIndexItem,
  load: () => Promise<NodesStoryModule>,
): NodesStoryDescriptor {
  const primaryLabel = item.componentId === "socket" ? "Сокеты" : item.componentLabel
  return story({
    route: `ui/${item.route}`,
    title: item.title,
    apiName: item.apiName,
    searchText: item.searchText,
    primary: {id: item.componentId, label: primaryLabel, route: `ui/${item.componentId}`},
    secondary: {
      id: item.sectionId,
      label: item.sectionLabel,
      route: `ui/${item.componentId}/${item.sectionId}`,
    },
    variant: {id: item.variantId, label: item.variantLabel},
    load,
  })
}

function layoutVariantLabel(componentId: string, sectionLabel: string, variantLabel: string): string {
  const sectionCount = new Set(LAYOUT_STORIES.index
    .filter((item) => item.componentId === componentId)
    .map(({sectionId}) => sectionId)).size
  return sectionCount > 1 ? `${sectionLabel} · ${variantLabel}` : variantLabel
}

function story(
  input: Omit<NodesStoryDescriptor, "kind" | "searchText"> & {searchText?: string},
): NodesStoryDescriptor {
  return Object.freeze({
    kind: "detail",
    ...input,
    searchText: input.searchText ?? `${input.primary.label} ${input.secondary.label} ${input.variant.label} ${input.apiName}`,
  })
}

function collectOverviewPaths(stories: readonly NodesStoryDescriptor[]): readonly string[] {
  const seen = new Set<string>()
  for (const {route} of stories) {
    const segments = route.split("/")
    for (let length = 1; length < segments.length; length += 1) {
      seen.add(segments.slice(0, length).join("/"))
    }
  }
  return [...seen]
}

function createOverviewDescriptor(path: string): NodesStoryDescriptor {
  const representative = NODES_STORIES.find(({route}) => route.startsWith(`${path}/`))
  if (representative === undefined) throw new Error(`Nodes overview has no detail descendant: ${path}`)
  const syntheticUiRoot = path === "ui"
  const primary = syntheticUiRoot
    ? {id: "ui", label: "Node UI", route: "ui"}
    : representative.primary
  const isPrimaryOverview = path === primary.route
  const secondary = syntheticUiRoot || isPrimaryOverview
    ? {id: "overview", label: "Обзор", route: path}
    : representative.secondary
  const items = overviewItems(path, representative)
  const socketKind = path === "ui/socket"
    ? null
    : path.startsWith("ui/socket/") && path.split("/").length === 3
      ? representative.secondary.id as NodeSocketKind
      : undefined
  const title = overviewTitle(path, primary.label, secondary.label, isPrimaryOverview || syntheticUiRoot)
  return Object.freeze({
    kind: "overview",
    route: path,
    title,
    apiName: path.startsWith("ui/socket") ? "SocketView" : primary.label,
    searchText: `${title} ${items.map(({label}) => label).join(" ")}`,
    primary,
    secondary,
    variant: {id: "overview", label: "Обзор"},
    load: socketKind !== undefined
      ? async () => import("../../ui/storybook/stories/socket-overview.ts")
        .then(({createSocketOverviewStory}) => createSocketOverviewStory(socketKind))
      : async () => import("./overview.ts").then(({createNodesOverviewStory}) => createNodesOverviewStory({
        title,
        summary: overviewSummary(path, items.length),
        items,
      })),
  })
}

function createRootOverviewDescriptor(): NodesStoryDescriptor {
  const core = createOverviewDescriptor("core")
  return Object.freeze({
    ...core,
    route: "",
    secondary: {id: "overview", label: "Обзор", route: ""},
    searchText: `${core.searchText} root`,
  })
}

function overviewItems(
  path: string,
  representative: NodesStoryDescriptor,
): readonly Readonly<{label: string; route: string}>[] {
  if (path === "ui") {
    return uniqueItems(
      NODES_STORIES.filter(({route}) => route.startsWith("ui/")),
      ({primary}) => ({id: primary.id, label: primary.label, route: primary.route}),
    ).map(({label, route}) => ({label, route}))
  }
  if (path === representative.primary.route) {
    return uniqueItems(
      NODES_STORIES.filter(({primary}) => primary.id === representative.primary.id),
      ({secondary}) => ({id: secondary.id, label: secondary.label, route: secondary.route}),
    ).map(({label, route}) => ({label, route}))
  }
  if (path === representative.secondary.route) {
    return NODES_STORIES.filter(({secondary}) => secondary.route === representative.secondary.route)
      .map(({variant, route}) => ({label: variant.label, route}))
  }
  const prefix = `${path}/`
  const seen = new Set<string>()
  return NODES_STORIES.flatMap((item) => {
    if (!item.route.startsWith(prefix)) return []
    const child = item.route.slice(prefix.length).split("/")[0]
    if (child === undefined || seen.has(child)) return []
    seen.add(child)
    const route = `${path}/${child}`
    const label = item.route === route ? item.variant.label : child
    return [{label, route}]
  })
}

function overviewTitle(path: string, primary: string, secondary: string, primaryOverview: boolean): string {
  if (primaryOverview) return `${primary} · Обзор`
  if (path.endsWith(`/${path.split("/").at(-1)}`)) return `${secondary} · Обзор`
  return `${path.split("/").at(-1) ?? primary} · Обзор`
}

function overviewSummary(path: string, count: number): string {
  const subject = path === "ui" ? "разделов Node UI" : path.split("/").at(-1) ?? "разделов"
  return `${count} ${subject}: общая информация до выбора точного сценария`
}

function uniqueItems(
  source: readonly NodesStoryDescriptor[],
  select: (item: NodesStoryDescriptor) => StorybookNavigationItem<string>,
): readonly StorybookNavigationItem<string>[] {
  const seen = new Set<string>()
  return source.flatMap((item) => {
    const selected = select(item)
    if (seen.has(selected.id)) return []
    seen.add(selected.id)
    return [selected]
  })
}

function validateStoryModule(module: NodesStoryModule): NodesStoryModule {
  if (module === null || typeof module !== "object" || typeof module.source !== "function" ||
    module.defaultArgs === null || typeof module.defaultArgs !== "object" || !Array.isArray(module.controls)) {
    throw new Error("Nodes Storybook loader returned an invalid story module")
  }
  if ("kind" in module) {
    if (!["node-tree-editor-preview", "node-ui-preview"].includes(module.kind) ||
      typeof module.createPreview !== "function") {
      throw new Error("Nodes Storybook loader returned an invalid adapter module")
    }
    return module
  }
  if (typeof module.render !== "function") throw new Error("Nodes Storybook loader returned an invalid story module")
  return module
}

export type NodesStoryArgs = StorybookStoryArgs

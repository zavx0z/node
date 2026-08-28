import {loadDocumentDefaultFont} from "@engine/core/default-font"
import {
  createDocument,
  type CustomEvent as DomCustomEvent,
} from "@zavx0z/dom"
import {createDocumentCanvasRuntime} from "@zavx0z/renderer-browser"
import {
  STORYBOOK_DOM_WORKBENCH_EVENTS,
  createStorybookDomWorkbench,
  storybookDomWorkbenchCss,
} from "@zavx0z/storybook/workbench"
import {
  storybookPublicPath,
  waitForStorybookFrameBoundary,
} from "@zavx0z/storybook/environment"
import {StorybookRouteTreeRouter} from "@zavx0z/storybook/route-tree"
import {
  NODES_STORY_ROUTE_TREE,
  nodesDockTitle,
  nodesPrimaryItems,
  nodesPrimarySelection,
  nodesScenarioRoute,
  nodesSecondaryItems,
  nodesSecondarySelection,
  nodesStoryDescriptor,
  nodesVariantItems,
} from "./dom-catalog.ts"
import {nodesDomStoryCss} from "./dom-css.ts"
import {
  createNodesDomRouteStory,
  type NodesDomRouteStory,
} from "./dom-story.ts"
import {createNodesPropsInspector} from "./props-inspector.ts"

const canvas = document.getElementById("nodes-storybook-canvas")
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Nodes Storybook canvas not found")

declare global {
  var __nodesStorybookCapturePresentedFrame: (() => Promise<Blob | null>) | undefined
}

document.documentElement.dataset.nodesStorybook = "starting"
document.documentElement.dataset.nodesStorybookPage = "workbench"
document.documentElement.dataset.nodesStorybookPipeline = "dom-webgpu"

try {
  const router = new StorybookRouteTreeRouter(NODES_STORY_ROUTE_TREE, {
    basePath: storybookPublicPath("node", "/"),
  })
  const semanticDocument = createDocument()
  let route = router.current.path
  let descriptor = nodesStoryDescriptor(route)
  let story = await createNodesDomRouteStory(semanticDocument, route)
  await storyReady(story)
  const propsInspector = createNodesPropsInspector(semanticDocument, {
    title: descriptor.title,
    apiName: descriptor.apiName,
    route,
    owner: descriptor.primary.id,
    props: story.props,
  })
  let disposed = false
  let routeRevision = 0

  const workbench = createStorybookDomWorkbench({
    document: semanticDocument,
    parent: semanticDocument,
    initial: {
      title: "Nodes Storybook",
      "catalog.label": "Nodes",
      "catalog.items": catalogItems(),
      "catalog.active": nodesPrimarySelection(route),
      "secondary.label": descriptor.primary.label,
      "secondary.items": secondaryItems(route),
      "secondary.active": nodesSecondarySelection(route),
      "preview.label": descriptor.title,
      "preview.node": story.element,
      "scenarios.label": nodesDockTitle(route),
      "scenarios.items": scenarioItems(route),
      "scenarios.active": nodesScenarioRoute(route),
      "inspector.node": propsInspector.element,
      status: {
        lead: "Создано для ",
        owner: "MetaFor",
        detail: " · HTML DOM → WebGPU",
      },
    },
  })

  const font = await loadDocumentDefaultFont()
  const runtime = await createDocumentCanvasRuntime({
    canvas,
    document: semanticDocument,
    root: workbench.element,
    styleSheets: [storybookDomWorkbenchCss, nodesDomStoryCss],
    font,
    tooltipDelayMs: 500,
    distance: 600,
  })
  globalThis.__nodesStorybookCapturePresentedFrame = () =>
    runtime.captureLastPresentedFramePng()

  const publish = (): void => {
    const source = story.source()
    propsInspector.update({
      title: descriptor.title,
      apiName: descriptor.apiName,
      route,
      owner: descriptor.primary.id,
      props: story.props,
    })
    document.documentElement.dataset.nodesStorybookRoute = route === "" ? "/" : `/${route}`
    document.documentElement.dataset.nodesStorybookStory = route
    document.documentElement.dataset.nodesStorybookOwner = descriptor.primary.id
    document.documentElement.dataset.nodesStorybookArgs = JSON.stringify(story.props)
    document.documentElement.dataset.nodesStorybookHtml = source.html
    document.documentElement.dataset.nodesStorybookCss = source.css
    document.documentElement.dataset.nodesStorybookTypescript = source.typescript
    document.documentElement.dataset.nodesStorybookPanelCategory = "props"
    runtime.requestRender()
  }
  const onStoryInteraction = (): void => publish()
  const bindStory = (target: NodesDomRouteStory): void => {
    target.element.addEventListener("click", onStoryInteraction)
    target.element.addEventListener("input", onStoryInteraction)
    target.element.addEventListener("change", onStoryInteraction)
  }
  const unbindStory = (target: NodesDomRouteStory): void => {
    target.element.removeEventListener("click", onStoryInteraction)
    target.element.removeEventListener("input", onStoryInteraction)
    target.element.removeEventListener("change", onStoryInteraction)
  }
  bindStory(story)

  const applyRoute = async (targetRoute: string): Promise<void> => {
    if (disposed) return
    if (targetRoute === route) {
      runtime.requestRender()
      return
    }
    const revision = ++routeRevision
    document.documentElement.dataset.nodesStorybook = "starting"
    const nextDescriptor = nodesStoryDescriptor(targetRoute)
    const nextStory = await createNodesDomRouteStory(semanticDocument, targetRoute)
    await storyReady(nextStory)
    if (disposed || revision !== routeRevision) {
      nextStory.dispose()
      return
    }
    const previous = story
    unbindStory(previous)
    route = targetRoute
    descriptor = nextDescriptor
    story = nextStory
    bindStory(story)
    workbench.update("catalog.active", nodesPrimarySelection(route))
    workbench.update("secondary.label", descriptor.primary.label)
    workbench.update("secondary.items", secondaryItems(route))
    workbench.update("secondary.active", nodesSecondarySelection(route))
    workbench.update("preview.label", descriptor.title)
    workbench.update("preview.node", story.element)
    workbench.update("scenarios.label", nodesDockTitle(route))
    workbench.update("scenarios.items", scenarioItems(route))
    workbench.update("scenarios.active", nodesScenarioRoute(route))
    previous.dispose()
    publish()
    await waitForStorybookFrameBoundary()
    if (!disposed && revision === routeRevision) document.documentElement.dataset.nodesStorybook = "ready"
  }
  const navigate = (targetRoute: string): void => {
    if (!router.go(targetRoute)) throw new Error(`Unknown Nodes Storybook route: ${targetRoute}`)
    if (targetRoute === route) runtime.requestRender()
  }
  const onNavigate = (event: unknown): void => navigate((event as DomCustomEvent<{route: string}>).detail.route)
  const onScenario = (event: unknown): void => navigate((event as DomCustomEvent<{id: string}>).detail.id)
  const unsubscribe = router.subscribe((node) => {
    void applyRoute(node.path).catch(publishError)
  })

  workbench.element.addEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.navigate, onNavigate)
  workbench.element.addEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.scenario, onScenario)
  const dispose = (): void => {
    if (disposed) return
    disposed = true
    routeRevision += 1
    unsubscribe()
    router.dispose()
    unbindStory(story)
    workbench.element.removeEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.navigate, onNavigate)
    workbench.element.removeEventListener(STORYBOOK_DOM_WORKBENCH_EVENTS.scenario, onScenario)
    story.dispose()
    propsInspector.dispose()
    workbench.dispose()
    runtime.dispose()
    globalThis.__nodesStorybookCapturePresentedFrame = undefined
  }
  window.addEventListener("pagehide", dispose, {once: true})

  publish()
  await waitForStorybookFrameBoundary()
  document.documentElement.dataset.nodesStorybook = "ready"
} catch (error) {
  publishError(error)
  throw error
}

function catalogItems(): readonly Readonly<{id: string; label: string; route: string}>[] {
  return nodesPrimaryItems().map(({label, route}) => ({id: route, label, route}))
}
function secondaryItems(route: string): readonly Readonly<{id: string; label: string; route: string}>[] {
  return nodesSecondaryItems(route).map(({label, route: itemRoute}) => ({id: itemRoute, label, route: itemRoute}))
}
function scenarioItems(route: string): readonly Readonly<{id: string; label: string}>[] {
  return nodesVariantItems(route).map(({label, route: itemRoute}) => ({id: itemRoute, label}))
}
function publishError(error: unknown): void {
  document.documentElement.dataset.nodesStorybook = "error"
  document.documentElement.dataset.nodesStorybookError = error instanceof Error
    ? error.stack ?? error.message
    : String(error)
  console.error(error)
}

async function storyReady(story: NodesDomRouteStory): Promise<void> {
  if ("ready" in story && typeof story.ready === "function") await story.ready()
}

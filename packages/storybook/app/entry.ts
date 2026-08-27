import {UiRuntime} from "@layout/core/runtime"
import {
  StorybookBackdropSurface,
  StorybookDockSurface,
  StorybookNavigationSurface,
  StorybookStatusBarSurface,
  StorybookStoryPanelSurface,
  planStorybookShell,
  type StorybookStoryPanelCategory,
  type StorybookStoryPanelOptions,
} from "@zavx0z/storybook/workbench"
import {
  StorybookRouteTreeRouter,
  type StorybookRouteTreeNode,
} from "@zavx0z/storybook/route-tree"
import {
  storybookPublicPath,
  waitForStorybookFrameBoundary,
} from "@zavx0z/storybook/environment"
import type {
  StorybookStoryArgs,
  StorybookStoryModule,
} from "@zavx0z/storybook/stories"
import type {
  NodeTreeEditorStoryModule,
  NodeTreeEditorStoryPreview,
} from "../../editor/storybook/editor-story.ts"
import type {
  NodeUiStoryModule,
  NodeUiStoryPreview,
  NodeUiStorySurfaceId,
} from "../../ui/storybook/node-ui-story.ts"
import {NodesStoryPreviewSurface} from "./preview.ts"
import {
  NODES_STORY_ROUTE_TREE,
  loadNodesStory,
  nodesDockTitle,
  nodesPrimaryItems,
  nodesPrimaryRoute,
  nodesSecondaryItems,
  nodesSecondaryRoute,
  nodesStoryDescriptor,
  nodesStoryPresentationRoute,
  nodesVariantItems,
  type NodesStoryDescriptor,
  type NodesStoryModule,
} from "./stories.ts"

const canvas = document.getElementById("nodes-storybook-canvas")
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Nodes Storybook canvas not found")
const storyCanvas = canvas

document.documentElement.dataset.nodesStorybook = "starting"

try {
  const runtime = await UiRuntime.create(storyCanvas, {
    virtualDisplay: {initial: "near", surfaceDisplay: true, grid: false},
  })
  runtime.handleResize()
  const router = new StorybookRouteTreeRouter(NODES_STORY_ROUTE_TREE, {
    basePath: storybookPublicPath("node", "/"),
  })
  const initialNode = router.current
  let route = nodesStoryPresentationRoute(initialNode.path)
  let descriptor = nodesStoryDescriptor(route)
  let story: NodesStoryModule = await loadNodesStory(route)
  let args: StorybookStoryArgs = Object.freeze({...story.defaultArgs})
  let panelCategory: StorybookStoryPanelCategory = "source"
  let loadRevision = 0
  let primaryQuery = ""
  let editorPreview: NodeTreeEditorStoryPreview | null = null
  let editorActive = false
  let nodeUiPreview: NodeUiStoryPreview | null = null
  let nodeUiActive = false

  const navigate = (path: string): void => {
    if (!router.go(path)) throw new Error(`Unknown Nodes Storybook route: ${path}`)
  }
  const backdrop = new StorybookBackdropSurface()
  const catalog = new StorybookNavigationSurface<string>(primaryOptions())
  const sections = new StorybookNavigationSurface<string>(secondaryOptions())
  const preview = new NodesStoryPreviewSurface()
  if (isStandardStory(story)) preview.setStory(descriptor, story, args)
  const dock = new StorybookDockSurface<string>(dockOptions())
  const statusBar = new StorybookStatusBarSurface()
  let storyPanel: StorybookStoryPanelSurface

  const panelOptions = (): StorybookStoryPanelOptions => ({
    source: story.source(args),
    args,
    controls: story.controls,
    events: [
      {id: "route", label: "Сценарий", value: route},
      {id: "owner", label: "Владелец", value: descriptor.primary.label},
      {id: "api", label: "API", value: descriptor.apiName},
    ],
    category: panelCategory,
    onCategoryChange(category) {
      panelCategory = category
      storyPanel.setOptions(panelOptions())
      publish()
    },
    onControlChange(key, value) {
      args = Object.freeze({...args, [key]: value})
      if (isStandardStory(story)) preview.setArgs(args)
      else if (isNodeUiStory(story) && nodeUiPreview !== null) {
        nodeUiPreview.update(story.selection(args))
      }
      storyPanel.setOptions(panelOptions())
      publish()
    },
    async onCopy(kind, source) {
      try {
        await navigator.clipboard.writeText(source)
        document.documentElement.dataset.nodesStorybookCopy = `${kind}:copied`
      } catch {
        document.documentElement.dataset.nodesStorybookCopy = `${kind}:error`
      }
    },
  })
  storyPanel = new StorybookStoryPanelSurface(panelOptions())

  const frames = (w: number, h: number) => planStorybookShell(w, h, {
    responsive: {compactBelow: 980, compactPanels: ["catalog", "section", "dock", "info"]},
  })
  runtime.addSurface(backdrop, ({w, h}) => ({x: 0, y: 0, w, h}))
  runtime.addSurface(catalog, ({w, h}) => frames(w, h).catalog)
  runtime.addSurface(sections, ({w, h}) => frames(w, h).section)
  runtime.addSurface(preview, ({w, h}) => editorActive || nodeUiActive ? hiddenFrame() : frames(w, h).preview)
  runtime.addSurface(dock, ({w, h}) => editorActive ? hiddenFrame() : frames(w, h).dock)
  runtime.addSurface(storyPanel, ({w, h}) => frames(w, h).info)
  runtime.addSurface(statusBar, ({w, h}) => frames(w, h).status)

  function primaryOptions() {
    return {
      title: "Nodes",
      items: nodesPrimaryItems(),
      route: nodesPrimaryRoute(route),
      onNavigate: navigate,
      query: primaryQuery,
      searchPlaceholder: "Раздел, API…",
      onQueryChange(query: string) {
        primaryQuery = query
        catalog.setOptions(primaryOptions())
        publish()
      },
    }
  }

  function secondaryOptions() {
    return {
      title: descriptor.primary.label,
      items: nodesSecondaryItems(route),
      route: nodesSecondaryRoute(route),
      onNavigate: navigate,
    }
  }

  function dockOptions() {
    return {
      title: nodesDockTitle(route),
      items: nodesVariantItems(route),
      route,
      onNavigate: navigate,
    }
  }

  async function applyNode(node: StorybookRouteTreeNode<string>): Promise<void> {
    const revision = ++loadRevision
    document.documentElement.dataset.nodesStorybook = "starting"
    const nextRoute = nodesStoryPresentationRoute(node.path)
    const nextDescriptor = nodesStoryDescriptor(nextRoute)
    const nextStory = await loadNodesStory(nextRoute)
    if (revision !== loadRevision || router.current !== node) return
    route = nextRoute
    descriptor = nextDescriptor
    story = nextStory
    args = Object.freeze({...story.defaultArgs})
    if (isEditorStory(story)) await activateEditorStory(story)
    else if (isNodeUiStory(story)) await activateNodeUiStory(story)
    else activateStandardStory()
    catalog.setOptions(primaryOptions())
    sections.setOptions(secondaryOptions())
    dock.setOptions(dockOptions())
    if (isStandardStory(story)) preview.setStory(descriptor, story, args)
    storyPanel.setOptions(panelOptions())
    runtime.relayout()
    publish()
    await waitForStorybookFrameBoundary()
    if (revision !== loadRevision || router.current !== node) return
    document.documentElement.dataset.nodesStorybook = "ready"
  }

  function publish(): void {
    for (const surface of [catalog, sections, preview, dock, storyPanel, statusBar]) surface.flushPendingRender()
    for (const entry of editorPreview?.surfaces ?? []) entry.surface.flushPendingRender?.()
    for (const entry of nodeUiPreview?.surfaces ?? []) entry.surface.flushPendingRender?.()
    runtime.space.updateWorldMatrix()
    runtime.renderer.renderFrame(runtime.space, runtime.hud, runtime.viewPoint)
    document.documentElement.dataset.nodesStorybookRoute = router.current.path
    document.documentElement.dataset.nodesStorybookStory = route
    document.documentElement.dataset.nodesStorybookOwner = descriptor.primary.id
    document.documentElement.dataset.nodesStorybookArgs = JSON.stringify(args)
    const source = story.source(args)
    document.documentElement.dataset.nodesStorybookHtml = source.html
    document.documentElement.dataset.nodesStorybookCss = source.css
    document.documentElement.dataset.nodesStorybookTypescript = source.typescript
  }

  async function activateEditorStory(module: NodeTreeEditorStoryModule): Promise<void> {
    if (editorPreview === null) {
      editorPreview = await module.createPreview({
        viewport() {
          const frame = frames(
            storyCanvas.clientWidth || storyCanvas.width,
            storyCanvas.clientHeight || storyCanvas.height,
          ).preview
          return {width: Math.max(1, frame.w), height: Math.max(1, frame.h)}
        },
        onChange(snapshot) {
          document.documentElement.dataset.nodesEditorStory = JSON.stringify(snapshot)
          publish()
        },
        onError: publishError,
      })
      for (const entry of editorPreview.surfaces) {
        entry.surface.node.visible = false
        runtime.addSurface(entry.surface, ({w, h}) => {
          if (!editorActive) return hiddenFrame()
          return entry.slot === "preview" ? frames(w, h).preview : frames(w, h).dock
        })
      }
    }
    editorActive = true
    nodeUiActive = false
    preview.node.visible = false
    dock.node.visible = false
    for (const entry of editorPreview.surfaces) entry.surface.node.visible = true
    for (const entry of nodeUiPreview?.surfaces ?? []) entry.surface.node.visible = false
  }

  async function activateNodeUiStory(module: NodeUiStoryModule): Promise<void> {
    if (nodeUiPreview === null) {
      nodeUiPreview = await module.createPreview({
        viewport() {
          const frame = frames(
            storyCanvas.clientWidth || storyCanvas.width,
            storyCanvas.clientHeight || storyCanvas.height,
          ).preview
          return {width: Math.max(1, frame.w), height: Math.max(1, frame.h)}
        },
        frame: nodeUiFrame,
        async renderNextFrame() {
          runtime.relayout()
          publish()
          await waitForStorybookFrameBoundary()
        },
        onChange(snapshot) {
          document.documentElement.dataset.nodesUiStory = JSON.stringify(snapshot)
          if (isNodeUiStory(story) && story.selection().route === snapshot.route) {
            args = snapshot.args
            storyPanel.setOptions(panelOptions())
          }
          publish()
        },
        onError: publishError,
      }, module.selection(args))
      for (const entry of nodeUiPreview.surfaces) {
        runtime.addSurface(entry.surface, () => nodeUiActive ? entry.frame() : hiddenFrame())
      }
    } else {
      nodeUiPreview.update(module.selection(args))
    }
    nodeUiActive = true
    editorActive = false
    preview.node.visible = false
    dock.node.visible = true
    for (const entry of editorPreview?.surfaces ?? []) entry.surface.node.visible = false
    runtime.relayout()
    await nodeUiPreview.ready()
  }

  function nodeUiFrame(id: NodeUiStorySurfaceId) {
    const previewFrame = frames(
      storyCanvas.clientWidth || storyCanvas.width,
      storyCanvas.clientHeight || storyCanvas.height,
    ).preview
    if (id === "editor") return previewFrame
    const gap = 4
    const width = Math.max(1, (previewFrame.w - gap) / 2)
    if (id === "reference") return {...previewFrame, w: width}
    return {...previewFrame, x: previewFrame.x + width + gap, w: width}
  }

  function activateStandardStory(): void {
    editorActive = false
    nodeUiActive = false
    preview.node.visible = true
    dock.node.visible = true
    for (const entry of editorPreview?.surfaces ?? []) entry.surface.node.visible = false
    for (const entry of nodeUiPreview?.surfaces ?? []) entry.surface.node.visible = false
  }

  router.subscribe((node) => {
    void applyNode(node).catch(publishError)
  })
  new ResizeObserver(() => {
    runtime.handleResize()
    publish()
  }).observe(storyCanvas)
  if (isEditorStory(story)) await activateEditorStory(story)
  else if (isNodeUiStory(story)) await activateNodeUiStory(story)
  else activateStandardStory()
  runtime.relayout()
  publish()
  await waitForStorybookFrameBoundary()
  if (router.current === initialNode) document.documentElement.dataset.nodesStorybook = "ready"
} catch (error) {
  publishError(error)
  throw error
}

function publishError(error: unknown): void {
  document.documentElement.dataset.nodesStorybook = "error"
  document.documentElement.dataset.nodesStorybookError = error instanceof Error
    ? error.stack ?? error.message
    : String(error)
  console.error(error)
}

function isEditorStory(module: NodesStoryModule): module is NodeTreeEditorStoryModule {
  return "kind" in module && module.kind === "node-tree-editor-preview"
}

function isStandardStory(module: NodesStoryModule): module is StorybookStoryModule {
  return !isEditorStory(module) && !isNodeUiStory(module)
}

function isNodeUiStory(module: NodesStoryModule): module is NodeUiStoryModule {
  return "kind" in module && module.kind === "node-ui-preview"
}

function hiddenFrame(): Readonly<{x: number; y: number; w: number; h: number}> {
  return {x: 0, y: 0, w: 1, h: 1}
}

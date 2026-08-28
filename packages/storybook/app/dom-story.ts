import type {Document} from "@zavx0z/dom"
import {
  createNodeTreeEditorStory,
  type NodeTreeEditorRoute,
  type NodeTreeEditorStory,
} from "../../ui/storybook/dom/node-tree-editor-story.ts"
import type {
  LayoutDomRoute,
  LayoutDomStory,
} from "../../layout/storybook/dom/layout-dom-story.ts"
import type {
  WorkerDomRoute,
  WorkerDomStory,
} from "../../worker/storybook/dom/worker-dom-story.ts"
import type {ProductionNodeStory} from "./production-node-story.ts"

export type NodesDomRouteStory = NodeTreeEditorStory | LayoutDomStory |
  WorkerDomStory | ProductionNodeStory

export async function createNodesDomRouteStory(
  document: Document,
  route: string,
): Promise<NodesDomRouteStory> {
  if (route === "ui/node-editor/scene/compiled-general") {
    const {createCompiledNodeSystemStory} = await import("./compiled-node-system-story.tsx")
    return createCompiledNodeSystemStory(document)
  }
  if (route === "ui" || route.startsWith("ui/")) {
    const {createProductionNodeStory} = await import("./production-node-story.ts")
    return createProductionNodeStory(document, route)
  }
  if (route === "layout" || route.startsWith("layout/")) {
    const {createLayoutDomStory} = await import("../../layout/storybook/dom/layout-dom-story.ts")
    return createLayoutDomStory(document, route as LayoutDomRoute)
  }
  if (route === "worker" || route.startsWith("worker/")) {
    const {createWorkerDomStory} = await import("../../worker/storybook/dom/worker-dom-story.ts")
    return createWorkerDomStory(document, route as WorkerDomRoute)
  }
  switch (route) {
    case "":
    case "core":
    case "core/node-tree":
    case "core/node-tree/live":
    case "editor":
    case "editor/node-tree":
    case "editor/node-tree/live":
      return createNodeTreeEditorStory(document, (route === "" ? "core" : route) as NodeTreeEditorRoute)
  }
  throw new Error(`Nodes DOM story route has no implementation: ${String(route)}`)
}

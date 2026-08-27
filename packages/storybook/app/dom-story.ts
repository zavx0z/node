import type {Document} from "@zavx0z/dom"
import {
  createGraphStory,
  type GraphStory,
} from "../../ui/storybook/dom/graph-story.ts"
import {
  createMultiNodeStory,
  type MultiNodeStory,
} from "../../ui/storybook/dom/multi-node-story.ts"
import type {ParameterSocketStory} from "../../ui/storybook/dom/parameter-socket-story.ts"
import type {ParameterSocketDomRoute} from "../../ui/storybook/dom/parameter-socket-route-story.ts"
import {
  REMAINING_DOM_ROUTES,
  type RemainingDomRoute,
} from "../../ui/storybook/dom/remaining-route-catalog.ts"
import type {RemainingDomStory} from "../../ui/storybook/dom/remaining-dom-story.ts"
import {
  createSingleNodeStory,
  type SingleNodeStory,
} from "../../ui/storybook/dom/single-node-story.ts"
import {
  createNodeTreeEditorStory,
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

export type NodesDomRouteStory = SingleNodeStory | MultiNodeStory | GraphStory |
  ParameterSocketStory | NodeTreeEditorStory | LayoutDomStory | WorkerDomStory |
  RemainingDomStory

export async function createNodesDomRouteStory(
  document: Document,
  route: string,
): Promise<NodesDomRouteStory> {
  if ((REMAINING_DOM_ROUTES as readonly string[]).includes(route)) {
    const {createRemainingDomStory} = await import("../../ui/storybook/dom/remaining-dom-story.ts")
    return createRemainingDomStory(document, route as RemainingDomRoute)
  }
  if (route === "layout" || route.startsWith("layout/")) {
    const {createLayoutDomStory} = await import("../../layout/storybook/dom/layout-dom-story.ts")
    return createLayoutDomStory(document, route as LayoutDomRoute)
  }
  if (route === "worker" || route.startsWith("worker/")) {
    const {createWorkerDomStory} = await import("../../worker/storybook/dom/worker-dom-story.ts")
    return createWorkerDomStory(document, route as WorkerDomRoute)
  }
  if (route === "ui/parameter" || route.startsWith("ui/parameter/") ||
    route === "ui/socket" || route.startsWith("ui/socket/")) {
    const {createParameterSocketRouteStory} = await import("../../ui/storybook/dom/parameter-socket-route-story.ts")
    return createParameterSocketRouteStory(document, route as ParameterSocketDomRoute)
  }
  switch (route) {
    case "core":
    case "core/node-tree":
    case "core/node-tree/live":
    case "editor":
    case "editor/node-tree":
    case "editor/node-tree/live":
      return createNodeTreeEditorStory(document, route)
    case "ui/node-editor/scene/default": return createSingleNodeStory(document)
    case "ui/node-editor/scene/selected": return createMultiNodeStory(document)
    case "ui/link/orthogonal/selected": return createGraphStory(document)
  }
  throw new Error(`Nodes DOM story route has no implementation: ${String(route)}`)
}

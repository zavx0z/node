import {describe, expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {NODE_SOCKET_KINDS} from "../../ui/storybook/socket-catalog.ts"
import {
  NODES_STORIES,
  NODES_STORY_ROUTE_TREE,
  nodesDockTitle,
  nodesPrimaryItems,
  nodesPrimarySelection,
  nodesScenarioRoute,
  nodesSecondaryItems,
  nodesSecondaryRoute,
  nodesSecondarySelection,
  nodesStoryDescriptor,
  nodesStoryPresentationRoute,
  nodesVariantItems,
} from "./dom-catalog.ts"
import {createNodesDomRouteStory} from "./dom-story.ts"

describe("one-root final DOM Nodes Storybook catalog", () => {
  test("keeps exact owner/secondary/variant navigation without loaders", async () => {
    expect(nodesPrimaryItems().map(({id, label}) => ({id, label}))).toEqual([
      {id: "core", label: "NodeTree"},
      {id: "editor", label: "NodeTreeEditor"},
      {id: "layout", label: "Раскладка"},
      {id: "worker", label: "Worker"},
      {id: "node-editor", label: "Редактор нод"},
      {id: "parameter", label: "Параметры"},
      {id: "socket", label: "Сокеты"},
      {id: "frame", label: "Frame"},
      {id: "link", label: "Link"},
      {id: "comparison", label: "Сравнение"},
    ])
    expect(nodesSecondaryItems("layout").map(({label}) => label)).toEqual([
      "Фиксированная", "Адаптивная", "Dagre Layered", "Coffman–Graham",
    ])
    expect(nodesVariantItems("layout/adaptive/shared/right").map(({label}) => label)).toEqual([
      "Общий порт · RIGHT", "Общий порт · DOWN", "Контейнеры · RIGHT", "Контейнеры · DOWN",
    ])
    expect(nodesSecondaryItems("ui/socket").map(({id}) => id)).toEqual([...NODE_SOCKET_KINDS])
    expect(nodesSecondaryRoute("ui/socket")).toBe("ui/socket")
    expect(nodesVariantItems("ui/socket")).toEqual([])
    expect(nodesDockTitle("ui/socket")).toBe("Направление")
    expect(nodesVariantItems("ui/socket/boolean").map(({label}) => label)).toEqual([
      "Вход", "Выход", "Двунаправленный",
    ])
    const overview = await createNodesDomRouteStory(createDocument(), "ui/socket")
    expect(overview.element.className).toBe("nodes-production-story nodes-production-story--socket")
    expect(overview.element.querySelector(".node-socket")?.getAttribute("data-socket-kind")).toBe("float")
    expect(overview.source().typescript).toContain('from "@nodes/ui/socket"')
    overview.dispose()
  })

  test("owns one 225-node route tree and a DOM factory for every node", async () => {
    expect(NODES_STORIES).toHaveLength(159)
    expect(NODES_STORY_ROUTE_TREE.nodes).toHaveLength(225)
    expect(NODES_STORY_ROUTE_TREE.find("")).toMatchObject({kind: "overview", path: ""})
    expect(nodesStoryPresentationRoute("")).toBe("")
    expect(nodesStoryDescriptor("")).toMatchObject({
      kind: "overview",
      route: "",
      title: "NodeTree · Обзор",
      primary: {id: "core"},
    })
    for (const node of NODES_STORY_ROUTE_TREE.nodes) {
      expect(nodesStoryDescriptor(node.path).route, node.path).toBe(node.path)
      const primary = nodesPrimarySelection(node.path)
      if (primary !== null) {
        expect(nodesPrimaryItems().some(({route}) => route === primary), node.path).toBeTrue()
      }
      const secondary = nodesSecondarySelection(node.path)
      if (secondary !== null) {
        expect(nodesSecondaryItems(node.path).some(({route}) => route === secondary), node.path).toBeTrue()
      }
      const scenario = nodesScenarioRoute(node.path)
      if (scenario !== null) {
        expect(nodesVariantItems(node.path).some(({route}) => route === scenario), node.path).toBeTrue()
      }
    }
    expect(NODES_STORY_ROUTE_TREE.find("unknown")).toBeUndefined()
  })

  test("preserves exact Link and Comparison metadata", () => {
    expect(nodesStoryDescriptor("ui/node-editor/scene/compiled-general")).toMatchObject({
      title: "Редактор нод · Compiled general system",
      apiName: "NodeEditor",
      primary: {id: "node-editor"},
      secondary: {id: "scene"},
      variant: {id: "compiled-general"},
    })
    expect(nodesStoryDescriptor("ui/link/orthogonal/selected")).toMatchObject({
      title: "Link · Ортогональный",
      apiName: "LinkView",
      secondary: {label: "Ортогональный Link"},
    })
    expect(nodesStoryDescriptor("ui/comparison/reference/default")).toMatchObject({
      title: "Сравнение с эталоном",
      apiName: "NodeEditor",
      primary: {label: "Сравнение"},
      secondary: {label: "Принятый эталон"},
      variant: {label: "Референс"},
    })
  })
})

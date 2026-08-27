import {describe, expect, test} from "bun:test"
import {NODE_SOCKET_KINDS} from "../../ui/storybook/socket-catalog.ts"
import {
  NODES_STORY_ROUTE_TREE,
  loadNodesStory,
  nodesDockTitle,
  nodesPrimaryItems,
  nodesSecondaryItems,
  nodesSecondaryRoute,
  nodesStoryDescriptor,
  nodesStoryPresentationRoute,
  nodesVariantItems,
} from "./stories.ts"

describe("one-root Nodes Storybook information architecture", () => {
  test("uses primary, secondary and dock panels instead of nested fake catalogs", async () => {
    expect(nodesPrimaryItems().map(({id, label, group}) => ({id, label, group}))).toEqual([
      {id: "core", label: "NodeTree", group: undefined},
      {id: "editor", label: "NodeTreeEditor", group: undefined},
      {id: "layout", label: "Раскладка", group: undefined},
      {id: "worker", label: "Worker", group: undefined},
      {id: "node-editor", label: "Редактор нод", group: undefined},
      {id: "parameter", label: "Параметры", group: undefined},
      {id: "socket", label: "Сокеты", group: undefined},
      {id: "frame", label: "Frame", group: undefined},
      {id: "link", label: "Link", group: undefined},
      {id: "comparison", label: "Сравнение", group: undefined},
    ])

    const layout = nodesStoryPresentationRoute("layout")
    expect(layout).toBe("layout")
    expect(nodesSecondaryItems(layout).map(({label}) => label)).toEqual([
      "Фиксированная",
      "Адаптивная",
      "Dagre Layered",
      "Coffman–Graham",
    ])
    expect(nodesVariantItems(layout)).toEqual([])
    const layoutSource = (await loadNodesStory(layout)).source({})
    expect(layoutSource.html).toContain('class="nodes-overview"')
    expect(layoutSource.css).toContain(".nodes-overview__items")
    expect(layoutSource.typescript).toContain('route: "layout/fixed"')
    expect(nodesVariantItems("layout/adaptive/shared/right").map(({label}) => label)).toEqual([
      "Общий порт · RIGHT",
      "Общий порт · DOWN",
      "Контейнеры · RIGHT",
      "Контейнеры · DOWN",
    ])

    const sockets = nodesStoryPresentationRoute("ui/socket")
    expect(sockets).toBe("ui/socket")
    expect(nodesSecondaryItems(sockets).map(({id}) => id)).toEqual([...NODE_SOCKET_KINDS])
    expect(nodesSecondaryRoute(sockets)).toBe("ui/socket")
    expect(nodesVariantItems(sockets)).toEqual([])
    expect(nodesDockTitle(sockets)).toBe("Направление")
    const socketOverview = await loadNodesStory(sockets)
    expect(socketOverview.source({}).typescript).toContain("for (const kind of SOCKET_KINDS)")

    const boolean = nodesStoryPresentationRoute("ui/socket/boolean")
    expect(boolean).toBe("ui/socket/boolean")
    expect(nodesSecondaryRoute(boolean)).toBe("ui/socket/boolean")
    expect(nodesVariantItems(boolean).map(({label}) => label)).toEqual([
      "Вход",
      "Выход",
      "Двунаправленный",
    ])
    expect((await loadNodesStory(boolean)).source({}).typescript).toContain('const kind = "boolean" as const')
    expect(nodesStoryDescriptor("ui/socket/boolean/input").kind).toBe("detail")
  })

  test("keeps one prefixed route tree without a separate landing page", () => {
    expect(NODES_STORY_ROUTE_TREE.find("")).toMatchObject({kind: "overview", path: ""})
    expect(nodesStoryPresentationRoute("")).toBe("")
    expect(NODES_STORY_ROUTE_TREE.find("layout")).toMatchObject({kind: "overview"})
    expect(nodesStoryDescriptor("layout")).toMatchObject({kind: "overview", route: "layout"})
    expect(NODES_STORY_ROUTE_TREE.find("ui/socket/boolean/input")).toMatchObject({kind: "leaf"})
    for (const node of NODES_STORY_ROUTE_TREE.nodes) {
      expect(nodesStoryDescriptor(node.path).route, node.path).toBe(node.path)
    }
    expect(NODES_STORY_ROUTE_TREE.find("unknown")).toBeUndefined()
  })
})

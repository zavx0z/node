import {describe, expect, test} from "bun:test"
import {createStorybookPage} from "@zavx0z/storybook/server"
import {
  NODES_STORIES,
  NODES_STORY_ROUTE_TREE,
} from "../app/dom-catalog.ts"
import {createNodesStorybookApp} from "./page-registry.ts"

describe("root Nodes Storybook page", () => {
  test("owns one canvas Workbench for every prefixed package story", () => {
    const app = createNodesStorybookApp()
    expect(app.pages).toHaveLength(1)
    expect(app.pages[0]).toMatchObject({
      id: "workbench",
      mountPath: "/",
      body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
      capability: "webgpu",
      readiness: {dataset: "nodesStorybook", value: "ready"},
    })
    expect(app.pages[0]?.entrypoint.endsWith("/app/dom-entry.ts")).toBeTrue()
    expect(app.pages[0]?.routeTree).toBe(NODES_STORY_ROUTE_TREE)
    expect(new Set(NODES_STORIES.map(({route}) => route.split("/")[0]))).toEqual(new Set([
      "core",
      "editor",
      "layout",
      "worker",
      "ui",
    ]))
    for (const path of ["", "core", "layout", "layout/fixed", "ui/socket", "ui/socket/boolean"]) {
      expect(NODES_STORY_ROUTE_TREE.find(path), path).toMatchObject({kind: "overview"})
    }
    expect(NODES_STORY_ROUTE_TREE.nodes).toHaveLength(224)
  })

  test("renders the same Workbench shell at root, overview and exact leaf routes", async () => {
    const app = createNodesStorybookApp({publicBasePath: "/node"})
    const page = createStorybookPage(app, app.pages[0]!)
    for (const path of [
      "/node/",
      "/node/core/",
      "/node/layout/fixed/",
      "/node/ui/socket/boolean/input",
    ]) {
      const response = await page.routeResponse(path)
      expect(response?.status, path).toBe(200)
      const html = await response?.text()
      expect(html, path).toContain('<canvas id="nodes-storybook-canvas"></canvas>')
      expect(html, path).toContain('/node/@storybook-assets/workbench/entry.js')
      expect(html, path).not.toContain("nodes-package-catalog")
      expect(html, path).not.toContain("data-storybook-home")
    }
    expect((await page.routeResponse("/node/unknown"))?.status).toBe(404)
  })
})

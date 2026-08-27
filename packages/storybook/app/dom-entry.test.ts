import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {createDocument} from "@zavx0z/dom"
import {NODES_STORY_ROUTE_TREE} from "./dom-catalog.ts"
import {nodesDomStoryCss} from "./dom-css.ts"
import {createNodesDomRouteStory} from "./dom-story.ts"

describe("final all-DOM Nodes Storybook entry", () => {
  test("dispatches every one of 224 registered nodes to a real DOM story", async () => {
    expect(NODES_STORY_ROUTE_TREE.nodes).toHaveLength(224)
    for (const {path} of NODES_STORY_ROUTE_TREE.nodes) {
      const story = await createNodesDomRouteStory(createDocument(), path)
      expect(story.element.localName, path || "root").toMatch(/^(section|article)$/)
      expect(story.source().html.length, path || "root").toBeGreaterThan(20)
      expect(story.source().css.length, path || "root").toBeGreaterThan(20)
      expect(story.source().typescript.length, path || "root").toBeGreaterThan(20)
      story.dispose()
    }
  })

  test("uses one direct entry, one router and live in-place route changes", async () => {
    const entry = await Bun.file(new URL("./dom-entry.ts", import.meta.url)).text()
    const registry = await Bun.file(new URL("../server/page-registry.ts", import.meta.url)).text()
    expect(registry).toContain('entrypoint: join(import.meta.dir, "../app/dom-entry.ts")')
    expect(registry).toContain('from "../app/dom-catalog.ts"')
    expect(entry).toContain("createDocumentCanvasRuntime({")
    expect(entry).toContain("createStorybookDomWorkbench({")
    expect(entry).toContain("router.go(targetRoute)")
    expect(entry).toContain("router.subscribe")
    expect(entry).toContain("applyRoute(node.path)")
    expect(entry).toContain('workbench.update("preview.node", story.element)')
    expect(entry).toContain("previous.dispose()")
    expect(entry).not.toContain("window.location.assign")
    expect(entry).not.toContain("isNodesDomStoryRoute")
    expect(entry).not.toContain("unmigrated route")
    expect(entry).not.toContain("./stories.ts")
    expect(entry).not.toContain("./entry.ts")
  })

  test("ships one standard-DOM CSS set with no retained owner source", async () => {
    for (const selector of [
      ".single-node-canvas",
      ".multi-node-canvas",
      ".graph-canvas",
      ".parameter-socket",
      ".node-tree-dom",
      ".node-workbench",
      ".layout-dom",
      ".worker-dom",
    ]) expect(nodesDomStoryCss).toContain(selector)
    const files = ["dom-entry.ts", "dom-story.ts", "dom-catalog.ts", "dom-css.ts"]
    for (const file of files) {
      const source = await Bun.file(new URL(`./${file}`, import.meta.url)).text()
      for (const forbidden of [
        "@layout/core",
        "@ui/components",
        "@ui/elements",
        "@zavx0z/highlighter",
        "UiRuntime",
        "StorybookNavigationSurface",
        "NodesStoryPreviewSurface",
        "parameterRenderer.render",
        "socketRenderer.render",
      ]) expect(source, file).not.toContain(forbidden)
    }
  })

  test("removes hybrid files and retained direct dependencies", async () => {
    const root = join(import.meta.dir, "..")
    for (const path of [
      "app/bootstrap.ts",
      "app/entry.ts",
      "app/overview.ts",
      "app/preview.ts",
      "app/stories.ts",
      "app/dom-routes.ts",
    ]) expect(await Bun.file(join(root, path)).exists(), path).toBeFalse()
    const manifest = await Bun.file(join(root, "package.json")).json() as {dependencies: Record<string, string>}
    for (const dependency of [
      "@layout/core", "@nodes/core", "@nodes/editor", "@ui/components", "@ui/elements", "@zavx0z/highlighter",
    ]) expect(manifest.dependencies[dependency], dependency).toBeUndefined()
    expect(manifest.dependencies).toMatchObject({
      "@engine/core": "link:@engine/core",
      "@nodes/layout": "workspace:*",
      "@nodes/worker": "workspace:*",
      "@nodes/ui": "workspace:*",
      "@zavx0z/dom": "link:@zavx0z/dom",
      "@zavx0z/renderer-browser": "link:@zavx0z/renderer-browser",
      "@zavx0z/storybook": "link:@zavx0z/storybook",
    })
  })

  test("fails closed for an unknown factory route", async () => {
    await expect(createNodesDomRouteStory(createDocument(), "unknown"))
      .rejects.toThrow("Nodes DOM story route has no implementation: unknown")
  })
})

import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {fileURLToPath} from "node:url"

const storybookRoot = fileURLToPath(new URL(".", import.meta.url))

describe("central Nodes storybook scaffold", () => {
  test("is one private dev-only workspace that composes every package", async () => {
    const manifest = await Bun.file(join(storybookRoot, "package.json")).json() as {
      name?: string
      private?: boolean
      scripts?: Record<string, string>
      dependencies?: Record<string, string>
      exports?: Record<string, unknown>
    }

    expect(manifest.name).toBe("@nodes/storybook")
    expect(manifest.private).toBeTrue()
    expect(manifest.scripts).toEqual({
      storybook: "bun server.ts",
      build: "bun build.ts",
      test: "bun test .",
      typecheck: "tsc --noEmit --pretty false",
      check: "bun run typecheck && bun run test && bun run build",
    })
    expect(manifest.dependencies).toEqual({
      "@engine/core": "link:@engine/core",
      "@layout/core": "link:@layout/core",
      "@nodes/core": "workspace:*",
      "@nodes/editor": "workspace:*",
      "@nodes/layout": "workspace:*",
      "@nodes/worker": "workspace:*",
      "@nodes/ui": "workspace:*",
      "@ui/components": "link:@ui/components",
      "@ui/elements": "link:@ui/elements",
      "@zavx0z/highlighter": "link:@zavx0z/highlighter",
      "@zavx0z/storybook": "link:@zavx0z/storybook",
    })
    expect(manifest.exports).toBeUndefined()
  })

  test("delegates one root Workbench page to the shared no-HMR server", async () => {
    const server = await Bun.file(join(storybookRoot, "server.ts")).text()
    const registry = await Bun.file(join(storybookRoot, "server/page-registry.ts")).text()
    const entry = await Bun.file(join(storybookRoot, "app/entry.ts")).text()
    const stories = await Bun.file(join(storybookRoot, "app/stories.ts")).text()

    expect(server).toContain('from "@zavx0z/storybook/server"')
    expect(server).toContain("startStorybookPackageServer({")
    expect(server).toContain("app: createNodesStorybookApp()")
    expect(server).not.toContain("port:")
    expect(server).not.toMatch(/NODES_STORYBOOK_(?:HOST|PORT)/u)
    expect(server).not.toContain("Bun.serve")
    expect(server).not.toContain("hmr: true")
    expect(registry).toContain('mountPath: "/"')
    expect(registry).toContain('canvasId: "nodes-storybook-canvas"')
    expect(registry).toContain('id: "workbench"')
    expect(registry).toContain("pages: [{")
    expect(entry.match(/UiRuntime\.create\(/g)).toHaveLength(1)
    expect(entry).toContain("StorybookNavigationSurface")
    expect(entry).toContain("NodesStoryPreviewSurface")
    expect(entry).toContain('let panelCategory: StorybookStoryPanelCategory = "source"')
    expect(entry).toContain("onCategoryChange(category)")
    expect(entry).toContain("onCopy(kind, source)")
    expect(entry).toContain("dataset.nodesStorybookHtml = source.html")
    expect(entry).toContain("dataset.nodesStorybookCss = source.css")
    expect(entry).toContain("dataset.nodesStorybookTypescript = source.typescript")
    expect(stories).toContain('route: "core/node-tree/live"')
    expect(stories).toContain('route: "editor/node-tree/live"')
    expect(stories).toContain('route: `layout/${item.route}`')
    expect(stories).toContain('route: `ui/${item.route}`')
  })

  test("keeps editor integration isolated in its clearly named package module", async () => {
    const entry = await Bun.file(join(
      storybookRoot,
      "../editor/storybook/editor-story.ts",
    )).text()

    expect(entry).toContain('from "@nodes/core/node-tree"')
    expect(entry).toContain('from "@nodes/core/parameter"')
    expect(entry).toContain('from "@nodes/editor"')
    expect(entry).toContain('from "@nodes/ui/projection"')
    expect(entry).toContain("tree.project(projector")
    expect(entry).toContain("editor.setProjection(projection)")
    expect(entry).toContain("new NodeTreeEditor(tree)")
    expect(entry).toContain("new NodeTreeEditorDockSurface(this.#dockOptions())")
    expect(entry).toContain("author.addParameter({")
    expect(entry).toContain("author.connect({")
    expect(entry).toContain("author.markLayoutApplied(projection)")
    expect(entry).toContain("createNodeTreeEditorStoryModule")
    expect(entry).toContain('slot: "preview"')
    expect(entry).toContain('slot: "dock"')
    expect(entry).not.toContain("gain.set(value)")
    expect(entry).not.toContain("NodeFieldValueState")
    expect(entry).not.toContain("bindNodeFieldValueState")
    expect(entry).not.toContain("positionNode")
  })

  test("removes package-local storybook servers after centralization", async () => {
    for (const path of [
      "../layout/storybook/server.ts",
      "../layout/storybook/tsconfig.json",
      "../ui/storybook/server.ts",
      "../ui/storybook/tsconfig.json",
    ]) expect(await Bun.file(join(storybookRoot, path)).exists(), path).toBeFalse()
  })
})

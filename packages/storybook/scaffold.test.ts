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
      "@ui/storybook": "link:@ui/storybook",
    })
    expect(manifest.exports).toBeUndefined()
  })

  test("delegates one no-HMR origin and six independent pages to the shared hub server", async () => {
    const server = await Bun.file(join(storybookRoot, "server.ts")).text()
    const registry = await Bun.file(join(storybookRoot, "server/page-registry.ts")).text()
    const catalog = await Bun.file(join(storybookRoot, "catalog/package-catalog.ts")).text()

    expect(server).toContain('from "@ui/storybook/server"')
    expect(server).toContain("startStorybookHubServer({")
    expect(server).toContain("createNodesStorybookPages()")
    expect(server).toContain("Bun.env.NODES_STORYBOOK_HOST")
    expect(server).toContain("Bun.env.NODES_STORYBOOK_PORT ?? 4018")
    expect(server).not.toContain("Bun.serve")
    expect(server).not.toContain("hmr: true")
    expect(registry).toContain('mountPath: "/"')
    expect(registry).toContain('canvasId: "nodes-storybook-canvas"')
    for (const id of ["core", "editor", "layout", "worker", "ui"]) {
      expect(catalog).toContain(`id: ${JSON.stringify(id)}`)
      expect(registry).toContain(id === "worker" ? '"worker":' : `${id}:`)
    }
  })

  test("keeps editor integration isolated in its clearly named package module", async () => {
    const entry = await Bun.file(join(
      storybookRoot,
      "pages/editor/live-node-tree.stories.ts",
    )).text()

    expect(entry).toContain('from "@nodes/core/node-tree"')
    expect(entry).toContain('from "@nodes/core/parameter"')
    expect(entry).toContain('from "@nodes/editor"')
    expect(entry).toContain('from "@nodes/ui/projection"')
    expect(entry).toContain("tree.project(projector")
    expect(entry).toContain("editor.setProjection(projection)")
    expect(entry).toContain("new NodeTreeEditor(tree)")
    expect(entry).toContain("new NodeTreeEditorDockSurface(dockOptions())")
    expect(entry).toContain("author.addParameter({")
    expect(entry).toContain("author.connect({")
    expect(entry).toContain("author.markLayoutApplied(projection)")
    expect(entry).toContain('event.key === "F6"')
    expect(entry).toContain('event.key === "F7"')
    expect(entry).toContain('event.key === "F8"')
    expect(entry).toContain('event.key === "F9"')
    expect(entry).toContain("nodeTreeMaterializations")
    expect(entry).toContain("return applyProjection()")
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

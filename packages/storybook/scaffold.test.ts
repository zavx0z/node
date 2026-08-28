import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {fileURLToPath} from "node:url"

const storybookRoot = fileURLToPath(new URL(".", import.meta.url))

describe("final standard-DOM Nodes Storybook scaffold", () => {
  test("declares only final document-pipeline owners", async () => {
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
      "@nodes/core": "workspace:*",
      "@nodes/editor": "workspace:*",
      "@nodes/layout": "workspace:*",
      "@nodes/worker": "workspace:*",
      "@nodes/ui": "workspace:*",
      "@zavx0z/dom": "link:@zavx0z/dom",
      "@zavx0z/renderer": "link:@zavx0z/renderer",
      "@zavx0z/renderer-browser": "link:@zavx0z/renderer-browser",
      "@zavx0z/renderer-webgpu": "link:@zavx0z/renderer-webgpu",
      "@zavx0z/react": "link:@zavx0z/react",
      "@zavx0z/storybook": "link:@zavx0z/storybook",
      "@zavx0z/template": "link:@zavx0z/template",
    })
    expect(manifest.exports).toBeUndefined()
  })

  test("mounts one final DOM entry and no hybrid or retained app", async () => {
    const server = await Bun.file(join(storybookRoot, "server.ts")).text()
    const registry = await Bun.file(join(storybookRoot, "server/page-registry.ts")).text()
    const entry = await Bun.file(join(storybookRoot, "app/dom-entry.ts")).text()
    const catalog = await Bun.file(join(storybookRoot, "app/dom-catalog.ts")).text()
    expect(server).toContain('from "@zavx0z/storybook/server"')
    expect(server).toContain("startStorybookPackageServer({")
    expect(server).not.toContain("Bun.serve")
    expect(registry).toContain('entrypoint: join(import.meta.dir, "../app/dom-entry.ts")')
    expect(registry).toContain('from "../app/dom-catalog.ts"')
    expect(registry).toContain("createTemplateJsxBunPlugin({")
    expect(entry).toContain("createDocumentCanvasRuntime({")
    expect(entry).toContain("createStorybookDomWorkbench({")
    expect(entry).toContain("router.go(targetRoute)")
    expect(entry).toContain("router.subscribe")
    expect(entry).toContain('styleSheets: [storybookDomWorkbenchCss, nodesDomStoryCss]')
    expect(catalog).not.toContain("loadNodesStory")
    expect(catalog).not.toMatch(/import\([^)]*stories\//u)
    for (const path of ["app/bootstrap.ts", "app/entry.ts", "app/overview.ts", "app/preview.ts", "app/stories.ts", "app/dom-routes.ts"]) {
      expect(await Bun.file(join(storybookRoot, path)).exists(), path).toBeFalse()
    }
  })

  test("keeps app source free of retired owners while consuming production Field through Nodes UI", async () => {
    const sources = await Promise.all([
      "app/dom-entry.ts", "app/dom-story.ts", "app/dom-catalog.ts", "app/dom-css.ts",
      "app/production-node-story.ts",
    ].map((path) => Bun.file(join(storybookRoot, path)).text()))
    for (const source of sources) for (const forbidden of [
      "@layout/core",
      "@ui/elements",
      "@zavx0z/highlighter",
      "UiRuntime",
      "StorybookNavigationSurface",
      "NodesStoryPreviewSurface",
      "parameterRenderer.render",
      "socketRenderer.render",
    ]) expect(source).not.toContain(forbidden)
    const combined = sources.join("\n")
    expect(combined).toContain('from "@nodes/ui/parameter"')
    expect(combined).toContain("parameterCss")
  })
})

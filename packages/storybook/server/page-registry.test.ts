import {describe, expect, test} from "bun:test"
import {NODES_PACKAGE_CATALOG} from "../catalog/package-catalog.ts"
import {
  nodesPackageOverviewRoute,
  nodesPackageRouteTree,
} from "../catalog/package-route-manifest.ts"
import {
  createNodesStorybookPages,
  nodesStorybookPageFiles,
} from "./page-registry.ts"

describe("central Nodes storybook page registry", () => {
  test("mounts catalog and every package as separate named browser entry", async () => {
    const pages = createNodesStorybookPages()
    expect(pages.map(({id}) => id)).toEqual([
      "catalog",
      "core",
      "editor",
      "layout",
      "worker",
      "ui",
    ])
    expect(pages.map(({mountPath}) => mountPath)).toEqual([
      "/",
      ...NODES_PACKAGE_CATALOG.map(({routePrefix}) => routePrefix),
    ])
    for (const page of pages) {
      const files = nodesStorybookPageFiles(page.id as Parameters<typeof nodesStorybookPageFiles>[0])
      expect(await Bun.file(files.entrypoint).exists(), `${page.id} entry`).toBeTrue()
      expect(await Bun.file(files.stylePath).exists(), `${page.id} style`).toBeTrue()
      if (files.body.kind === "html") {
        expect(await Bun.file(files.body.bodyHtmlPath).exists(), `${page.id} body`).toBeTrue()
      }
    }
    for (const entry of NODES_PACKAGE_CATALOG) {
      const tree = nodesPackageRouteTree(entry.id)
      expect(tree.find("")?.kind, entry.id).toBe("overview")
      expect(pageById(pages, entry.id).routeTree, entry.id).toBe(tree)
      expect(nodesPackageOverviewRoute(entry.id), entry.id).toBe(entry.defaultRoute)
    }
  })

  test("keeps DOM/SVG pages canvas-free and both visual pages on one selector", () => {
    for (const id of ["catalog", "core", "layout", "worker"] as const) {
      expect(nodesStorybookPageFiles(id).body.kind, id).toBe("html")
    }
    for (const id of ["editor", "ui"] as const) {
      expect(nodesStorybookPageFiles(id).body).toEqual({kind: "canvas", canvasId: "nodes-storybook-canvas"})
    }
  })

  test("serves only registered overview and leaf nodes inside each package mount", async () => {
    const pages = createNodesStorybookPages()
    for (const entry of NODES_PACKAGE_CATALOG) {
      const page = pageById(pages, entry.id)
      const overview = await page.routeResponse(entry.defaultRoute)
      expect(overview?.status, entry.defaultRoute).toBe(200)
      expect(await overview?.text(), entry.defaultRoute).toContain('data-storybook-home href="/"')
      const leaf = nodesPackageRouteTree(entry.id).leaves[0]
      expect(leaf, entry.id).toBeDefined()
      const leafResponse = await page.routeResponse(`${entry.routePrefix}/${leaf}`)
      expect(leafResponse?.status, `${entry.id} leaf`).toBe(200)
      const missing = await page.routeResponse(`${entry.routePrefix}/missing`)
      expect(missing?.status, `${entry.id} missing`).toBe(404)
    }
  })

  test("renders project-base-safe static shells with Nodes branding", async () => {
    const pages = createNodesStorybookPages({publicBasePath: "/node"})
    const catalog = await pageByIdWithCatalog(pages, "catalog").htmlResponse().then((response) => response.text())
    const editor = await pageById(pages, "editor").htmlResponse().then((response) => response.text())
    expect(catalog).toContain('<base href="/node/">')
    expect(editor).toContain('<base href="/node/editor/">')
    for (const html of [catalog, editor]) {
      expect(html).toContain('<span>Nodes</span>')
      expect(html).toContain('<meta name="engine-default-font" content="/node/fonts/jetbrains-mono-bold.ttf">')
      expect(html).toContain('href="https://github.com/zavx0z/metafor">Built for MetaFor</a>')
      expect(html).toContain("node systems for agents, complex systems &amp; immersive WebGPU")
      expect(html).not.toContain("<span>Visual UI</span>")
    }
  })
})

function pageByIdWithCatalog(
  pages: ReturnType<typeof createNodesStorybookPages>,
  id: "catalog",
) {
  const page = pages.find((candidate) => candidate.id === id)
  if (page === undefined) throw new Error(`Missing Nodes storybook page: ${id}`)
  return page
}

function pageById(
  pages: ReturnType<typeof createNodesStorybookPages>,
  id: (typeof NODES_PACKAGE_CATALOG)[number]["id"],
) {
  const page = pages.find((candidate) => candidate.id === id)
  if (page === undefined) throw new Error(`Missing Nodes storybook page: ${id}`)
  return page
}

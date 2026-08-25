import {join} from "node:path"
import {createStorybookPage, type StorybookPage} from "@ui/storybook/server"
import {
  NODES_PACKAGE_CATALOG,
  nodesPackageCatalogEntry,
  type NodesPackageStorybookId,
} from "../catalog/package-catalog.ts"
import {nodesPackageRouteTree} from "../catalog/package-route-manifest.ts"

export type NodesStorybookPageId = "catalog" | NodesPackageStorybookId

export type NodesStorybookPagesOptions = Readonly<{
  publicBasePath?: string
}>

type PageFiles = Readonly<{
  entrypoint: string
  stylePath: string
  body: Readonly<{kind: "canvas"; canvasId: string}> | Readonly<{kind: "html"; bodyHtmlPath: string}>
  deepRoutes?: boolean
}>

const storybookRoot = join(import.meta.dir, "..")

const PAGE_FILES: Readonly<Record<NodesStorybookPageId, PageFiles>> = Object.freeze({
  catalog: pageFiles({
    entrypoint: join(storybookRoot, "catalog/catalog.stories.ts"),
    stylePath: join(storybookRoot, "catalog/catalog-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(storybookRoot, "catalog/catalog-storybook-body.html")},
    deepRoutes: false,
  }),
  core: pageFiles({
    entrypoint: join(storybookRoot, "pages/core/live-node-tree.stories.ts"),
    stylePath: join(storybookRoot, "pages/core/core-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(storybookRoot, "pages/core/core-storybook-body.html")},
  }),
  editor: pageFiles({
    entrypoint: join(storybookRoot, "pages/editor/live-node-tree.stories.ts"),
    stylePath: join(storybookRoot, "pages/editor/editor-storybook.css"),
    body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
  }),
  layout: pageFiles({
    entrypoint: join(storybookRoot, "pages/layout/fixed-adaptive.stories.ts"),
    stylePath: join(storybookRoot, "pages/layout/layout-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(storybookRoot, "pages/layout/layout-storybook-body.html")},
  }),
  "worker": pageFiles({
    entrypoint: join(storybookRoot, "pages/worker/protocol.stories.ts"),
    stylePath: join(storybookRoot, "pages/worker/worker-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(storybookRoot, "pages/worker/worker-storybook-body.html")},
  }),
  ui: pageFiles({
    entrypoint: join(storybookRoot, "pages/ui/node-editor.stories.ts"),
    stylePath: join(storybookRoot, "pages/ui/ui-storybook.css"),
    body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
  }),
})

export function createNodesStorybookPages(options: NodesStorybookPagesOptions = {}): readonly StorybookPage[] {
  const catalogFiles = PAGE_FILES.catalog
  const pages: StorybookPage[] = [createNodesStorybookPage({
    id: "catalog",
    mountPath: "/",
    packageName: "Nodes storybook",
    entrypoint: catalogFiles.entrypoint,
    stylePath: catalogFiles.stylePath,
    body: catalogFiles.body,
    deepRoutes: false,
    ...(options.publicBasePath === undefined ? {} : {publicBasePath: options.publicBasePath}),
  })]
  for (const entry of NODES_PACKAGE_CATALOG) {
    const files = PAGE_FILES[entry.id]
    pages.push(createNodesStorybookPage({
      id: entry.id,
      mountPath: entry.routePrefix,
      packageName: `Nodes storybook · ${entry.packageName}`,
      entrypoint: files.entrypoint,
      stylePath: files.stylePath,
      body: files.body,
      homePath: "/",
      routeTree: nodesPackageRouteTree(entry.id),
      ...(options.publicBasePath === undefined ? {} : {publicBasePath: options.publicBasePath}),
    }))
  }
  return Object.freeze(pages)
}

export function nodesStorybookPageDefaultRoute(id: NodesPackageStorybookId): string {
  return nodesPackageCatalogEntry(id).defaultRoute
}

export function nodesStorybookPageFiles(id: NodesStorybookPageId): PageFiles {
  return PAGE_FILES[id]
}

function pageFiles(files: PageFiles): PageFiles {
  return Object.freeze(files)
}

function createNodesStorybookPage(options: Parameters<typeof createStorybookPage>[0]): StorybookPage {
  const page = createStorybookPage(options)
  return Object.freeze({
    id: page.id,
    mountPath: page.mountPath,
    deepRoutes: page.deepRoutes,
    routeTree: page.routeTree,
    assetBasePath: page.assetBasePath,
    get diagnostics() {
      return page.diagnostics
    },
    owns(pathname: string) {
      return page.owns(pathname)
    },
    matches(pathname: string) {
      return page.matches(pathname)
    },
    async routeResponse(pathname: string) {
      return brandResponse(await page.routeResponse(pathname))
    },
    async htmlResponse() {
      return (await brandResponse(await page.htmlResponse()))!
    },
    assetResponse(pathname: string) {
      return page.assetResponse(pathname)
    },
  })
}

async function brandResponse(response: Response | null): Promise<Response | null> {
  if (response === null || !response.headers.get("content-type")?.startsWith("text/html")) return response
  const html = await response.text()
  return new Response(html
    .replace("reusable WebGPU UI", "node systems for agents, complex systems &amp; immersive WebGPU"), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
}

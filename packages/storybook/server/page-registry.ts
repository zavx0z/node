import {join} from "node:path"
import {
  defineStorybookApp,
  type StorybookAppManifest,
  type StorybookCapability,
  type StorybookPageBody,
} from "@zavx0z/storybook/app"
import {defineStorybookRouteTree} from "@zavx0z/storybook/route-tree"
import {createStorybookPage, type StorybookPage} from "@zavx0z/storybook/server"
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
  body: StorybookPageBody
}>

const storybookRoot = join(import.meta.dir, "..")
const packagesRoot = join(storybookRoot, "..")
const CATALOG_ROUTE_TREE = defineStorybookRouteTree({leaves: [] as const})

const PAGE_FILES: Readonly<Record<NodesStorybookPageId, PageFiles>> = Object.freeze({
  catalog: pageFiles({
    entrypoint: join(storybookRoot, "catalog/catalog.stories.ts"),
    stylePath: join(storybookRoot, "catalog/catalog-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(storybookRoot, "catalog/catalog-storybook-body.html")},
  }),
  core: pageFiles({
    entrypoint: join(packagesRoot, "core/storybook/live-node-tree.stories.ts"),
    stylePath: join(packagesRoot, "core/storybook/core-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(packagesRoot, "core/storybook/core-storybook-body.html")},
  }),
  editor: pageFiles({
    entrypoint: join(packagesRoot, "editor/storybook/live-node-tree.stories.ts"),
    stylePath: join(packagesRoot, "editor/storybook/editor-storybook.css"),
    body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
  }),
  layout: pageFiles({
    entrypoint: join(packagesRoot, "layout/storybook/fixed-adaptive.stories.ts"),
    stylePath: join(packagesRoot, "layout/storybook/layout-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(packagesRoot, "layout/storybook/layout-storybook-body.html")},
  }),
  worker: pageFiles({
    entrypoint: join(packagesRoot, "worker/storybook/protocol.stories.ts"),
    stylePath: join(packagesRoot, "worker/storybook/worker-storybook.css"),
    body: {kind: "html", bodyHtmlPath: join(packagesRoot, "worker/storybook/worker-storybook-body.html")},
  }),
  ui: pageFiles({
    entrypoint: join(packagesRoot, "ui/storybook/node-editor.stories.ts"),
    stylePath: join(packagesRoot, "ui/storybook/ui-storybook.css"),
    body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
  }),
})

/** Один Node-owned manifest для local server, static build и lifecycle evidence. */
export function createNodesStorybookApp(options: NodesStorybookPagesOptions = {}): StorybookAppManifest {
  const catalog = PAGE_FILES.catalog
  return defineStorybookApp({
    id: "node",
    title: "Nodes storybook",
    basePath: options.publicBasePath ?? "",
    home: {path: "/", label: "Главная", ariaLabel: "На главную Nodes Storybook"},
    footer: {
      lead: "Создано для",
      owner: {label: "MetaFor", href: "https://github.com/zavx0z/metafor"},
      detail: "системы узлов для агентов, сложных систем и иммерсивного WebGPU",
    },
    head: {meta: [{
      kind: "public-path",
      name: "engine-default-font",
      path: "/fonts/jetbrains-mono-bold.ttf",
    }]},
    pages: [{
      id: "catalog",
      title: "Nodes storybook",
      mountPath: "/",
      entrypoint: catalog.entrypoint,
      stylePath: catalog.stylePath,
      body: catalog.body,
      capability: "dom",
      readiness: {dataset: "nodesStorybook", value: "ready"},
      routeTree: CATALOG_ROUTE_TREE,
    }, ...NODES_PACKAGE_CATALOG.map((entry) => {
      const files = PAGE_FILES[entry.id]
      const capability = capabilityFor(entry.id)
      const canvasId = files.body.kind === "canvas" ? files.body.canvasId : null
      return {
        id: entry.id,
        title: `Nodes storybook · ${entry.packageName}`,
        mountPath: entry.routePrefix,
        entrypoint: files.entrypoint,
        stylePath: files.stylePath,
        body: files.body,
        capability,
        readiness: {dataset: "nodesStorybook", value: "ready"},
        ...(canvasId === null ? {} : {canvas: {id: canvasId, evidence: "non-black" as const}}),
        routeTree: nodesPackageRouteTree(entry.id),
      }
    })],
  })
}

/** Page wrappers used only by focused repository-app tests. */
export function createNodesStorybookPages(options: NodesStorybookPagesOptions = {}): readonly StorybookPage[] {
  const app = createNodesStorybookApp(options)
  return Object.freeze(app.pages.map((page) => createStorybookPage(app, page)))
}

export function nodesStorybookPageDefaultRoute(id: NodesPackageStorybookId): string {
  return nodesPackageCatalogEntry(id).defaultRoute
}

export function nodesStorybookPageFiles(id: NodesStorybookPageId): PageFiles {
  return PAGE_FILES[id]
}

function capabilityFor(id: NodesPackageStorybookId): StorybookCapability {
  if (id === "editor" || id === "ui") return "webgpu"
  if (id === "layout") return "svg"
  return "dom"
}

function pageFiles(files: PageFiles): PageFiles {
  return Object.freeze(files)
}

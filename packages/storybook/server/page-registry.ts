import {join, resolve} from "node:path"
import {
  defineStorybookApp,
  type StorybookAppManifest,
} from "@zavx0z/storybook/app"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"
import {NODES_STORY_ROUTE_TREE} from "../app/dom-catalog.ts"

export type NodesStorybookAppOptions = Readonly<{
  publicBasePath?: string
}>

/** One root Workbench containing every package-owned Nodes story. */
export function createNodesStorybookApp(options: NodesStorybookAppOptions = {}): StorybookAppManifest {
  const packagesRoot = resolve(import.meta.dir, "../..")
  return defineStorybookApp({
    id: "node",
    title: "Nodes Storybook",
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
      id: "workbench",
      title: "Nodes Storybook",
      mountPath: "/",
      entrypoint: join(import.meta.dir, "../app/dom-entry.ts"),
      browserBuild: {
        plugins: () => [createTemplateJsxBunPlugin({
          sourceRoots: [
            join(packagesRoot, "ui"),
            join(packagesRoot, "storybook"),
            resolve(packagesRoot, "../../ui/packages/components"),
          ],
        })],
      },
      stylePath: join(import.meta.dir, "../app/style.css"),
      body: {kind: "canvas", canvasId: "nodes-storybook-canvas"},
      capability: "webgpu",
      touch: true,
      readiness: {dataset: "nodesStorybook", value: "ready"},
      canvas: {id: "nodes-storybook-canvas", evidence: "non-black"},
      routeTree: NODES_STORY_ROUTE_TREE,
    }],
  })
}

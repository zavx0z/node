import {readdir} from "node:fs/promises"
import {dirname, join, resolve} from "node:path"
import {fileURLToPath} from "node:url"
import type {StorybookStaticFile} from "@zavx0z/storybook/app"
import {
  buildStaticStorybook,
  readGitIdentity,
  type StorybookDependencyIdentity,
} from "@zavx0z/storybook/build"
import {normalizeStorybookBasePath} from "@zavx0z/storybook/environment"
import {createNodesStorybookApp} from "./server/page-registry.ts"

const nodeRoot = resolve(import.meta.dir, "../..")
const outputRoot = join(nodeRoot, "dist")
const publicBasePath = normalizeStorybookBasePath(Bun.env.NODES_STORYBOOK_BASE_PATH ?? "/node")
const app = createNodesStorybookApp({publicBasePath})
const source = await readGitIdentity(nodeRoot)
const dependencies = await dependencyIdentities()
const staticFiles = Object.freeze([
  {
    publicPath: "/fonts/jetbrains-mono-bold.ttf",
    sourcePath: fileURLToPath(import.meta.resolve("@engine/core/fonts/jetbrains-mono-bold.ttf")),
  },
  ...await referenceStaticFiles(join(import.meta.dir, "assets/references")),
])

const manifest = await buildStaticStorybook({
  app,
  outputRoot,
  source,
  dependencies,
  staticFiles,
})

console.log(`[Nodes Storybook] built ${manifest.pages.length} static pages in ${outputRoot} for ${publicBasePath}/`)

async function dependencyIdentities(): Promise<readonly StorybookDependencyIdentity[]> {
  const inputs = [
    ["@engine/core", import.meta.resolve("@engine/core/default-font")],
    ["@layout/core", import.meta.resolve("@layout/core/runtime")],
    ["@ui/workspace", import.meta.resolve("@ui/elements/primitives")],
    ["@zavx0z/highlighter", import.meta.resolve("@zavx0z/highlighter")],
    ["@zavx0z/storybook", import.meta.resolve("@zavx0z/storybook/app")],
  ] as const
  return Object.freeze(await Promise.all(inputs.map(async ([name, entry]) => ({
    name,
    ...await readGitIdentity(dirname(fileURLToPath(entry))),
  }))))
}

async function referenceStaticFiles(
  root: string,
  relativePath = "",
): Promise<readonly StorybookStaticFile[]> {
  const directory = relativePath === "" ? root : join(root, ...relativePath.split("/"))
  const entries = await readdir(directory, {withFileTypes: true})
  const files: StorybookStaticFile[] = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = relativePath === "" ? entry.name : `${relativePath}/${entry.name}`
    if (entry.isDirectory()) files.push(...await referenceStaticFiles(root, path))
    else if (entry.isFile()) files.push({
      publicPath: `/references/${path}`,
      sourcePath: join(root, ...path.split("/")),
    })
    else throw new Error(`Nodes Storybook reference asset must be a regular file: ${path}`)
  }
  return Object.freeze(files)
}

import {describe, expect, test} from "bun:test"
import {readdir} from "node:fs/promises"
import {basename, join, relative} from "node:path"
import {fileURLToPath} from "node:url"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const packageNames = ["core", "editor", "layout", "worker", "ui", "storybook"] as const
const metaforLink = "https://github.com/zavx0z/metafor"

describe("standalone Nodes repository contract", () => {
  test("marks every public documentation and package surface as Built for MetaFor", async () => {
    for (const path of ["README.md", "ARCHITECTURE.md", "CONTRIBUTING.md"]) {
      const source = await Bun.file(join(repositoryRoot, path)).text()
      expect(source, path).toContain(`Built for [MetaFor](${metaforLink})`)
    }
    for (const name of packageNames) {
      const manifest = await Bun.file(join(repositoryRoot, "packages", name, "package.json")).json() as {
        description?: string
        metafor?: string
        private?: boolean
        license?: string
        repository?: {url?: string}
        homepage?: string
      }
      expect(manifest.description, name).toContain("Built for MetaFor")
      expect(manifest.metafor, name).toBe(metaforLink)
      expect(manifest.private, name).toBeTrue()
      expect(manifest.license, name).toBe("MIT")
      expect(manifest.repository?.url, name).toBe("git+https://github.com/zavx0z/node.git")
      expect(manifest.homepage, name).toMatch(/^https:\/\/zavx0z\.github\.io\/node\//)
      const readme = await Bun.file(join(repositoryRoot, "packages", name, "README.md")).text()
      expect(readme, name).toContain(`Built for [MetaFor](${metaforLink})`)
    }
    const entrypoints = [
      "packages/core/index.ts",
      "packages/editor/index.ts",
      "packages/layout/src/index.ts",
      "packages/worker/index.ts",
      "packages/ui/index.ts",
    ]
    for (const path of entrypoints) {
      expect(await Bun.file(join(repositoryRoot, path)).text(), path)
        .toContain(`Built for [MetaFor](${metaforLink})`)
    }
  })

  test("contains no compatibility package names or source-branded production API", async () => {
    const files = await sourceFiles(join(repositoryRoot, "packages"))
    const productionFiles = files.filter((path) => !path.includes("/storybook/"))
    const productionUi = await readAll(productionFiles
      .filter((path) => path.startsWith(join(repositoryRoot, "packages/ui")))
      .filter((path) => /\.tsx?$/u.test(path) && !/\.test\.tsx?$/u.test(path)))
    expect(productionUi).not.toMatch(/\b(?:Blender|blender|BLENDER)\b/)

    const production = await readAll(productionFiles.filter((path) => !path.endsWith(".test.ts")))
    expect(production).not.toMatch(/^export\s*\{[^\n]*\bas\b/m)

    const repositoryText = await readAll(files.filter((path) => !path.endsWith(".png")))
    expect(repositoryText.toLowerCase()).not.toContain(["play", "ground"].join(""))
    expect(repositoryText.toLowerCase()).not.toContain(["layout", "worker"].join("-"))
  })

  test("uses lowercase kebab-case source names with only conventional document exceptions", async () => {
    const allowed = new Set(["README.md", "ARCHITECTURE.md", "CONTRIBUTING.md", "AGENTS.md", "LICENSE", "SKILL.md"])
    for (const path of await allFiles(repositoryRoot)) {
      const name = basename(path)
      if (allowed.has(name)) continue
      expect(name, relative(repositoryRoot, path)).toMatch(/^\.?[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
    }
  })
})

async function sourceFiles(root: string): Promise<string[]> {
  return (await allFiles(root)).filter((path) => /\.(?:tsx?|json|md|html|css|toml|ya?ml|sh)$/.test(path))
}

async function allFiles(root: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(root, {withFileTypes: true})) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") continue
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...await allFiles(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

async function readAll(paths: readonly string[]): Promise<string> {
  return (await Promise.all(paths.map((path) => Bun.file(path).text()))).join("\n")
}

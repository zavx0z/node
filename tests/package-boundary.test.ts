import {describe, expect, test} from "bun:test"
import {mkdtemp, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join, relative} from "node:path"
import {fileURLToPath} from "node:url"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const packagesRoot = join(repositoryRoot, "packages")
const fixturesRoot = join(repositoryRoot, "tests/fixtures")
const coreRoot = join(packagesRoot, "core")
const workerRoot = join(packagesRoot, "worker")
const fullDomUiBundleBudget = Object.freeze({bytes: 230_000, gzipBytes: 60_000})

describe("universal node-system package boundaries", () => {
  test("keeps @nodes/core free of renderer, layout, HUD and product imports", async () => {
    const packageJson = await Bun.file(join(coreRoot, "package.json")).json() as {
      dependencies?: Record<string, string>
    }
    expect(Object.keys(packageJson.dependencies ?? {})).toEqual([])

    const files = (await sourceFiles(coreRoot))
      .filter((path) => !/\.test\.tsx?$/u.test(path))
      .filter((path) => !path.includes("/storybook/"))
      .filter((path) => !path.includes("/.storybook/"))
    const source = await readAll(files)
    expect(source).not.toMatch(/from ["']@nodes\//)
    expect(source).not.toMatch(/from ["']@ui\//)
    expect(source).not.toMatch(/from ["']@metafor\/engine/)
    expect(source).not.toContain("Hamiltonian")
  })

  test("keeps @nodes/ui on exact standard-DOM owners", async () => {
    const uiRoot = join(packagesRoot, "ui")
    const packageJson = await Bun.file(join(uiRoot, "package.json")).json() as {
      dependencies?: Record<string, string>
      exports?: Record<string, string>
    }
    const production = (await sourceFiles(uiRoot))
      .filter((path) => !/\.test\.tsx?$/u.test(path))
      .filter((path) => !path.includes("/storybook/"))
      .filter((path) => !path.includes("/.storybook/"))
    const source = await readAll(production)
    expect(packageJson.exports).toEqual({
      ".": "./index.ts",
      "./node": "./dom/node.ts",
      "./parameter": "./dom/parameter.ts",
      "./socket": "./dom/socket.ts",
      "./link": "./dom/link.ts",
      "./node-editor": "./dom/node-editor.ts",
      "./node-system": "./node-system.tsx",
      "./graph-canvas": "./dom/graph-canvas.ts",
      "./node-workbench": "./dom/node-workbench.ts",
      "./parameter-socket": "./dom/parameter-socket.ts",
      "./node-tree-editor": "./dom/node-tree-editor.ts",
      "./dom.css": "./dom.css",
    })
    expect(packageJson.dependencies).toEqual({
      "@zavx0z/dom": "link:@zavx0z/dom",
      "@zavx0z/react": "link:@zavx0z/react",
      "@zavx0z/template": "link:@zavx0z/template",
      "@ui/components": "link:@ui/components",
    })
    expect(source).toContain('from "@ui/components/field"')
    expect(new Set(source.match(/from "@ui\/components\/[^"]+"/gu) ?? [])).toEqual(new Set([
      'from "@ui/components/field"',
    ]))
    for (const forbidden of [
      "@engine/core",
      "@layout/core",
      "@ui/elements",
      "UiSurface",
      "UiRuntime",
      "createField",
      "FieldController",
      ".ui-field",
    ]) {
      expect(source).not.toContain(forbidden)
    }
    expect(await Bun.file(join(uiRoot, "projection.ts")).exists()).toBeFalse()
  })

  test("publishes only existing independent entrypoints", async () => {
    for (const packagePath of [
      "packages/core",
      "packages/editor",
      "packages/layout",
      "packages/worker",
      "packages/ui",
    ]) {
      const root = join(repositoryRoot, packagePath)
      const packageJson = await Bun.file(join(root, "package.json")).json() as {
        exports?: Record<string, string | Readonly<{default?: string; types?: string}>>
      }
      for (const target of Object.values(packageJson.exports ?? {})) {
        const values = typeof target === "string" ? [target] : [target.default, target.types]
        for (const value of new Set(values.filter((entry): entry is string => entry !== undefined))) {
          expect(await Bun.file(join(root, value)).exists(), `${packagePath} exports missing ${value}`).toBeTrue()
        }
      }
    }
    const rootManifest = await Bun.file(join(repositoryRoot, "package.json")).json() as {
      main?: string
      types?: string
      exports?: Record<string, unknown>
    }
    expect(rootManifest.main).toBeUndefined()
    expect(rootManifest.types).toBeUndefined()
    expect(rootManifest.exports).toBeUndefined()

    const coreManifest = await Bun.file(join(coreRoot, "package.json")).json() as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(coreManifest.exports).sort()).toEqual([
      ".",
      "./json-patch",
      "./node-tree",
      "./parameter",
      "./projection-types",
    ])

    const workerManifest = await Bun.file(join(workerRoot, "package.json")).json() as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(workerManifest.exports).sort()).toEqual([
      ".",
      "./adaptive/client",
      "./adaptive/executor",
      "./coffman-graham/client",
      "./coffman-graham/executor",
      "./fixed/client",
      "./fixed/executor",
      "./top-down/client",
      "./top-down/executor",
      "./transport",
      "./types",
      "./worker-protocol.css",
    ])
    const layoutManifest = await Bun.file(join(packagesRoot, "layout/package.json")).json() as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(layoutManifest.exports).sort()).toEqual([
      ".",
      "./adaptive",
      "./coffman-graham",
      "./fixed",
      "./layout-presentation.css",
      "./top-down",
      "./types",
    ])
    const uiManifest = await Bun.file(join(packagesRoot, "ui/package.json")).json() as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(uiManifest.exports).sort()).toEqual([
      ".",
      "./dom.css",
      "./graph-canvas",
      "./link",
      "./node",
      "./node-editor",
      "./node-system",
      "./node-tree-editor",
      "./node-workbench",
      "./parameter",
      "./parameter-socket",
      "./socket",
    ])
    for (const legacy of [
      "validation.ts",
      "containment.ts",
      "measured-layout.ts",
      "adaptive-layout.ts",
      "incremental-layout.ts",
      "types/model.ts",
      "types/measured.ts",
    ]) expect(await Bun.file(join(packagesRoot, legacy)).exists(), legacy).toBeFalse()
  })

  test("builds independent core, authoring, layout policies and DOM UI consumers", async () => {
    const core = await buildFixture("core-consumer.ts")
    const authoring = await buildFixture("editor-consumer.ts")
    const fixedLayout = await buildFixture("fixed-layout-consumer.ts")
    const adaptiveLayout = await buildFixture("adaptive-layout-consumer.ts")
    const topDownLayout = await buildFixture("top-down-layout-consumer.ts")
    const coffmanGrahamLayout = await buildFixture("coffman-graham-layout-consumer.ts")
    const domUi = await buildFixture("dom-ui-consumer.ts")

    expect(core.source).toContain("Stale NodeTree projection")
    expect(core.source).toContain("must contain only finite numbers")
    expect(core.source).not.toContain("struct GlobalUniforms")
    expect(core.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(authoring.source).toContain("NodeTreeEditor")
    expect(authoring.source).toContain("JSON Patch")
    expect(authoring.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(authoring.source).not.toContain("struct GlobalUniforms")
    expect(fixedLayout.source).toContain("Port has conflicting edge roles")
    expect(fixedLayout.source).toContain("NO_LEGAL_LAYOUT")
    expect(fixedLayout.source).not.toContain("NO_LEGAL_ADAPTIVE_SIDE_ASSIGNMENT")
    expect(fixedLayout.source).not.toContain("NodeSystemSurface")
    expect(adaptiveLayout.source).toContain("NO_LEGAL_ADAPTIVE_SIDE_ASSIGNMENT")
    expect(adaptiveLayout.source).toContain("NO_LEGAL_LAYOUT")
    expect(adaptiveLayout.source).not.toContain("Port has conflicting edge roles")
    expect(adaptiveLayout.source).not.toContain("NodeSystemSurface")
    expect(adaptiveLayout.source).not.toContain("NodeInspectorSurface")
    expect(adaptiveLayout.source).not.toContain("struct GlobalUniforms")
    expect(fixedLayout.source).not.toContain("TOP_DOWN_CYCLE_DETECTED")
    expect(adaptiveLayout.source).not.toContain("TOP_DOWN_CYCLE_DETECTED")
    expect(topDownLayout.source).toContain("TOP_DOWN_CYCLE_DETECTED")
    expect(topDownLayout.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(topDownLayout.source).not.toContain("NO_LEGAL_ADAPTIVE_SIDE_ASSIGNMENT")
    expect(topDownLayout.source).not.toContain("Port has conflicting edge roles")
    expect(topDownLayout.source).not.toContain("sparse visibility")
    expect(coffmanGrahamLayout.source).toContain("COFFMAN_GRAHAM_CYCLE_DETECTED")
    expect(coffmanGrahamLayout.source).not.toContain("TOP_DOWN_CYCLE_DETECTED")
    expect(coffmanGrahamLayout.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(coffmanGrahamLayout.source).not.toContain("NO_LEGAL_ADAPTIVE_SIDE_ASSIGNMENT")
    expect(coffmanGrahamLayout.source).not.toContain("Port has conflicting edge roles")
    expect(domUi.source).toContain("GraphCanvas props must be an object")
    expect(domUi.source).toContain("NodeEditor props must be an object")
    expect(domUi.source).toContain("Node definition must be an object")
    expect(domUi.source).toContain("NodeWorkbench props must be an object")
    expect(domUi.source).toContain("ParameterSocket props must be an object")
    expect(domUi.source).toContain("NodeTreeEditor props must be an object")
    expect(domUi.source).not.toContain("UiSurface")
    expect(domUi.source).toContain("Field mount is disposed")
    expect(domUi.source).not.toContain("createField")
    expect(domUi.source).not.toContain("@layout/core")
    expect(domUi.source).not.toContain(".node-socket {")
    expect(domUi.source).not.toContain(".node-link {")
    expect(domUi.source).not.toContain(".node-article {")
    expect(domUi.source).not.toContain(".graph-canvas {")
    expect(domUi.source).not.toContain(".node-tree-dom {")
    expect(domUi.source).not.toContain(".parameter-socket {")

    expect(core.bytes).toBeLessThan(20_000)
    expect(authoring.bytes).toBeLessThan(40_000)
    expect(authoring.gzipBytes).toBeLessThan(12_000)
    expect(fixedLayout).toMatchObject({
      bytes: 75_644,
      gzipBytes: 23_493,
      sha256: "fe6e05f5bf48d06089be134d2764a9d228a15f2477bb29ef2f20c6a3df043401",
    })
    expect(adaptiveLayout).toMatchObject({
      bytes: 81_141,
      gzipBytes: 25_309,
      sha256: "8ca3dc0a037c2ad40181b7fa8708dbdfe15331c76852c41803194de6e40cb013",
    })
    expect(topDownLayout).toMatchObject({
      bytes: 59_154,
      gzipBytes: 20_503,
      sha256: "dc9eb779cd6c6189fcca55a5d103c2e78f9f895877858f530eb34c41acac8715",
    })
    expect(coffmanGrahamLayout).toMatchObject({
      bytes: 36_619,
      gzipBytes: 12_541,
      sha256: "18ed4f095ac201266151002d83cdb9dfd2e15c5db7f98d06505d1df63c2ec3b9",
    })
    expect(domUi.bytes).toBeLessThanOrEqual(fullDomUiBundleBudget.bytes)
    expect(domUi.gzipBytes).toBeLessThanOrEqual(fullDomUiBundleBudget.gzipBytes)
  })
})

async function buildFixture(name: string): Promise<{
  source: string
  bytes: number
  gzipBytes: number
  sha256: string
}> {
  if (name === "dom-ui-consumer.ts") {
    const result = await Bun.build({
      entrypoints: [join(fixturesRoot, name)],
      target: "browser",
      format: "esm",
      minify: true,
      plugins: [createTemplateJsxBunPlugin({
        sourceRoots: [
          join(repositoryRoot, "packages/ui"),
          join(repositoryRoot, "../ui/packages/components"),
        ],
      })],
    })
    if (!result.success) throw new Error(result.logs.map(({message}) => message).join("\n"))
    const bytes = new Uint8Array(await result.outputs[0]!.arrayBuffer())
    return {
      source: new TextDecoder().decode(bytes),
      bytes: bytes.byteLength,
      gzipBytes: Bun.gzipSync(bytes).byteLength,
      sha256: new Bun.CryptoHasher("sha256").update(bytes).digest("hex"),
    }
  }
  const directory = await mkdtemp(join(tmpdir(), "nodes-package-bundle-"))
  const output = join(directory, "bundle.js")
  try {
    const childProcess = Bun.spawn([
      process.execPath,
      "build",
      join(fixturesRoot, name),
      "--target=browser",
      "--format=esm",
      "--minify",
      `--outfile=${output}`,
    ], {cwd: repositoryRoot, stdout: "pipe", stderr: "pipe"})
    const [exitCode, stdout, stderr] = await Promise.all([
      childProcess.exited,
      new Response(childProcess.stdout).text(),
      new Response(childProcess.stderr).text(),
    ])
    if (exitCode !== 0) throw new Error(`${stdout}\n${stderr}`.trim())
    const bytes = new Uint8Array(await Bun.file(output).arrayBuffer())
    return {
      source: new TextDecoder().decode(bytes),
      bytes: bytes.byteLength,
      gzipBytes: Bun.gzipSync(bytes).byteLength,
      sha256: new Bun.CryptoHasher("sha256").update(bytes).digest("hex"),
    }
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, {withFileTypes: true})
  const files: string[] = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (entry.isFile() && /\.tsx?$/u.test(path)) files.push(path)
  }
  return files
}

async function readAll(paths: readonly string[]): Promise<string> {
  const sources = await Promise.all(paths.map(async (path) =>
    `// ${relative(repositoryRoot, path)}\n${await Bun.file(path).text()}`))
  return sources.join("\n")
}

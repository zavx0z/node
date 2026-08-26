import {describe, expect, test} from "bun:test"
import {mkdtemp, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join, relative} from "node:path"
import {fileURLToPath} from "node:url"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const packagesRoot = join(repositoryRoot, "packages")
const fixturesRoot = join(repositoryRoot, "tests/fixtures")
const coreRoot = join(packagesRoot, "core")
const workerRoot = join(packagesRoot, "worker")

describe("universal node-system package boundaries", () => {
  test("keeps @nodes/core free of renderer, layout, HUD and product imports", async () => {
    const packageJson = await Bun.file(join(coreRoot, "package.json")).json() as {
      dependencies?: Record<string, string>
    }
    expect(Object.keys(packageJson.dependencies ?? {})).toEqual([])

    const files = (await sourceFiles(coreRoot))
      .filter((path) => !path.endsWith(".test.ts"))
      .filter((path) => !path.includes("/storybook/"))
    const source = await readAll(files)
    expect(source).not.toMatch(/from ["']@nodes\//)
    expect(source).not.toMatch(/from ["']@ui\//)
    expect(source).not.toMatch(/from ["']@metafor\/engine/)
    expect(source).not.toContain("Hamiltonian")
  })

  test("keeps exact Node Editor rendering solver-free and isolates the explicit projection adapter", async () => {
    const uiRoot = join(packagesRoot, "ui")
    const packageJson = await Bun.file(join(uiRoot, "package.json")).json() as {
      dependencies?: Record<string, string>
    }
    expect(packageJson.dependencies?.["@ui/hud"]).toBeUndefined()
    const production = (await sourceFiles(uiRoot))
      .filter((path) => !path.endsWith(".test.ts"))
      .filter((path) => !path.includes("/storybook/"))
    const source = await readAll(production)
    const exactEditor = await Bun.file(join(uiRoot, "node-editor.ts")).text()
    const projection = await Bun.file(join(uiRoot, "projection.ts")).text()
    expect(source).not.toMatch(/from ["']@ui\/hud/)
    expect(exactEditor).not.toMatch(/from ["']@nodes\//)
    expect(projection).toContain('from "@nodes/core/node-tree"')
    expect(projection).toContain('from "@nodes/layout/fixed"')
    expect(source).not.toMatch(/\b(?:NodeSystemSurface|NodeSystemCard|NodeSystemFact)\b/)
    for (const productTerm of [
      "service-worker-api",
      "oracle-rtc-data-channel",
      "force-rtc-data-channel",
      "HAMILTONIAN",
    ]) expect(source).not.toContain(productTerm)
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
      "./fixed/client",
      "./fixed/executor",
      "./top-down/client",
      "./top-down/executor",
      "./transport",
      "./types",
    ])
    const layoutManifest = await Bun.file(join(packagesRoot, "layout/package.json")).json() as {
      exports: Record<string, unknown>
    }
    expect(Object.keys(layoutManifest.exports).sort()).toEqual([
      ".",
      "./adaptive",
      "./fixed",
      "./top-down",
      "./types",
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

  test("builds independent core, authoring, layout policies and Node Editor consumers", async () => {
    const core = await buildFixture("core-consumer.ts")
    const authoring = await buildFixture("editor-consumer.ts")
    const fixedLayout = await buildFixture("fixed-layout-consumer.ts")
    const adaptiveLayout = await buildFixture("adaptive-layout-consumer.ts")
    const topDownLayout = await buildFixture("top-down-layout-consumer.ts")
    const nodeEditor = await buildFixture("node-editor-consumer.ts")
    const projection = await buildFixture("projection-consumer.ts")

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
    expect(nodeEditor.source).toContain("NodeEditor")
    expect(nodeEditor.source).toContain("NodeCanvas")
    expect(nodeEditor.source).toContain("Socket is detached")
    expect(nodeEditor.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(nodeEditor.source).not.toContain("NO_LEGAL_ADAPTIVE_SIDE_ASSIGNMENT")
    expect(projection.source).toContain("Stale NodeTree projection")
    expect(projection.source).toContain("Port has conflicting edge roles")
    expect(projection.source).toContain("Missing Node view")
    for (const legacy of [
      "NodeSystemSurface",
      "NodeSystemCard",
      "NodeSystemFact",
      "NodeInspectorSurface",
    ]) expect(nodeEditor.source).not.toContain(legacy)

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
      bytes: 59_055,
      gzipBytes: 20_479,
      sha256: "f5bca8745c4f05db59cf5298a4374a608d75b4a1a7d74db2adb799d1352bd579",
    })
    expect(nodeEditor.bytes).toBeLessThan(350_000)
    expect(nodeEditor.gzipBytes).toBeLessThan(100_000)
    expect(projection.bytes).toBeLessThan(520_000)
    expect(projection.gzipBytes).toBeLessThan(145_000)
  })
})

async function buildFixture(name: string): Promise<{
  source: string
  bytes: number
  gzipBytes: number
  sha256: string
}> {
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
    else if (entry.isFile() && path.endsWith(".ts")) files.push(path)
  }
  return files
}

async function readAll(paths: readonly string[]): Promise<string> {
  const sources = await Promise.all(paths.map(async (path) =>
    `// ${relative(repositoryRoot, path)}\n${await Bun.file(path).text()}`))
  return sources.join("\n")
}

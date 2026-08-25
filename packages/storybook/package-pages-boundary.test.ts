import {describe, expect, test} from "bun:test"
import {mkdtemp, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {nodesStorybookPageFiles, type NodesStorybookPageId} from "./server/page-registry.ts"

describe("central Nodes storybook bundle boundaries", () => {
  test("keeps DOM, SVG and WebGPU package pages in independent browser bundles", async () => {
    const builds = new Map<NodesStorybookPageId, Awaited<ReturnType<typeof buildPage>>>()
    for (const id of ["catalog", "core", "editor", "layout", "worker", "ui"] as const) {
      builds.set(id, await buildPage(id))
    }

    const core = builds.get("core")!
    const layout = builds.get("layout")!
    const worker = builds.get("worker")!
    const editor = builds.get("editor")!
    const ui = builds.get("ui")!

    for (const page of [core, layout, worker]) {
      expect(page.source).not.toContain("struct GlobalUniforms")
      expect(page.source).not.toContain("navigator.gpu")
      expect(page.source).not.toContain("NodeCanvas.contentRoot")
    }
    expect(core.source).toContain("NodeTree revision conflict")
    expect(core.source).not.toContain("NO_LEGAL_LAYOUT")
    expect(layout.source).toContain("NO_LEGAL_LAYOUT")
    expect(layout.source).not.toContain("NodeTree revision conflict")
    expect(layout.source).not.toContain("NodeEditor")
    expect(worker.source).toContain("layout-result")
    expect(worker.source).not.toContain("NodeEditor")
    expect(editor.source).toContain("NodeTreeEditor")
    expect(editor.source).toContain("NodeEditor")
    expect(ui.source).toContain("NodeEditor")
    expect(ui.outputs).toBeGreaterThan(1)

    expect(core.bytes).toBeLessThan(45_000)
    expect(layout.bytes).toBeLessThan(135_000)
    expect(worker.bytes).toBeLessThan(135_000)
    expect(editor.bytes).toBeLessThan(620_000)
    expect(ui.bytes).toBeLessThan(750_000)
  })

  test("owns the exact accepted reference asset in the centralized UI page", async () => {
    const file = Bun.file(new URL("./assets/references/blender-4.5.5-reference.png", import.meta.url))
    const hash = new Bun.CryptoHasher("sha256")
      .update(new Uint8Array(await file.arrayBuffer()))
      .digest("hex")
    expect(hash).toBe("a493e1c03591800bb05644963369fca49669aa27f98e67a9971fd91735f2531d")
    const catalog = await Bun.file(new URL("./assets/references/catalog.json", import.meta.url)).json() as {
      references: Array<{asset: string; sha256: string; acceptance: string; storyRoute: string}>
    }
    expect(catalog.references).toEqual([expect.objectContaining({
      asset: "blender-4.5.5-reference.png",
      sha256: hash,
      acceptance: "accepted",
      storyRoute: "/ui/comparison/reference/default",
    })])
  })
})

async function buildPage(id: NodesStorybookPageId): Promise<{
  source: string
  bytes: number
  outputs: number
}> {
  const directory = await mkdtemp(join(tmpdir(), `nodes-page-${id}-`))
  try {
    const process = Bun.spawn([
      processExecPath(),
      "build",
      nodesStorybookPageFiles(id).entrypoint,
      "--target=browser",
      "--format=esm",
      "--splitting",
      "--minify",
      `--outdir=${directory}`,
    ], {stdout: "pipe", stderr: "pipe"})
    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
    ])
    expect(exitCode, `${id}\n${stdout}\n${stderr}`).toBe(0)
    const paths = await javascriptFiles(directory)
    const outputs = await Promise.all(paths.map(async (path) => new Uint8Array(await Bun.file(path).arrayBuffer())))
    return {
      source: await Promise.all(paths.map((path) => Bun.file(path).text())).then((sources) => sources.join("\n")),
      bytes: outputs.reduce((total, output) => total + output.byteLength, 0),
      outputs: outputs.length,
    }
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

async function javascriptFiles(root: string): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) paths.push(...await javascriptFiles(path))
    else if (entry.isFile() && entry.name.endsWith(".js")) paths.push(path)
  }
  return paths.sort()
}

function processExecPath(): string {
  return process.execPath
}

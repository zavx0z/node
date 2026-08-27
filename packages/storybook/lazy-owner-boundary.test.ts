import {describe, expect, test} from "bun:test"
import {mkdtemp, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

describe("one-Workbench Nodes Storybook bundle boundaries", () => {
  test("keeps the root Workbench eager and package implementations in lazy chunks", async () => {
    const directory = await mkdtemp(join(tmpdir(), "nodes-root-storybook-"))
    try {
      const child = Bun.spawn([
        process.execPath,
        "build",
        join(import.meta.dir, "app/entry.ts"),
        "--target=browser",
        "--format=esm",
        "--splitting",
        "--outdir",
        directory,
      ], {cwd: join(import.meta.dir, "../.."), stdout: "pipe", stderr: "pipe"})
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])
      expect(exitCode, `${stdout}\n${stderr}`).toBe(0)
      const files = await javascriptFiles(directory)
      const entryPath = files.find((path) => path.endsWith("entry.js"))
      expect(entryPath).toBeDefined()
      const entry = await Bun.file(entryPath!).text()
      const chunkSources = await Promise.all(files.filter((path) => path !== entryPath).map((path) => Bun.file(path).text()))
      const chunks = chunkSources.join("\n")

      expect(entry).toContain("NodesStoryPreviewSurface")
      expect(entry).toContain("StorybookNavigationSurface")
      expect(entry).not.toContain("createWorkerExecutor")
      expect(entry).not.toContain("class NodeTreeEditor")
      expect(entry).not.toContain("NodeCanvas.contentRoot")
      expect(entry).not.toContain("socketRenderer")
      expect(chunks).toContain("createWorkerExecutor")
      expect(chunks).toContain("NodeTreeEditor")
      expect(chunks).toContain("NodeEditor")
      expect(chunks).toContain("socketRenderer")
      expect(files.length).toBeGreaterThan(8)
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  test("owns the exact accepted reference asset as one lazy UI story dependency", async () => {
    const file = Bun.file(new URL("./assets/references/blender-4.5.5-reference.png", import.meta.url))
    const hash = new Bun.CryptoHasher("sha256")
      .update(new Uint8Array(await file.arrayBuffer()))
      .digest("hex")
    expect(hash).toBe("a493e1c03591800bb05644963369fca49669aa27f98e67a9971fd91735f2531d")
  })
})

async function javascriptFiles(root: string): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) paths.push(...await javascriptFiles(path))
    else if (entry.isFile() && entry.name.endsWith(".js")) paths.push(path)
  }
  return paths.sort()
}

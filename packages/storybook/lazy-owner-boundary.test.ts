import {describe, expect, test} from "bun:test"
import {mkdtemp, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

describe("final Nodes Storybook bundle boundaries", () => {
  test("emits one DOM app with lazy production owners and no retained implementation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "nodes-final-storybook-"))
    try {
      const child = Bun.spawn([
        process.execPath,
        join(import.meta.dir, "test-fixtures/build-proof.ts"),
        directory,
      ], {
        cwd: join(import.meta.dir, "../.."),
        stdout: "pipe",
        stderr: "pipe",
      })
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])
      expect(exitCode, `${stdout}\n${stderr}`).toBe(0)
      const files = await javascriptFiles(directory)
      const sources = await Promise.all(files.map((path) => Bun.file(path).text()))
      const output = sources.join("\n")
      expect(files.some((path) => path.endsWith("/dom-entry.js"))).toBeTrue()
      expect(output).toContain("createDocumentCanvasRuntime")
      expect(output).toContain("createNodeEditor")
      expect(output).toContain("createNode")
      expect(output).toContain("createParameter")
      expect(output).toContain("createSocket")
      expect(output).toContain("createLink")
      expect(output).toContain("useSyncExternalStore")
      expect(output).toContain("NodeTreeEditor")
      expect(output).toContain("@ui/components/field")
      expect(output).not.toContain("createField")
      expect(output).toContain("createLayoutDomStory")
      expect(output).toContain("createWorkerDomStory")
      expect(output).toContain("layoutAdaptiveWithDiagnostics")
      expect(output).toContain("createWorkerExecutor")
      expect(files.length).toBeGreaterThan(8)
      for (const forbidden of [
        "UiRuntime.create",
        "StorybookNavigationSurface",
        "NodesStoryPreviewSurface",
        'from "@layout/core',
        'from "@ui/elements',
        "parameterRenderer.render",
        "socketRenderer.render",
        "new NodeEditor",
        "createNodeWorkbench",
        "createParameterSocket",
        "RemainingDomStory",
      ]) expect(output).not.toContain(forbidden)
      expect(output).not.toContain('from "react"')
      expect(output).not.toContain('from "react-dom')
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  test("owns the exact accepted reference asset", async () => {
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

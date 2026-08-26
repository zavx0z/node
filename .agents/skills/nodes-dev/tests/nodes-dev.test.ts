import {afterAll, describe, expect, test} from "bun:test"
import {chmod, mkdtemp, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join, resolve} from "node:path"

type RunResult = Readonly<{exitCode: number; stdout: string; stderr: string}>

const skillRoot = resolve(import.meta.dir, "..")
const checkout = resolve(skillRoot, "../../..")
const lifecycleWrapper = join(skillRoot, "scripts/nodes-dev.sh")
const browserWrapper = join(skillRoot, "scripts/nodes-browser.ts")
const registryPath = join(skillRoot, "scripts/storybooks.json")
const temporaryRoots: string[] = []

afterAll(async () => {
  await Promise.all(temporaryRoots.map((path) => rm(path, {recursive: true, force: true})))
})

describe("standalone nodes-dev boundary", () => {
  test("owns one exact Storybook lifecycle selector", async () => {
    const stateRoot = await temporaryRoot("nodes-dev-state-")
    const lifecycle = await run([lifecycleWrapper, "status", checkout], {
      NODES_DEV_STATE_ROOT: stateRoot,
    })
    expect(lifecycle.exitCode).toBe(0)
    const status = JSON.parse(lifecycle.stdout) as Record<string, unknown>
    expect(status).toMatchObject({
      action: "status",
      checkout,
      selector: "nodes",
      package: "@nodes/storybook",
      cwd: join(checkout, "packages/storybook"),
      origin: "http://127.0.0.1:4018",
    })

    for (const argv of [
      [lifecycleWrapper, "health", checkout, "--storybook", "layout"],
      [lifecycleWrapper, "health"],
    ]) {
      const rejected = await run(argv)
      expect(rejected.exitCode).toBe(1)
      expect(rejected.stderr).toContain("error:")
    }
  })

  test("uses canonical routes as profiles of one browser target", async () => {
    const fakeHelper = await fakeBrowserHelper()
    const env = {
      NODES_DEV_TEST_MODE: "1",
      NODES_DEV_BROWSER_HELPER: fakeHelper,
    }
    for (const route of [
      "/",
      "/core/",
      "/core/live-node-tree",
      "/layout/",
      "/layout/fixed/baseline/right",
      "/layout/dagre-layered/default/default",
      "/layout/coffman-graham/default/default",
      "/worker/",
      "/worker/protocol",
      "/editor/",
      "/editor/live-node-tree",
      "/ui/",
      "/ui/socket/",
      "/ui/socket/boolean/",
      "/ui/socket/boolean/input",
    ]) {
      const action = route.startsWith("/editor/") || route.startsWith("/layout/") || route.startsWith("/ui/") ? "canvas" : "dom"
      const browser = await run([
        process.execPath,
        browserWrapper,
        action,
        checkout,
        "--route",
        route,
      ], env)
      expect(browser.exitCode, `${action} ${route}`).toBe(0)
      expect(JSON.parse(browser.stdout) as string[]).toEqual([
        action,
        checkout,
        "nodes",
        "--route",
        route,
      ])
    }

    for (const argv of [
      [process.execPath, browserWrapper, "canvas", checkout, "--route", "/layout/fixed-adaptive"],
      [process.execPath, browserWrapper, "interact", checkout, "--route", "/core/live-node-tree"],
      [process.execPath, browserWrapper, "dom", checkout, "--route", "/unknown"],
      [process.execPath, browserWrapper, "dom", checkout, "--route", "/core/unknown"],
      [process.execPath, browserWrapper, "canvas", checkout, "--route", "/ui/unknown"],
      [process.execPath, browserWrapper, "dom", checkout, "--route", "/core"],
      [process.execPath, browserWrapper, "canvas", checkout, "--route", "/ui/socket"],
      [process.execPath, browserWrapper, "dom", checkout, "--storybook", "ui"],
    ]) {
      const rejected = await run(argv, env)
      expect(rejected.exitCode).toBe(1)
      expect(rejected.stderr).toContain("error:")
    }
  })

  test("registers the standalone process and route capabilities", async () => {
    const registry = await Bun.file(registryPath).json() as {
      version: number
      selectors: Record<string, unknown>
    }
    expect(registry.version).toBe(2)
    expect(registry.selectors.nodes).toMatchObject({
      supported: true,
      package: "@nodes/storybook",
      cwd: "packages/storybook",
      command: ["bun", "server.ts"],
      host: "127.0.0.1",
      port: 4018,
      origin: "http://127.0.0.1:4018",
      httpMarker: "<title>Nodes storybook</title>",
      ready: {kind: "dataset", name: "nodesStorybook", value: "ready"},
      routes: {default: "/"},
    })
    expect(registry.selectors.ui).toBeUndefined()
  })

  test("contains discoverable references and no unfinished scaffold text", async () => {
    const paths = [
      "SKILL.md",
      "agents/openai.yaml",
      "references/editor-webgpu.md",
      "references/layout-webgpu.md",
      "references/ui-webgpu.md",
      "scripts/nodes-dev.sh",
      "scripts/nodes-browser.ts",
      "scripts/nodes-dispatcher.sh",
      "scripts/storybook-browser.ts",
    ]
    const sources = await Promise.all(paths.map((path) => Bun.file(join(skillRoot, path)).text()))
    for (const source of sources) {
      expect(source).not.toContain("[TODO:")
      expect(source).not.toContain("<skill-name>")
      expect(source).not.toContain("pkg/nodes/")
    }
    expect(sources.at(-1)).toContain('document.querySelector(${JSON.stringify(canvasSelector)})')
    expect(sources.at(-1)).toContain('document.querySelector("[data-storybook-footer]")')
    const plan = await Bun.file(join(skillRoot, "references/editor-cache-invalidation.plan.json")).json() as {
      version?: number
      steps?: Array<{kind?: string; code?: string; dom?: boolean}>
    }
    expect(plan.version).toBe(1)
    expect(plan.steps?.[0]?.code).toBe("F8")
    expect(plan.steps?.at(-1)?.dom).toBeTrue()
  })

  test("distinguishes process-free verification from the server test", async () => {
    const skill = await Bun.file(join(skillRoot, "SKILL.md")).text()
    const serverTest = await Bun.file(join(checkout, "packages/storybook/server.test.ts")).text()
    expect(serverTest).toContain("Bun.spawn")
    expect(skill).toContain("server.test.ts")
    expect(skill).toContain("forbids starting or stopping any process")
  })

  test("keeps public wrappers free of focus, window, and kill-by-port mechanics", async () => {
    const source = [await Bun.file(lifecycleWrapper).text(), await Bun.file(browserWrapper).text()].join("\n")
    for (const forbidden of [
      /Page\.bringToFront/,
      /Browser\.setWindowBounds/,
      /["']\/focus["']/,
      /["']\/activate["']/,
      /["']\/windows["']/,
      /\bosascript\b/,
      /\bscreencapture\b/,
      /\blsof\b/,
      /\bfuser\b/,
      /\bpkill\b/,
      /\bkill\b/,
      /-iTCP/,
      /\bLISTEN\b/,
    ]) expect(source).not.toMatch(forbidden)
  })
})

async function fakeBrowserHelper(): Promise<string> {
  const root = await temporaryRoot("nodes-browser-test-")
  const helper = join(root, "browser.ts")
  await writeFile(helper, "console.log(JSON.stringify(Bun.argv.slice(2)))\n")
  await chmod(helper, 0o755)
  return helper
}

async function temporaryRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix))
  temporaryRoots.push(root)
  return root
}

async function run(argv: readonly string[], env: Record<string, string> = {}): Promise<RunResult> {
  const child = Bun.spawn([...argv], {
    cwd: checkout,
    env: {...Bun.env, ...env},
    stdout: "pipe",
    stderr: "pipe",
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  return {exitCode, stdout, stderr}
}

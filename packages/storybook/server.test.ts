import {describe, expect, test} from "bun:test"
import {fileURLToPath} from "node:url"

const storybookRoot = fileURLToPath(new URL(".", import.meta.url))

describe("root Nodes Storybook server", () => {
  test("serves every section through one no-HMR Workbench page", async () => {
    const port = await freePort()
    const process = Bun.spawn(["bun", "server.ts"], {
      cwd: storybookRoot,
      env: {...Bun.env, STORYBOOK_PORT: String(port)},
      stdout: "pipe",
      stderr: "pipe",
    })
    try {
      const origin = `http://127.0.0.1:${port}`
      for (const route of [
        "/",
        "/core/",
        "/editor/node-tree/live",
        "/layout/fixed/baseline/right",
        "/worker/coffman-graham/default",
        "/ui/parameter/text/connected",
        "/ui/socket/boolean/input",
      ]) {
        const response = await waitForResponse(`${origin}${route}`)
        const html = await response.text()
        expect(html, route).toContain("<title>Nodes Storybook</title>")
        expect(html, route).toContain('<canvas id="nodes-storybook-canvas"></canvas>')
        expect(html, route).toContain('/@storybook-assets/workbench/entry.js')
        expect(html, route).not.toContain("nodes-package-catalog")
        expect(html, route).not.toContain("data-storybook-home")
      }
      expect(await fetch(`${origin}/unknown`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/layout/missing`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/ui/socket/unknown`).then(({status}) => status)).toBe(404)
      const redirect = await fetch(`${origin}/layout/fixed`, {redirect: "manual"})
      expect(redirect.status).toBe(308)
      expect(redirect.headers.get("location")).toBe("/layout/fixed/")
      const entry = await fetch(`${origin}/@storybook-assets/workbench/entry.js`)
      expect(entry.status).toBe(200)
      expect(entry.headers.get("content-type")).toContain("text/javascript")
    } finally {
      process.kill()
      await process.exited
    }
  }, 30_000)
})

async function freePort(): Promise<number> {
  const server = Bun.serve({hostname: "127.0.0.1", port: 0, fetch: () => new Response("probe")})
  const port = server.port
  server.stop(true)
  if (port === undefined) throw new Error("Bun did not allocate a test port")
  return port
}

async function waitForResponse(url: string): Promise<Response> {
  const deadline = Date.now() + 5_000
  let lastError: unknown = null
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
      lastError = new Error(`Unexpected HTTP status: ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await Bun.sleep(25)
  }
  throw new Error(`Storybook server did not become ready: ${String(lastError)}`)
}

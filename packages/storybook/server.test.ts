import {describe, expect, test} from "bun:test"
import {fileURLToPath} from "node:url"

const storybookRoot = fileURLToPath(new URL(".", import.meta.url))

describe("parent nodes storybook server", () => {
  test("serves catalog and every package page from one no-HMR origin", async () => {
    const port = await freePort()
    const process = Bun.spawn(["bun", "server.ts"], {
      cwd: storybookRoot,
      env: {
        ...Bun.env,
        NODES_STORYBOOK_HOST: "127.0.0.1",
        NODES_STORYBOOK_PORT: String(port),
      },
      stdout: "pipe",
      stderr: "pipe",
    })

    try {
      const origin = `http://127.0.0.1:${port}`
      const catalog = await waitForResponse(`${origin}/`)
      const catalogHtml = await catalog.text()
      expect(catalog.headers.get("cache-control")).toBe("no-cache")
      expect(catalogHtml).toContain("<title>Nodes storybook</title>")
      expect(catalogHtml).toContain('id="nodes-package-catalog"')
      expect(catalogHtml).not.toContain("data-storybook-brand")
      expect(catalogHtml).toContain('data-storybook-footer')
      expect(catalogHtml).toContain('Создано для&nbsp;<a href="https://github.com/zavx0z/metafor">MetaFor</a>')
      expect(catalogHtml).toContain("системы узлов для агентов, сложных систем и иммерсивного WebGPU")

      const overviewCases = [
        ["/core/", "@nodes/core", 'id="core-snapshot"', "core"],
        ["/editor/", "@nodes/editor", 'id="nodes-storybook-canvas"', "editor"],
        ["/layout/", "@nodes/layout", 'id="nodes-storybook-canvas"', "layout"],
        ["/worker/", "@nodes/worker", 'id="worker-request"', "worker"],
        ["/ui/", "@nodes/ui", 'id="nodes-storybook-canvas"', "ui"],
        ["/ui/parameter/", "@nodes/ui", 'id="nodes-storybook-canvas"', "ui"],
        ["/ui/parameter/text/", "@nodes/ui", 'id="nodes-storybook-canvas"', "ui"],
      ] as const
      const leafCases = [
        ["/core/live-node-tree", "@nodes/core", 'id="core-snapshot"', "core"],
        ["/editor/live-node-tree", "@nodes/editor", 'id="nodes-storybook-canvas"', "editor"],
        ["/layout/fixed/baseline/right", "@nodes/layout", 'id="nodes-storybook-canvas"', "layout"],
        ["/layout/top-down/blender-area/default", "@nodes/layout", 'id="nodes-storybook-canvas"', "layout"],
        ["/layout/top-down/dense/default", "@nodes/layout", 'id="nodes-storybook-canvas"', "layout"],
        ["/worker/protocol", "@nodes/worker", 'id="worker-request"', "worker"],
        ["/ui/parameter/text/connected", "@nodes/ui", 'id="nodes-storybook-canvas"', "ui"],
        ["/ui/socket/boolean/input", "@nodes/ui", 'id="nodes-storybook-canvas"', "ui"],
      ] as const
      for (const [route, packageName, marker, pageId] of [...overviewCases, ...leafCases]) {
        const response = await fetch(`${origin}${route}`)
        const html = await response.text()
        expect(response.status, route).toBe(200)
        expect(html, route).toContain(`<title>Nodes storybook · ${packageName}</title>`)
        expect(html, route).toContain('<meta name="engine-default-font" content="/fonts/jetbrains-mono-bold.ttf">')
        expect(html, route).toContain('data-storybook-home href="/"')
        expect(html, route).toContain(">Главная</a>")
        expect(html, route).toContain(marker)
        expect(html, route).toContain(`/@storybook-assets/${pageId}/entry.js`)
        const entry = await fetch(`${origin}/@storybook-assets/${pageId}/entry.js`)
        expect(entry.status, `${pageId} entry`).toBe(200)
        expect(entry.headers.get("content-type"), pageId).toContain("text/javascript")
      }
      expect(await fetch(`${origin}/unknown`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/core/unknown`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/ui/parameter/unknown`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/ui/parameter/composition/field`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/ui/parameter/connection/connected`).then(({status}) => status)).toBe(404)
      expect(await fetch(`${origin}/ui/socket/unknown`).then(({status}) => status)).toBe(404)
      const redirect = await fetch(`${origin}/core`, {redirect: "manual"})
      expect(redirect.status).toBe(308)
      expect(redirect.headers.get("location")).toBe("/core/")
      const parameterRedirect = await fetch(`${origin}/ui/parameter`, {redirect: "manual"})
      expect(parameterRedirect.status).toBe(308)
      expect(parameterRedirect.headers.get("location")).toBe("/ui/parameter/")
    } finally {
      process.kill()
      await process.exited
    }
  }, 30_000)
})

async function freePort(): Promise<number> {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => new Response("probe"),
  })
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

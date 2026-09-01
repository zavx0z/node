import {describe, expect, test} from "bun:test"
import {Event, createDocument, type Document} from "@zavx0z/dom"
import {createRoot} from "@zavx0z/react"
import {createNodesExternalRuntime} from "../.storybook/runtime.ts"

describe("Nodes structural external runtime", () => {
  test("mounts an owner factory in the exact supplied Document and publishes facets", async () => {
    const document = createDocument()
    const lifetime = new AbortController()
    const route = new AbortController()
    const presentations: Readonly<Record<string, unknown>>[] = []
    let disposed = 0
    const runtime = createNodesExternalRuntime()
    const session = runtime.create({
      document,
      signal: lifetime.signal,
      present(value) {
        presentations.push(value)
        document.appendChild(value.node)
      },
      reportDiagnostic() {},
    })
    await session.mount({
      route: "fixture/default",
      signal: route.signal,
      story(ownerDocument: Document, storyRoute: string) {
        const element = ownerDocument.createElement("section")
        const componentRoot = createRoot(element)
        element.textContent = storyRoute
        return Object.freeze({
          element,
          componentRoot,
          props: Object.freeze({route: storyRoute}),
          source: () => Object.freeze({html: "<section></section>", typescript: "export {}"}),
          dispose() {
            componentRoot.unmount()
            disposed += 1
          },
        })
      },
    })

    expect(runtime.protocol).toBe("storybook-runtime/3")
    expect("styleSheets" in session).toBeFalse()
    expect(presentations).toHaveLength(1)
    expect(presentations[0]).toEqual(expect.objectContaining({
      protocol: "story-presentation/1",
      node: document.firstChild,
      source: {html: "<section></section>", typescript: "export {}"},
      values: {props: {route: "fixture/default"}},
    }))
    expect((presentations[0]?.componentRoot as {readStyleSheets(): unknown}).readStyleSheets()).toEqual({
      revision: 0,
      styleSheets: [],
    })

    await session.unmount()
    expect(disposed).toBe(1)
    await session.dispose()
    await session.dispose()
  })

  test("aborts before invoking a story and imports no Storybook package", async () => {
    const document = createDocument()
    const lifetime = new AbortController()
    const route = new AbortController()
    route.abort()
    let called = false
    const session = createNodesExternalRuntime().create({
      document,
      signal: lifetime.signal,
      present() {},
      reportDiagnostic() {},
    })
    await session.mount({
      route: "fixture/aborted",
      signal: route.signal,
      story() {
        called = true
        throw new Error("must not run")
      },
    })
    expect(called).toBeFalse()
    const source = await Bun.file(new URL("../.storybook/runtime.ts", import.meta.url)).text()
    expect(source).not.toMatch(/@zavx0z\/storybook|@nodes\/storybook/u)
    await session.dispose()
  })

  test("keeps one atomic presentation while owner interactions mutate live DOM", async () => {
    const document = createDocument()
    const lifetime = new AbortController()
    const route = new AbortController()
    let presentations = 0
    const session = createNodesExternalRuntime().create({
      document,
      signal: lifetime.signal,
      present(value) {
        presentations += 1
        if (presentations > 1) throw new Error("presentation must remain atomic")
        document.appendChild(value.node)
      },
      reportDiagnostic() {},
    })
    await session.mount({
      route: "fixture/interactive",
      signal: route.signal,
      story(ownerDocument: Document) {
        const element = ownerDocument.createElement("button")
        const componentRoot = createRoot(element)
        element.addEventListener("click", () => element.setAttribute("aria-pressed", "true"))
        return Object.freeze({
          element,
          componentRoot,
          source: () => Object.freeze({html: "<button></button>", typescript: "export {}"}),
          dispose() { componentRoot.unmount() },
        })
      },
    })

    document.querySelector("button")!.dispatchEvent(new Event("click", {bubbles: true}))

    expect(presentations).toBe(1)
    expect(document.querySelector("button")?.getAttribute("aria-pressed")).toBe("true")
    await session.dispose()
  })
})

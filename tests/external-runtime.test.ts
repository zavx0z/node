import {describe, expect, test} from "bun:test"
import {createDocument, type Document} from "@zavx0z/dom"
import {createNodesExternalRuntime} from "../.storybook/runtime.ts"

describe("Nodes structural external runtime", () => {
  test("mounts an owner factory in the exact supplied Document and publishes facets", async () => {
    const document = createDocument()
    const lifetime = new AbortController()
    const route = new AbortController()
    const mounted: unknown[] = []
    const inspector: unknown[] = []
    const source: unknown[] = []
    const props: unknown[] = []
    let renders = 0
    let disposed = 0
    const runtime = createNodesExternalRuntime([".owner { color: cyan; }"])
    const session = runtime.create({
      document,
      signal: lifetime.signal,
      mount(node) { mounted.push(node) },
      publishInspector(value) { inspector.push(value) },
      publishSource(value) { source.push(value) },
      publishProps(value) { props.push(value) },
      reportDiagnostic() {},
      requestRender() { renders += 1 },
    })
    await session.mount({
      route: "fixture/default",
      signal: route.signal,
      story(ownerDocument: Document, storyRoute: string) {
        const element = ownerDocument.createElement("section")
        element.textContent = storyRoute
        return Object.freeze({
          element,
          props: Object.freeze({route: storyRoute}),
          source: () => Object.freeze({html: "<section></section>", css: ".owner {}", typescript: "export {}"}),
          dispose() { disposed += 1 },
        })
      },
    })

    expect(runtime.protocol).toBe("storybook-runtime/1")
    expect(session.styleSheets).toEqual([".owner { color: cyan; }"])
    expect(mounted[0]).toBeInstanceOf(Object)
    expect((mounted[0] as {ownerDocument: unknown}).ownerDocument).toBe(document)
    expect(inspector.at(-1)).toMatchObject({props: {route: "fixture/default"}})
    expect(source).toHaveLength(1)
    expect(props.at(-1)).toEqual({route: "fixture/default"})
    expect(renders).toBeGreaterThan(0)

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
    const session = createNodesExternalRuntime([]).create({
      document,
      signal: lifetime.signal,
      mount() {},
      publishInspector() {},
      publishSource() {},
      publishProps() {},
      reportDiagnostic() {},
      requestRender() {},
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
})

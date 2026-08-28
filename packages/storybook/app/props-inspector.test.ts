import {describe, expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {
  createNodesPropsInspector,
  nodesPropsInspectorCss,
} from "./props-inspector.ts"

describe("Nodes Storybook Props inspector", () => {
  test("projects route metadata and live props into one stable same-Document panel", () => {
    const document = createDocument()
    const inspector = createNodesPropsInspector(document, {
      title: "Parameter · Vector",
      apiName: "Parameter",
      route: "ui/parameter/vector/both",
      owner: "parameter",
      props: {selected: true, value: [1, 2, 3]},
    })
    const root = inspector.element
    const selected = root.querySelector('[data-prop-key="props:selected"]')

    expect(root.ownerDocument).toBe(document)
    expect(root.localName).toBe("aside")
    expect(root.hasAttribute("data-node-props-inspector")).toBeTrue()
    expect(root.getAttribute("data-story-route")).toBe("ui/parameter/vector/both")
    expect(root.querySelector('[data-prop-key="meta:api"]')?.textContent).toContain("Parameter")
    expect(selected?.textContent).toContain("true")
    expect(root.textContent).not.toContain("HTML")
    expect(root.textContent).not.toContain("CSS")
    expect(root.textContent).not.toContain("TypeScript")

    inspector.update({
      title: "Parameter · Vector",
      apiName: "Parameter",
      route: "ui/parameter/vector/output",
      owner: "parameter",
      props: {selected: false, disabled: true},
    })

    expect(inspector.element).toBe(root)
    expect(root.querySelector('[data-prop-key="props:selected"]')).toBe(selected)
    expect(selected?.textContent).toContain("false")
    expect(root.querySelector('[data-prop-key="props:disabled"]')?.textContent).toContain("true")
    expect(root.querySelector('[data-prop-key="props:value"]')).toBeNull()
    expect(nodesPropsInspectorCss).toContain("[data-node-props-inspector] [data-prop-key]")
    expect([...root.querySelectorAll("*")].every((element) => element.className === "")).toBeTrue()
  })

  test("disposes projection state without removing the Workbench-owned panel", () => {
    const document = createDocument()
    const host = document.createElement("div")
    const inspector = createNodesPropsInspector(document, {
      title: "Overview",
      apiName: "Nodes",
      route: "",
      owner: "root",
      props: {},
    })
    host.appendChild(inspector.element)
    inspector.dispose()
    inspector.dispose()
    expect(inspector.element.parentNode).toBe(host)
    expect(() => inspector.update({title: "Next", apiName: "Nodes", route: "ui", owner: "ui", props: {}}))
      .toThrow("Nodes Props inspector is disposed")
  })

  test("has no UI component or source-viewer dependency", async () => {
    const source = await Bun.file(new URL("./props-inspector.ts", import.meta.url)).text()
    expect(source).toContain('from "@zavx0z/dom"')
    expect(source).not.toContain("@ui/components")
    expect(source).not.toContain("inspector.source")
    expect(source).not.toContain("typescriptSource")
    expect(source).not.toContain("className")
    expect(source).not.toContain(".nodes-props-inspector")
  })
})

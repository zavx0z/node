import type {
  Document,
  HTMLElement,
  Text,
} from "@zavx0z/dom"

export type NodesPropsInspectorSnapshot = Readonly<{
  title: string
  apiName: string
  route: string
  owner: string
  props: unknown
}>

export type NodesPropsInspector = Readonly<{
  element: HTMLElement
  update(snapshot: NodesPropsInspectorSnapshot): void
  dispose(): void
}>

type InspectorRow = Readonly<{
  element: HTMLElement
  name: Text
  value: Text
}>

export const nodesPropsInspectorCss = String.raw`
[data-node-props-inspector] {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #111111;
  border-radius: 4px;
  background: #1d1d1d;
  color: #d8d8d8;
  font-size: 11px;
}
[data-node-props-inspector] > header {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 48px;
  gap: 2px;
  padding: 7px 9px;
  border-bottom: 1px solid #111111;
  background: #303030;
}
[data-node-props-inspector] > header > h2,
[data-node-props-inspector] > header > span,
[data-node-props-inspector] > h3 {
  display: block;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
[data-node-props-inspector] > header > h2 { color: #e6e6e6; font-size: 12px; }
[data-node-props-inspector] > header > span { color: #999999; font-size: 10px; }
[data-node-props-inspector] > h3 {
  height: 26px;
  padding: 6px 8px;
  border-bottom: 1px solid #242424;
  background: #292929;
  font-size: 11px;
}
[data-node-props-inspector] > dl {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
}
[data-node-props-inspector] [data-prop-key] {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  min-height: 24px;
  border-bottom: 1px solid #262626;
}
[data-node-props-inspector] [data-prop-key] > dt,
[data-node-props-inspector] [data-prop-key] > dd {
  box-sizing: border-box;
  display: block;
  margin: 0;
  padding: 5px 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
[data-node-props-inspector] [data-prop-key] > dt { width: 38%; color: #999999; }
[data-node-props-inspector] [data-prop-key] > dd { width: 62%; color: #d8d8d8; }
`

export function createNodesPropsInspector(
  document: Document,
  initial: NodesPropsInspectorSnapshot,
): NodesPropsInspector {
  const root = document.createElement("aside")
  const header = document.createElement("header")
  const title = document.createElement("h2")
  const titleText = document.createTextNode("")
  const api = document.createElement("span")
  const apiText = document.createTextNode("")
  const sectionTitle = document.createElement("h3")
  const sectionTitleText = document.createTextNode("Props")
  const list = document.createElement("dl")
  const rows = new Map<string, InspectorRow>()
  let disposed = false

  root.setAttribute("data-node-props-inspector", "")
  root.setAttribute("aria-label", "Props inspector")
  title.appendChild(titleText)
  api.appendChild(apiText)
  header.append(title, api)
  sectionTitle.appendChild(sectionTitleText)
  root.append(header, sectionTitle, list)

  const update = (snapshot: NodesPropsInspectorSnapshot): void => {
    if (disposed) throw new Error("Nodes Props inspector is disposed")
    assertSnapshot(snapshot)
    titleText.data = snapshot.title
    apiText.data = `${snapshot.apiName} · /${snapshot.route}`
    root.title = snapshot.title
    root.setAttribute("data-story-route", snapshot.route)
    root.setAttribute("data-story-owner", snapshot.owner)
    reconcileRows(document, list, rows, inspectorEntries(snapshot))
  }

  update(initial)
  return Object.freeze({
    element: root,
    update,
    dispose() {
      if (disposed) return
      disposed = true
      rows.clear()
    },
  })
}

function inspectorEntries(
  snapshot: NodesPropsInspectorSnapshot,
): readonly Readonly<{key: string; name: string; value: string}>[] {
  const metadata = [
    {key: "meta:owner", name: "Владелец", value: snapshot.owner},
    {key: "meta:route", name: "Маршрут", value: snapshot.route === "" ? "/" : `/${snapshot.route}`},
    {key: "meta:api", name: "Компонент", value: snapshot.apiName},
  ]
  if (!snapshot.props || typeof snapshot.props !== "object" || Array.isArray(snapshot.props)) {
    return Object.freeze([...metadata, {key: "props:value", name: "value", value: formatValue(snapshot.props)}])
  }
  const props = Object.entries(snapshot.props).map(([name, value]) => ({
    key: `props:${name}`,
    name,
    value: formatValue(value),
  }))
  return Object.freeze(props.length === 0
    ? [...metadata, {key: "props:empty", name: "Props", value: "Нет значений"}]
    : [...metadata, ...props])
}

function reconcileRows(
  document: Document,
  parent: HTMLElement,
  rows: Map<string, InspectorRow>,
  entries: readonly Readonly<{key: string; name: string; value: string}>[],
): void {
  const retained = new Set(entries.map(({key}) => key))
  for (const [key, row] of rows) {
    if (retained.has(key)) continue
    row.element.remove()
    rows.delete(key)
  }
  for (const entry of entries) {
    let row = rows.get(entry.key)
    if (!row) {
      const element = document.createElement("div")
      const name = document.createElement("dt")
      const nameText = document.createTextNode("")
      const value = document.createElement("dd")
      const valueText = document.createTextNode("")
      element.setAttribute("data-prop-key", entry.key)
      name.appendChild(nameText)
      value.appendChild(valueText)
      element.append(name, value)
      row = Object.freeze({element, name: nameText, value: valueText})
      rows.set(entry.key, row)
    }
    row.name.data = entry.name
    row.value.data = entry.value
  }
  reconcileChildren(parent, entries.map(({key}) => rows.get(key)!.element))
}

function reconcileChildren(parent: HTMLElement, children: readonly HTMLElement[]): void {
  let reference = parent.firstChild
  for (const child of children) {
    if (child !== reference) parent.insertBefore(child, reference)
    reference = child.nextSibling
  }
  while (reference) {
    const next = reference.nextSibling
    parent.removeChild(reference)
    reference = next
  }
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value)
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (typeof value === "function") return "Function"
  try {
    const literal = JSON.stringify(value)
    if (literal === undefined) return String(value)
    return literal.length <= 180 ? literal : `${literal.slice(0, 177)}…`
  } catch {
    return Object.prototype.toString.call(value)
  }
}

function assertSnapshot(snapshot: NodesPropsInspectorSnapshot): void {
  if (!snapshot || typeof snapshot !== "object") throw new TypeError("Nodes Props inspector snapshot must be an object")
  for (const [name, value] of [
    ["title", snapshot.title],
    ["apiName", snapshot.apiName],
    ["route", snapshot.route],
    ["owner", snapshot.owner],
  ] as const) {
    if (typeof value !== "string") throw new TypeError(`Nodes Props inspector ${name} must be a string`)
  }
}

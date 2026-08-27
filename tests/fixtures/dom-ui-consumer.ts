import {createDocument} from "@zavx0z/dom"
import {
  createGraphCanvas,
  graphCanvasDefaultProps,
} from "@nodes/ui/graph-canvas"
import {
  createNodeWorkbench,
  type NodeWorkbenchProps,
} from "@nodes/ui/node-workbench"
import {
  createParameterSocket,
  parameterSocketDefaultProps,
} from "@nodes/ui/parameter-socket"
import {
  createNodeTreeEditor,
  nodeTreeEditorDefaultProps,
} from "@nodes/ui/node-tree-editor"

export const document = createDocument()
export const graph = createGraphCanvas(document, graphCanvasDefaultProps)
export const parameters = createParameterSocket(document, parameterSocketDefaultProps)
export const tree = createNodeTreeEditor(document, nodeTreeEditorDefaultProps)
export const workbenchProps: NodeWorkbenchProps = {
  title: "Public DOM Nodes",
  mode: "aggregate",
  showTree: true,
  showGraph: true,
  showParameters: true,
  tree: nodeTreeEditorDefaultProps,
  graph: graphCanvasDefaultProps,
  parameters: parameterSocketDefaultProps,
  images: [],
  popup: {visible: false, label: "", items: []},
}
export const workbench = createNodeWorkbench(document, workbenchProps)

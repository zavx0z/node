import {layoutPresentationCss} from "../../layout/dom/layout-presentation.ts"
import {workerProtocolCss} from "../../worker/dom/worker-protocol.ts"
import {graphCanvasCss} from "../../ui/dom/graph-canvas.ts"
import {multiNodeCanvasCss} from "../../ui/dom/multi-node-canvas.ts"
import {nodeTreeEditorCss} from "../../ui/dom/node-tree-editor.ts"
import {nodeWorkbenchCss} from "../../ui/dom/node-workbench.ts"
import {parameterSocketCss} from "../../ui/dom/parameter-socket.ts"
import {singleNodeCanvasCss} from "../../ui/dom/single-node-canvas.ts"

export const nodesDomStoryCss = [
  singleNodeCanvasCss,
  multiNodeCanvasCss,
  graphCanvasCss,
  parameterSocketCss,
  nodeTreeEditorCss,
  nodeWorkbenchCss,
  layoutPresentationCss,
  workerProtocolCss,
].join("\n")

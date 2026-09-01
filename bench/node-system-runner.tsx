import {
  Parameter,
  createNodeTree,
  createNodeTreeExternalStore,
  type NodeJsonValue,
} from "@nodes/core"
import {NodeTreeEditor} from "@nodes/editor"
import {
  NodeSystem,
  type NodeSystemParameterInput,
} from "@nodes/ui/node-system"
import {createDocument, type MutationBatch, type StateChangeBatch} from "@zavx0z/dom"
import {createDocumentRenderer, type RenderFrame} from "@zavx0z/renderer"
import {RendererWebGpuBackend} from "@zavx0z/renderer-webgpu"
import {createRoot, type ComponentRuntimeStats} from "@zavx0z/react"
import {TrueTypeFont} from "@engine/core"

type GeneralParameter = Parameter<NodeJsonValue, NodeJsonValue>

const count = readCount(process.argv.slice(2))
const font = await TrueTypeFont.fromUrl(import.meta.resolve("@engine/core/fonts/jetbrains-mono-bold.ttf"))
const fixtureStarted = performance.now()
const tree = createBenchmarkTree(count)
const fixtureMs = performance.now() - fixtureStarted
const editor = new NodeTreeEditor(tree)
if (process.argv.includes("--canonical-only")) {
  const started = performance.now()
  editor.addNode({expectedRevision: tree.revision, node: nodeDraft(count)})
  console.log(JSON.stringify({
    nodeCount: count,
    fixtureMs: round(fixtureMs),
    topologyMs: round(performance.now() - started),
    revision: tree.revision,
    topologyRevision: tree.topologyRevision,
  }, null, 2))
  editor.dispose()
  tree.dispose()
  process.exit(0)
}
let topologyPublicationStarted = 0
let topologyPublicationMs = 0
let topologyUiMs = 0
const unsubscribeBeforeTopologyProjection = tree.subscribeDelta(delta => {
  if (delta.kind === "topology") topologyPublicationStarted = performance.now()
})
const store = createNodeTreeExternalStore(tree)
const unsubscribeAfterTopologyProjection = tree.subscribeDelta(delta => {
  if (delta.kind !== "topology" || topologyPublicationStarted === 0) return
  topologyPublicationMs += performance.now() - topologyPublicationStarted
  topologyPublicationStarted = 0
})
const measuredStore = Object.freeze({
  ...store,
  subscribeTopology(listener: () => void) {
    return store.subscribeTopology(() => {
      const started = performance.now()
      listener()
      topologyUiMs += performance.now() - started
    })
  },
})
const document = createDocument()
const host = document.createElement("main")
const mutationBatches: MutationBatch[] = []
const stateChangeBatches: StateChangeBatch[] = []
const unsubscribeMutations = document.subscribeMutations(batch => mutationBatches.push(batch))
const unsubscribeStateChanges = document.subscribeStateChanges(batch => stateChangeBatches.push(batch))
const root = createRoot(host)
document.appendChild(host)
mutationBatches.length = 0
stateChangeBatches.length = 0
const viewport = Object.freeze({x: 0, y: 0, width: 850, height: 500, overscan: 0})
const onParameterInput = (change: NodeSystemParameterInput) => editor.setParameterValue({
  expectedRevision: tree.revision,
  nodeId: change.nodeId,
  parameterId: change.parameterId,
  value: change.value,
})

const mountStarted = performance.now()
root.render(<NodeSystem
  store={measuredStore}
  viewport={viewport}
  style={css`& { overflow: visible; }`}
  onParameterInput={onParameterInput}
/>)
const mountMs = performance.now() - mountStarted
const mountStats = root.stats()
const mountMutations = mutationSummary(mutationBatches)
const mountStateChanges = stateChangeSummary(stateChangeBatches)
const mountedLinkPaths = [...host.querySelectorAll("vector-path")]
mutationBatches.length = 0
stateChangeBatches.length = 0

const renderer = createDocumentRenderer({
  document,
  root: host,
  viewport: {width: 850, height: 500},
})
const initialRendererStarted = performance.now()
const initialFrame = renderer.flush()
const initialPathGeometry = pathGeometry(initialFrame)
const initialRendererMs = performance.now() - initialRendererStarted
const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})
const initialBackendStarted = performance.now()
backend.applyFrame(initialFrame)
const initialBackendMs = performance.now() - initialBackendStarted
const initialBackend = backend.diagnostics
const headerBackend = new RendererWebGpuBackend({invalidateGeometry() {}})
headerBackend.applyFrame(headerRectFrame(initialFrame))
const initialHeaderBackend = headerBackend.diagnostics

editor.addNode({expectedRevision: tree.revision, node: nodeDraft(count)})
const topologyWarmFrame = renderer.flush()
backend.applyFrame(topologyWarmFrame)
headerBackend.applyFrame(headerRectFrame(topologyWarmFrame))
topologyPublicationMs = 0
topologyUiMs = 0
topologyPublicationStarted = 0
mutationBatches.length = 0
stateChangeBatches.length = 0

const targetIndex = Math.min(count - 1, 101)
const targetNodeId = nodeId(targetIndex)
const stableNodeId = nodeId(targetIndex === 0 ? 1 : 0)
const targetArticle = requiredElement(host.querySelector(`[data-node-id="${targetNodeId}"]`), targetNodeId)
const stableArticle = requiredElement(host.querySelector(`[data-node-id="${stableNodeId}"]`), stableNodeId)
let warmedFrame = initialFrame
for (let warmup = 0; warmup < 3; warmup += 1) {
  editor.setParameterValue({
    expectedRevision: tree.revision,
    nodeId: targetNodeId,
    parameterId: "scale",
    value: targetIndex + 0.625 + warmup / 100,
  })
  warmedFrame = settleRenderer(renderer).frame
  backend.applyFrame(warmedFrame)
  headerBackend.applyFrame(headerRectFrame(warmedFrame))
}
mutationBatches.length = 0
stateChangeBatches.length = 0
const stableBox = warmedFrame.boxByNode.get(stableArticle)
const valueSamples: Array<Readonly<{
  commitMs: number
  rendererMs: number
  backendMs: number
  stats: ComponentRuntimeStats
  mutations: ReturnType<typeof mutationSummary>
  stateChanges: ReturnType<typeof stateChangeSummary>
  frame: RenderFrame
  flushes: number
}>> = []
for (let sample = 0; sample < 20; sample += 1) {
  const beforeStats = root.stats()
  const started = performance.now()
  editor.setParameterValue({
    expectedRevision: tree.revision,
    nodeId: targetNodeId,
    parameterId: "scale",
    value: targetIndex + 1 + sample / 100,
  })
  const commitMs = performance.now() - started
  const stats = statsDelta(beforeStats, root.stats())
  const mutations = mutationSummary(mutationBatches)
  const stateChanges = stateChangeSummary(stateChangeBatches)
  mutationBatches.length = 0
  stateChangeBatches.length = 0
  const rendererStarted = performance.now()
  const settled = settleRenderer(renderer)
  const rendererMs = performance.now() - rendererStarted
  const backendStarted = performance.now()
  backend.applyFrame(settled.frame)
  const backendMs = performance.now() - backendStarted
  headerBackend.applyFrame(headerRectFrame(settled.frame))
  valueSamples.push(Object.freeze({
    commitMs,
    rendererMs,
    backendMs,
    stats,
    mutations,
    stateChanges,
    frame: settled.frame,
    flushes: settled.flushes,
  }))
}
const valueUpdateMs = percentile(valueSamples.map(sample => sample.commitMs), 0.95)
const valueRendererMs = percentile(valueSamples.map(sample => sample.rendererMs), 0.95)
const valueBackendMs = percentile(valueSamples.map(sample => sample.backendMs), 0.95)
const valueStats = maxStats(valueSamples.map(sample => sample.stats))
const valueMutations = maxMutationSummary(valueSamples.map(sample => sample.mutations))
const valueStateChanges = maxStateChangeSummary(valueSamples.map(sample => sample.stateChanges))
const valueFrame = valueSamples[valueSamples.length - 1]!.frame
const valuePathGeometry = pathGeometry(valueFrame)
const valueBackend = backend.diagnostics
const valueHeaderBackend = headerBackend.diagnostics
const valueFlushes = Math.max(...valueSamples.map(sample => sample.flushes))
const valueDistribution = Object.freeze({
  samples: valueSamples.length,
  commitP50Ms: round(percentile(valueSamples.map(sample => sample.commitMs), 0.5)),
  commitP95Ms: round(valueUpdateMs),
  rendererP50Ms: round(percentile(valueSamples.map(sample => sample.rendererMs), 0.5)),
  rendererP95Ms: round(valueRendererMs),
  backendP50Ms: round(percentile(valueSamples.map(sample => sample.backendMs), 0.5)),
  backendP95Ms: round(valueBackendMs),
})

const offscreenIndex = count - 1
const beforeOffscreenStats = root.stats()
const beforeOffscreenFrame = renderer.flush()
const offscreenStarted = performance.now()
editor.setParameterValue({
  expectedRevision: tree.revision,
  nodeId: nodeId(offscreenIndex),
  parameterId: "scale",
  value: offscreenIndex + 0.875,
})
const offscreenValueUpdateMs = performance.now() - offscreenStarted
const offscreenStats = statsDelta(beforeOffscreenStats, root.stats())
const offscreenMutations = mutationSummary(mutationBatches)
const offscreenStateChanges = stateChangeSummary(stateChangeBatches)
mutationBatches.length = 0
stateChangeBatches.length = 0
const offscreenRendererStarted = performance.now()
const offscreenFrame = renderer.flush()
const offscreenRendererMs = performance.now() - offscreenRendererStarted
const offscreenBackendStarted = performance.now()
backend.applyFrame(offscreenFrame)
const offscreenBackendMs = performance.now() - offscreenBackendStarted
const offscreenBackend = backend.diagnostics

const beforeTopologyStats = root.stats()
const topologyStarted = performance.now()
editor.addNode({
  expectedRevision: tree.revision,
  node: nodeDraft(count + 1),
})
const topologyUpdateMs = performance.now() - topologyStarted
const topologyExternalStoreMs = Math.max(0, topologyPublicationMs - topologyUiMs)
const topologyEditorCoreMs = Math.max(0, topologyUpdateMs - topologyPublicationMs)
const topologyStats = statsDelta(beforeTopologyStats, root.stats())
const topologyMutations = mutationSummary(mutationBatches)
const topologyStateChanges = stateChangeSummary(stateChangeBatches)
mutationBatches.length = 0
stateChangeBatches.length = 0
const topologyRendererStarted = performance.now()
const topologySettled = settleRenderer(renderer)
const topologyFrame = topologySettled.frame
const topologyPathGeometry = pathGeometry(topologyFrame)
const topologyRendererMs = performance.now() - topologyRendererStarted
const topologyBackendStarted = performance.now()
backend.applyFrame(topologyFrame)
const topologyBackendMs = performance.now() - topologyBackendStarted
const topologyBackend = backend.diagnostics
headerBackend.applyFrame(headerRectFrame(topologyFrame))
const topologyHeaderBackend = headerBackend.diagnostics
const frame60Ms = 1_000 / 60
const frame90Ms = 1_000 / 90
const budgets = Object.freeze({
  frame60Ms: round(frame60Ms),
  frame90Ms: round(frame90Ms),
  coldMount: budgetResult(mountMs, frame60Ms * 8),
  initialRenderer: budgetResult(initialRendererMs, frame60Ms * 8),
  initialBackend: budgetResult(initialBackendMs, frame60Ms * 8),
  visibleValueCommit: budgetResult(valueUpdateMs, frame90Ms),
  visibleValueRenderer: budgetResult(valueRendererMs, frame60Ms),
  visibleValueBackend: budgetResult(valueBackendMs, frame60Ms),
  offscreenValueCommit: budgetResult(offscreenValueUpdateMs, frame90Ms),
  offscreenValueRenderer: budgetResult(offscreenRendererMs, frame90Ms),
  offscreenValueBackend: budgetResult(offscreenBackendMs, frame90Ms),
  topologyPublication: budgetResult(topologyUiMs, frame90Ms),
  topologyExternalStore: budgetResult(topologyExternalStoreMs, frame60Ms),
  topologyNodeSystemRenderer: budgetResult(topologyRendererMs, frame60Ms),
  totalEditorTopologyCommit: budgetResult(topologyUpdateMs, frame60Ms * (count <= 1_000 ? 1 : 2)),
})
const budgetPass = Object.values(budgets).every(value =>
  typeof value !== "object" || value === null || !("pass" in value) || value.pass === true)
const correctness = Object.freeze({
  retainedIdentities: host.querySelector(`[data-node-id="${targetNodeId}"]`) === targetArticle &&
    host.querySelector(`[data-node-id="${stableNodeId}"]`) === stableArticle,
  visibleSchedulerBounded: valueStats.renders <= 3,
  offscreenSchedulerSkipped: offscreenStats.renders === 0,
  topologyPublicationBounded: topologyStats.renders === 0,
  offscreenMutationsSkipped: offscreenMutations.records === 0 && offscreenStateChanges.records === 0,
  topologyMutationsSkipped: topologyMutations.records === 0 && topologyStateChanges.records === 0,
  rendererFrameReused: offscreenFrame === beforeOffscreenFrame && renderer.flush() === topologyFrame,
  backendPlanReused: offscreenBackend.rectPlanReused && topologyBackend.rectPlanReused,
  automaticInstancing: initialHeaderBackend.rectInstancedDraws === 1 && initialHeaderBackend.rectInstancedInstances === 6,
  oneSemanticPathPerVisibleLink: mountedLinkPaths.length === 8 &&
    mountedLinkPaths.every((path) => path.childNodes.length === 0),
  retainedPathIdentity: [...host.querySelectorAll("vector-path")].every((path, index) => path === mountedLinkPaths[index]),
  retainedPathGeometry: samePathGeometry(initialPathGeometry, valuePathGeometry) &&
    samePathGeometry(valuePathGeometry, topologyPathGeometry),
  pathBatching: initialBackend.pathDraws === 1 && initialBackend.pathInstancedDraws === 1 &&
    initialBackend.pathScalarDraws === 0 && initialBackend.pathStyles === 8 && initialBackend.pathSegments === 120,
  pathNoopUploads: offscreenBackend.pathStyleWriteBytes === 0 &&
    offscreenBackend.pathSegmentWriteBytes === 0 && offscreenBackend.pathOrderWriteBytes === 0 &&
    topologyBackend.pathStyleWriteBytes === 0 &&
    topologyBackend.pathSegmentWriteBytes === 0 && topologyBackend.pathOrderWriteBytes === 0,
})
const acceptance = Object.freeze({
  budgets: budgetPass,
  correctness: Object.values(correctness).every(Boolean),
  pass: budgetPass && Object.values(correctness).every(Boolean),
})

const result = Object.freeze({
  nodeCount: count,
  fixture: {
    ms: round(fixtureMs),
    heapBytes: process.memoryUsage().heapUsed,
  },
  mount: {
    ms: round(mountMs),
    stats: mountStats,
    mutations: mountMutations,
    stateChanges: mountStateChanges,
    materializedNodes: host.querySelectorAll("article").length,
    materializedLinks: mountedLinkPaths.length,
  },
  initialRenderer: {
    ms: round(initialRendererMs),
    boxes: initialFrame.boxes.length,
    displayItems: initialFrame.displayList.length,
    backendMs: round(initialBackendMs),
    backend: initialBackend,
    automaticHeaderInstancing: initialHeaderBackend,
  },
  valueUpdate: {
    ms: round(valueUpdateMs),
    stats: valueStats,
    mutations: valueMutations,
    stateChanges: valueStateChanges,
    distribution: valueDistribution,
    rendererMs: round(valueRendererMs),
    rendererFlushes: valueFlushes,
    backendMs: round(valueBackendMs),
    backend: valueBackend,
    automaticHeaderInstancing: valueHeaderBackend,
    retainedTarget: host.querySelector(`[data-node-id="${targetNodeId}"]`) === targetArticle,
    retainedStable: host.querySelector(`[data-node-id="${stableNodeId}"]`) === stableArticle,
    rendererStableBoxReused: valueFrame.boxByNode.get(stableArticle) === stableBox,
  },
  offscreenValueUpdate: {
    ms: round(offscreenValueUpdateMs),
    stats: offscreenStats,
    mutations: offscreenMutations,
    stateChanges: offscreenStateChanges,
    rendererMs: round(offscreenRendererMs),
    backendMs: round(offscreenBackendMs),
    backend: offscreenBackend,
    rendererFrameReused: offscreenFrame === beforeOffscreenFrame,
  },
  topologyUpdate: {
    ms: round(topologyUpdateMs),
    projectionMs: round(topologyPublicationMs),
    editorCoreMs: round(topologyEditorCoreMs),
    externalStoreMs: round(topologyExternalStoreMs),
    publicationMs: round(topologyUiMs),
    stats: topologyStats,
    mutations: topologyMutations,
    stateChanges: topologyStateChanges,
    rendererMs: round(topologyRendererMs),
    rendererFlushes: topologySettled.flushes,
    backendMs: round(topologyBackendMs),
    backend: topologyBackend,
    automaticHeaderInstancing: topologyHeaderBackend,
    retainedTarget: host.querySelector(`[data-node-id="${targetNodeId}"]`) === targetArticle,
    retainedStable: host.querySelector(`[data-node-id="${stableNodeId}"]`) === stableArticle,
    addedCanonicalNode: tree.nodes.some(node => node.id === nodeId(count + 1)),
    addedNodeCulled: host.querySelector(`[data-node-id="${nodeId(count + 1)}"]`) === null,
    rendererNoopFrameReused: renderer.flush() === topologyFrame,
  },
  automaticBackendInstancing: {
    applicable: initialHeaderBackend.rectActiveSlots >= 2,
    compatibleRectSlots: initialBackend.rectActiveSlots,
    instancedDraws: initialBackend.rectInstancedDraws,
    instancedInstances: initialBackend.rectInstancedInstances,
    headerCompatibleRectSlots: initialHeaderBackend.rectActiveSlots,
    reason: initialHeaderBackend.rectActiveSlots >= 2
      ? "safe compatible header Rect run available"
      : "NodeSystem Rects are clipped or interleaved; automatic safe instancing does not apply",
  },
  budgets,
  correctness,
  acceptance,
})

console.log(JSON.stringify(result, null, 2))

backend.dispose()
headerBackend.dispose()
renderer.dispose()
root.unmount()
unsubscribeMutations()
unsubscribeStateChanges()
unsubscribeBeforeTopologyProjection()
unsubscribeAfterTopologyProjection()
editor.dispose()
tree.dispose()
process.exit(acceptance.pass ? 0 : 1)

function createBenchmarkTree(nodeCount: number) {
  const nodes = Array.from({length: nodeCount}, (_, index) => nodeDefinition(index))
  const links = Array.from({length: Math.max(0, nodeCount - 1)}, (_, index) => Object.freeze({
    id: `link-${index}`,
    from: Object.freeze({nodeId: nodeId(index), socketId: "result"}),
    to: Object.freeze({nodeId: nodeId(index + 1), socketId: "source"}),
    metadata: Object.freeze({label: `Node ${index} → Node ${index + 1}`}),
  }))
  return createNodeTree<GeneralParameter>({nodes: Object.freeze(nodes), links: Object.freeze(links)})
}

function nodeDefinition(index: number) {
  const id = nodeId(index)
  return Object.freeze({
    id,
    metadata: nodeMetadata(index),
    parameters: Object.freeze([
      parameter("source-value", [index, index + 1, index + 2], "Source", "vector"),
      parameter("scale", index + 0.5, "Scale", "float", {min: 0, max: 20_000, step: 0.1}),
      parameter("enabled", index % 3 !== 0, "Enabled", "boolean"),
      parameter("result-value", null, "Result", "vector", {readOnly: true}),
    ]),
    sockets: Object.freeze([
      Object.freeze({
        id: "source",
        parameterId: "source-value",
        direction: "input" as const,
        side: "left" as const,
        valueType: valueType("vector"),
        metadata: Object.freeze({label: "Source"}),
      }),
      Object.freeze({
        id: "result",
        parameterId: "result-value",
        direction: "output" as const,
        side: "right" as const,
        valueType: valueType("vector"),
        metadata: Object.freeze({label: "Result"}),
      }),
    ]),
  })
}

function nodeDraft(index: number) {
  const definition = nodeDefinition(index)
  return Object.freeze({
    id: definition.id,
    metadata: definition.metadata,
    parameters: Object.freeze(definition.parameters.map(parameter => Object.freeze({
      id: parameter.id,
      value: parameter.value,
      presentation: parameter.presentation,
      ...(parameter.valueType === undefined ? {} : {valueType: parameter.valueType}),
    }))),
    sockets: definition.sockets,
  })
}

function nodeMetadata(index: number) {
  const columns = 100
  return Object.freeze({
    label: `General Node ${index}`,
    category: index % 2 === 0 ? "Transform" : "Compute",
    headerColor: index % 2 === 0 ? "rgb(72 101 122)" : "rgb(99 78 117)",
    x: index % columns * 292,
    y: Math.floor(index / columns) * 260,
    width: 260,
  })
}

function parameter(
  id: string,
  value: NodeJsonValue,
  label: string,
  typeId: string,
  presentation: Readonly<Record<string, NodeJsonValue>> = {},
): GeneralParameter {
  return new Parameter<NodeJsonValue, NodeJsonValue>(
    id,
    value,
    Object.freeze({label, ...presentation}),
    valueType(typeId),
  )
}

function valueType(id: string) {
  return Object.freeze({id, version: 1})
}

function nodeId(index: number): string {
  return `node-${index}`
}

function rectFrame(frame: RenderFrame): RenderFrame {
  return Object.freeze({
    ...frame,
    displayList: Object.freeze(frame.displayList.filter(item => item.kind === "rect")),
  })
}

function headerRectFrame(frame: RenderFrame): RenderFrame {
  return Object.freeze({
    ...frame,
    displayList: Object.freeze(frame.displayList.filter(item =>
      item.kind === "rect" && "localName" in item.node && item.node.localName === "header")),
  })
}

function pathGeometry(frame: RenderFrame): ReadonlyMap<object, object> {
  return new Map(frame.displayList.flatMap((item) => item.kind === "path"
    ? [[item.node as object, item.geometry as object] as const]
    : []))
}

function samePathGeometry(previous: ReadonlyMap<object, object>, next: ReadonlyMap<object, object>): boolean {
  return previous.size === next.size && [...previous].every(([node, geometry]) => next.get(node) === geometry)
}

function settleRenderer(renderer: Readonly<{flush(): RenderFrame}>): Readonly<{
  frame: RenderFrame
  flushes: number
}> {
  let frame = renderer.flush()
  let flushes = 1
  for (; flushes < 4; flushes += 1) {
    const next = renderer.flush()
    if (next === frame) return Object.freeze({frame, flushes})
    frame = next
  }
  throw new Error("Renderer did not settle within four flushes")
}

function mutationSummary(batches: readonly MutationBatch[]) {
  const records = batches.flatMap(batch => batch.records)
  return Object.freeze({
    batches: batches.length,
    records: records.length,
    attributes: records.filter(record => record.type === "attributes").length,
    characterData: records.filter(record => record.type === "characterData").length,
    childList: records.filter(record => record.type === "childList").length,
  })
}

function stateChangeSummary(batches: readonly StateChangeBatch[]) {
  const records = batches.flatMap(batch => batch.records)
  return Object.freeze({
    batches: batches.length,
    records: records.length,
    input: records.filter(record => record.type === "input").length,
  })
}

function statsDelta(before: ComponentRuntimeStats, after: ComponentRuntimeStats): ComponentRuntimeStats {
  return Object.freeze({
    disposes: after.disposes - before.disposes,
    mounts: after.mounts - before.mounts,
    moves: after.moves - before.moves,
    renders: after.renders - before.renders,
  })
}

function maxStats(samples: readonly ComponentRuntimeStats[]): ComponentRuntimeStats {
  return Object.freeze({
    disposes: Math.max(...samples.map(sample => sample.disposes)),
    mounts: Math.max(...samples.map(sample => sample.mounts)),
    moves: Math.max(...samples.map(sample => sample.moves)),
    renders: Math.max(...samples.map(sample => sample.renders)),
  })
}

function maxMutationSummary(samples: readonly ReturnType<typeof mutationSummary>[]) {
  return Object.freeze({
    batches: Math.max(...samples.map(sample => sample.batches)),
    records: Math.max(...samples.map(sample => sample.records)),
    attributes: Math.max(...samples.map(sample => sample.attributes)),
    characterData: Math.max(...samples.map(sample => sample.characterData)),
    childList: Math.max(...samples.map(sample => sample.childList)),
  })
}

function maxStateChangeSummary(samples: readonly ReturnType<typeof stateChangeSummary>[]) {
  return Object.freeze({
    batches: Math.max(...samples.map(sample => sample.batches)),
    records: Math.max(...samples.map(sample => sample.records)),
    input: Math.max(...samples.map(sample => sample.input)),
  })
}

function percentile(samples: readonly number[], quantile: number): number {
  if (samples.length === 0) throw new Error("A percentile requires at least one sample")
  const sorted = [...samples].sort((left, right) => left - right)
  const index = Math.max(0, Math.ceil(sorted.length * quantile) - 1)
  return sorted[index]!
}

function requiredElement<T>(value: T | null, id: string): T {
  if (value === null) throw new Error(`Benchmark did not materialize ${id}`)
  return value
}

function readCount(args: readonly string[]): number {
  const index = args.indexOf("--nodes")
  const value = index === -1 ? 1_000 : Number(args[index + 1])
  if (!Number.isSafeInteger(value) || value < 2) throw new Error("--nodes must be an integer >= 2")
  return value
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000
}

function budgetResult(actualMs: number, budgetMs: number) {
  return Object.freeze({
    actualMs: round(actualMs),
    budgetMs: round(budgetMs),
    pass: actualMs <= budgetMs,
  })
}

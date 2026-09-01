import {plugin} from "bun"
import {resolve} from "node:path"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"
import {TrueTypeFont} from "@engine/core"
import {createDocument, type HTMLElement} from "@zavx0z/dom"
import {
  createDocumentRenderer,
  type PathDisplayItem,
  type RenderFrame,
} from "@zavx0z/renderer"
import {RendererWebGpuBackend, type RendererWebGpuBackendDiagnostics} from "@zavx0z/renderer-webgpu"
import type {
  GraphCanvasController,
  GraphCanvasProps,
} from "@nodes/ui/graph-canvas"

const repositoryRoot = resolve(import.meta.dir, "..")
plugin(createTemplateJsxBunPlugin({
  persistent: true,
  cwd: repositoryRoot,
  sourceRoots: [
    resolve(repositoryRoot, "packages/ui"),
    resolve(repositoryRoot, "../ui/packages/components"),
  ],
}))
const {createGraphCanvas, graphCanvasCss, replaceGraphCanvasLink, replaceGraphCanvasLinks} = await import("@nodes/ui/graph-canvas")
const font = await TrueTypeFont.fromUrl(import.meta.resolve("@engine/core/fonts/inter-regular.ttf"))

const COUNTS = requestedCounts(process.argv.slice(2))
const SAMPLE_COUNT = 100
const FRAME_60_MS = 1_000 / 60

if (!process.argv.includes("--links")) runIsolatedScenarios()

const results = []

for (const count of COUNTS) results.push(await runScenario(count))

const report = Object.freeze({
  contract: "nodes-vector-path/1",
  sampleCount: SAMPLE_COUNT,
  frame60Ms: round(FRAME_60_MS),
  scenarios: Object.freeze(results),
  pass: results.every(({acceptance}) => acceptance.pass),
})
console.log(JSON.stringify(report, null, 2))
process.exit(report.pass ? 0 : 1)

function runIsolatedScenarios(): never {
  const scenarios: unknown[] = []
  let pass = true
  for (const count of COUNTS) {
    const child = Bun.spawnSync({
      cmd: [process.execPath, import.meta.path, "--links", String(count)],
      stdout: "pipe",
      stderr: "inherit",
      env: process.env,
    })
    const output = new TextDecoder().decode(child.stdout).trim()
    const result = JSON.parse(output) as Readonly<{pass: boolean; scenarios: readonly unknown[]}>
    scenarios.push(...result.scenarios)
    pass &&= child.exitCode === 0 && result.pass
  }
  console.log(JSON.stringify(Object.freeze({
    contract: "nodes-vector-path/1",
    sampleCount: SAMPLE_COUNT,
    frame60Ms: round(FRAME_60_MS),
    isolatedProcesses: true,
    scenarios: Object.freeze(scenarios),
    pass,
  }), null, 2))
  process.exit(pass ? 0 : 1)
}

async function runScenario(count: number) {
  const fixtureStart = performance.now()
  const document = createDocument()
  const graph = createGraphCanvas(document, graphProps(count))
  const host = graph.element
  const scene = graph.refs.scene
  document.appendChild(host)
  const fixtureMs = performance.now() - fixtureStart
  const renderer = createDocumentRenderer({
    document,
    root: host,
    viewport: {width: 1_200, height: 800},
    styleSheets: [graphCanvasCss],
  })
  const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})

  const initialRendererStart = performance.now()
  const initialFrame = renderer.flush()
  const initialRendererMs = performance.now() - initialRendererStart
  const initialBackendStart = performance.now()
  backend.applyFrame(initialFrame)
  const initialBackendMs = performance.now() - initialBackendStart
  const initialDiagnostics = backend.diagnostics
  const initialHeapBytes = await retainedHeapBytes()
  const initialRunOwner = backend.root.children.find(({name}) => name === "path-run:0")
  const initialPaths = pathItems(initialFrame)
  const expectedSegments = count * 15
  const targetIndex = Math.floor(count / 2)
  const alternateIndex = targetIndex + 1
  const targetId = `path-${targetIndex}`
  const targetElement = graph.linkRefs(targetId)!.element
  const alternateElement = graph.linkRefs(`path-${alternateIndex}`)!.element
  const initialGeometry = geometryByNode(initialPaths)

  warmup(() => measureFrame(renderer, backend))
  const stableSamples = samples(() => {
    const rendererStart = performance.now()
    const frame = renderer.flush()
    const rendererMs = performance.now() - rendererStart
    const backendStart = performance.now()
    backend.applyFrame(frame)
    return sample(0, rendererMs, performance.now() - backendStart, backend.diagnostics)
  })

  warmup((index) => {
    const commitStart = performance.now()
    graph.update({...graph.props, scene: {translateX: -index - 1, translateY: 0, scale: 1}})
    return measureFrame(renderer, backend, performance.now() - commitStart)
  })
  const transformSamples = samples((index) => {
    const commitStart = performance.now()
    graph.update({...graph.props, scene: {
      translateX: index + 1,
      translateY: index % 3,
      scale: index % 2 === 0 ? 1.01 : .99,
    }})
    return measureFrame(renderer, backend, performance.now() - commitStart)
  })
  const transformedFrame = renderer.flush()
  const transformedGeometry = geometryByNode(pathItems(transformedFrame))

  warmup((index) => {
    const commit = updateSelection(graph, targetIndex, alternateIndex, index === 0)
    return measureFrame(renderer, backend, commit.totalMs, commit.prepareMs, commit.publishMs)
  })
  const selectionSamples = samples((index) => {
    const commit = updateSelection(graph, targetIndex, alternateIndex, index % 2 === 0)
    return measureFrame(renderer, backend, commit.totalMs, commit.prepareMs, commit.publishMs)
  })
  updateSelection(graph, targetIndex, alternateIndex, false)
  const selectedFrame = renderer.flush()
  backend.applyFrame(selectedFrame)
  const selectedGeometry = geometryByNode(pathItems(selectedFrame))
  const selectedPaintLast = pathItems(selectedFrame).at(-1)?.node === alternateElement

  warmup((index) => {
    const commit = updateRoute(graph, Math.floor(count / 2), index + 1)
    return measureFrame(renderer, backend, commit.totalMs, commit.prepareMs, commit.publishMs)
  })
  const routeSamples = samples((index) => {
    const commit = updateRoute(graph, Math.floor(count / 2), index + 4)
    return measureFrame(renderer, backend, commit.totalMs, commit.prepareMs, commit.publishMs)
  })
  const routedFrame = renderer.flush()
  const routedGeometry = geometryByNode(pathItems(routedFrame))
  const changedRouteGeometries = changedGeometryCount(selectedGeometry, routedGeometry)
  const finalHeapBytes = process.memoryUsage().heapUsed
  const postGcRetainedHeapBytes = await retainedHeapBytes()
  const finalRunOwner = backend.root.children.find(({name}) => name === "path-run:0")

  const invariants = Object.freeze({
    oneSemanticElementPerLink: [...scene.children]
      .filter((element) => element.hasAttribute("data-link-id"))
      .every((element) => element.localName === "vector-path" && element.childNodes.length === 0),
    retainedTargetIdentity: graph.linkRefs(targetId)!.element === targetElement,
    retainedAlternateIdentity: graph.linkRefs(`path-${alternateIndex}`)!.element === alternateElement,
    mixedNodeCanvas: graph.props.frames.length === 1 && graph.props.nodes.length === 6 &&
      graph.props.nodes.every(({id}) => graph.nodeRefs(id)!.element.parentNode === scene),
    selectedPathPaintLast: selectedPaintLast,
    initialPathItems: initialPaths.length === count,
    oneSharedPathRun: initialDiagnostics.pathDraws === 1,
    opaqueInstancedFastPath: initialDiagnostics.pathInstancedDraws === 1 && initialDiagnostics.pathScalarDraws === 0,
    exactStyles: initialDiagnostics.pathStyles === count,
    exactHistoricalSegments: initialDiagnostics.pathSegments === expectedSegments,
    transformGeometryRetained: sameGeometry(initialGeometry, transformedGeometry),
    selectionGeometryRetained: sameGeometry(transformedGeometry, selectedGeometry),
    oneRouteGeometryChanged: changedRouteGeometries === 1,
    transformUploadsEmpty: uploadInvariant(transformSamples, {style: 0, segment: 0, order: 0}),
    selectionUploadsBounded: uploadInvariant(selectionSamples, {style: 8, segment: 0, order: expectedSegments * 4}),
    selectionPreparedBounded: selectionSamples.every(({diagnostics}) => diagnostics.pathPreparedItems <= 2),
    routeUploadsBounded: uploadInvariant(routeSamples, {style: 0, segment: 15 * 32, order: 0}),
    stableRunRetained: [...stableSamples, ...transformSamples, ...selectionSamples, ...routeSamples]
      .every(({diagnostics}) => diagnostics.pathDraws === 1 && diagnostics.pathStyles === count && diagnostics.pathSegments === expectedSegments),
    retainedRunOwner: initialRunOwner !== undefined && finalRunOwner === initialRunOwner,
  })
  const timing = Object.freeze({
    stable: distribution(stableSamples),
    transform: distribution(transformSamples),
    selection: distribution(selectionSamples),
    route: distribution(routeSamples),
  })
  const timingPass = [timing.stable, timing.transform, timing.selection, timing.route]
    .every(({totalP95Ms}) => totalP95Ms <= FRAME_60_MS)
  const acceptance = Object.freeze({
    invariants: Object.values(invariants).every(Boolean),
    timing: timingPass,
    pass: Object.values(invariants).every(Boolean) && timingPass,
  })

  backend.dispose()
  renderer.dispose()
  graph.dispose()

  return Object.freeze({
    name: count === 512 ? "dense-policy-512" : count === 2_048 ? "dense-policy-2048" : "synthetic-10000",
    links: count,
    expectedSampledSegments: expectedSegments,
    fixtureMs: round(fixtureMs),
    initial: Object.freeze({
      rendererMs: round(initialRendererMs),
      backendMs: round(initialBackendMs),
      diagnostics: initialDiagnostics,
      heapBytes: initialHeapBytes,
    }),
    timing,
    memory: Object.freeze({
      initialHeapBytes,
      finalHeapBytes,
      deltaHeapBytes: finalHeapBytes - initialHeapBytes,
      postGcRetainedHeapBytes,
      postGcRetainedDeltaHeapBytes: postGcRetainedHeapBytes - initialHeapBytes,
    }),
    invariants,
    acceptance,
  })
}

async function retainedHeapBytes(): Promise<number> {
  await Bun.sleep(0)
  Bun.gc(true)
  return process.memoryUsage().heapUsed
}

function graphProps(count: number): GraphCanvasProps {
  return Object.freeze({
    title: `Dense Path canvas ${count}`,
    width: 1_200,
    height: 830,
    scene: Object.freeze({translateX: 0, translateY: 0, scale: 1}),
    frames: Object.freeze([Object.freeze({
      id: "benchmark-frame",
      label: "Dense retained Links",
      title: "Dense retained Link benchmark frame",
      x: 8,
      y: 8,
      width: 1_184,
      height: 784,
      selected: false,
    })]),
    links: Object.freeze(Array.from({length: count}, (_, index) => linkDefinition(index, 0))),
    nodes: Object.freeze(Array.from({length: 6}, (_, index) => Object.freeze({
      id: `benchmark-node-${index}`,
      label: `Benchmark Node ${index}`,
      title: `Mixed DOM Node ${index}`,
      x: 60 + index * 190,
      y: 350 + index % 2 * 180,
      width: 150,
      height: 90,
      selected: false,
    }))),
  })
}

function updateSelection(
  graph: GraphCanvasController,
  targetIndex: number,
  alternateIndex: number,
  selectTarget: boolean,
): Readonly<{prepareMs: number; publishMs: number; totalMs: number}> {
  const prepareStart = performance.now()
  const target = graph.props.links[targetIndex]!
  const alternate = graph.props.links[alternateIndex]!
  if (target.selected === selectTarget && alternate.selected !== selectTarget) {
    return Object.freeze({prepareMs: 0, publishMs: 0, totalMs: 0})
  }
  const links = replaceGraphCanvasLinks(graph.props.links, [
    {index: targetIndex, link: {...target, selected: selectTarget}},
    {index: alternateIndex, link: {...alternate, selected: !selectTarget}},
  ])
  const prepareMs = performance.now() - prepareStart
  const publishStart = performance.now()
  graph.update({...graph.props, links})
  const publishMs = performance.now() - publishStart
  return Object.freeze({prepareMs, publishMs, totalMs: prepareMs + publishMs})
}

function updateRoute(
  graph: GraphCanvasController,
  targetIndex: number,
  routeRevision: number,
): Readonly<{prepareMs: number; publishMs: number; totalMs: number}> {
  const prepareStart = performance.now()
  const link = graph.props.links[targetIndex]!
  const links = replaceGraphCanvasLink(
    graph.props.links,
    targetIndex,
    linkDefinition(targetIndex, routeRevision, link.selected),
  )
  const prepareMs = performance.now() - prepareStart
  const publishStart = performance.now()
  graph.update({...graph.props, links})
  const publishMs = performance.now() - publishStart
  return Object.freeze({prepareMs, publishMs, totalMs: prepareMs + publishMs})
}

function linkDefinition(index: number, routeRevision: number, selected = false) {
  const row = index % 256
  const band = Math.floor(index / 256) % 8
  const y1 = 16 + row * 3
  const candidateY2 = 24 + ((row * 17 + band * 13) % 256) * 3
  const y2 = Math.abs(candidateY2 - y1) > 20
    ? candidateY2
    : y1 + (y1 < 740 ? 30 : -30)
  const x1 = 20 + band * 7
  const x2 = 1_160 - band * 5 + routeRevision
  const middleX = 560 + index % 11
  return Object.freeze({
    id: `path-${index}`,
    title: `Path ${index}`,
    kind: index % 3 === 0 ? "vector" as const : index % 3 === 1 ? "float" as const : "color" as const,
    selected,
    route: Object.freeze({
      kind: "orthogonal" as const,
      points: Object.freeze([
        Object.freeze({x: x1, y: y1}),
        Object.freeze({x: middleX, y: y1}),
        Object.freeze({x: middleX, y: y2}),
        Object.freeze({x: x2, y: y2}),
      ]),
    }),
  })
}

function measureFrame(
  renderer: Readonly<{flush(): RenderFrame}>,
  backend: RendererWebGpuBackend,
  commitMs = 0,
  prepareMs = 0,
  publishMs = commitMs,
) {
  const rendererStart = performance.now()
  const frame = renderer.flush()
  const rendererMs = performance.now() - rendererStart
  const backendStart = performance.now()
  backend.applyFrame(frame)
  return sample(commitMs, rendererMs, performance.now() - backendStart, backend.diagnostics, prepareMs, publishMs)
}

function samples(run: (index: number) => ReturnType<typeof sample>): readonly ReturnType<typeof sample>[] {
  const result = []
  for (let index = 0; index < SAMPLE_COUNT; index += 1) result.push(run(index))
  return Object.freeze(result)
}

function warmup(run: (index: number) => unknown): void {
  for (let index = 0; index < 3; index += 1) run(index)
}

function sample(
  commitMs: number,
  rendererMs: number,
  backendMs: number,
  diagnostics: RendererWebGpuBackendDiagnostics,
  prepareMs = 0,
  publishMs = commitMs,
) {
  return Object.freeze({commitMs, prepareMs, publishMs, rendererMs, backendMs, totalMs: commitMs + rendererMs + backendMs, diagnostics})
}

function distribution(values: readonly ReturnType<typeof sample>[]) {
  return Object.freeze({
    commitP50Ms: round(percentile(values.map(({commitMs}) => commitMs), .5)),
    commitP95Ms: round(percentile(values.map(({commitMs}) => commitMs), .95)),
    commitP99Ms: round(percentile(values.map(({commitMs}) => commitMs), .99)),
    prepareP95Ms: round(percentile(values.map(({prepareMs}) => prepareMs), .95)),
    publishP95Ms: round(percentile(values.map(({publishMs}) => publishMs), .95)),
    rendererP50Ms: round(percentile(values.map(({rendererMs}) => rendererMs), .5)),
    rendererP95Ms: round(percentile(values.map(({rendererMs}) => rendererMs), .95)),
    rendererP99Ms: round(percentile(values.map(({rendererMs}) => rendererMs), .99)),
    backendP50Ms: round(percentile(values.map(({backendMs}) => backendMs), .5)),
    backendP95Ms: round(percentile(values.map(({backendMs}) => backendMs), .95)),
    backendP99Ms: round(percentile(values.map(({backendMs}) => backendMs), .99)),
    totalP50Ms: round(percentile(values.map(({totalMs}) => totalMs), .5)),
    totalP95Ms: round(percentile(values.map(({totalMs}) => totalMs), .95)),
    totalP99Ms: round(percentile(values.map(({totalMs}) => totalMs), .99)),
    maxWrites: Object.freeze({
      styleBytes: Math.max(...values.map(({diagnostics}) => diagnostics.pathStyleWriteBytes)),
      segmentBytes: Math.max(...values.map(({diagnostics}) => diagnostics.pathSegmentWriteBytes)),
      orderBytes: Math.max(...values.map(({diagnostics}) => diagnostics.pathOrderWriteBytes)),
    }),
  })
}

function pathItems(frame: RenderFrame): readonly PathDisplayItem[] {
  return frame.displayList.filter((item): item is PathDisplayItem => item.kind === "path")
}

function geometryByNode(paths: readonly PathDisplayItem[]): ReadonlyMap<HTMLElement, PathDisplayItem["geometry"]> {
  return new Map(paths.map(({node, geometry}) => [node as HTMLElement, geometry]))
}

function sameGeometry(
  previous: ReadonlyMap<HTMLElement, PathDisplayItem["geometry"]>,
  next: ReadonlyMap<HTMLElement, PathDisplayItem["geometry"]>,
): boolean {
  return previous.size === next.size && [...previous].every(([node, geometry]) => next.get(node) === geometry)
}

function changedGeometryCount(
  previous: ReadonlyMap<HTMLElement, PathDisplayItem["geometry"]>,
  next: ReadonlyMap<HTMLElement, PathDisplayItem["geometry"]>,
): number {
  let changed = 0
  for (const [node, geometry] of previous) if (next.get(node) !== geometry) changed += 1
  return changed
}

function uploadInvariant(
  values: readonly ReturnType<typeof sample>[],
  expected: Readonly<{style: number; segment: number; order: number}>,
): boolean {
  return values.every(({diagnostics}) =>
    diagnostics.pathStyleWriteBytes <= expected.style &&
    diagnostics.pathSegmentWriteBytes <= expected.segment &&
    diagnostics.pathOrderWriteBytes <= expected.order)
}

function percentile(values: readonly number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)]!
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000
}

function requestedCounts(args: readonly string[]): readonly number[] {
  const index = args.indexOf("--links")
  if (index === -1) return Object.freeze([512, 2_048, 10_000])
  const value = Number(args[index + 1])
  if (![512, 2_048, 10_000].includes(value)) throw new Error("--links must be 512, 2048 or 10000")
  return Object.freeze([value])
}

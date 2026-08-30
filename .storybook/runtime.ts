import {Node, type Document, type HTMLElement} from "@zavx0z/dom"

export type NodesExternalStorySource = Readonly<{
  html: string
  typescript: string
}>

export type NodesExternalComponentRoot = Readonly<{
  readStyleSheets(): unknown
}>

export type NodesExternalStory = Readonly<{
  element: HTMLElement
  componentRoot: NodesExternalComponentRoot
  readonly props?: unknown
  source(): NodesExternalStorySource
  ready?(): Promise<void>
  dispose(): void
}>

type NodesExternalStoryFactory = (
  document: Document,
  route: string,
) => NodesExternalStory | Promise<NodesExternalStory>

type NodesExternalRuntimeContext = Readonly<{
  document: Document
  signal: AbortSignal
  present(value: Readonly<{
    protocol: "story-presentation/1"
    node: Node
    componentRoot: NodesExternalComponentRoot
    source: NodesExternalStorySource
    values: Readonly<{props: unknown}>
  }>): void
  reportDiagnostic(value: unknown): void
}>

type NodesExternalStoryInput = Readonly<{
  route: string
  story: unknown
  signal: AbortSignal
}>

/** Creates one plain structural adapter without importing Storybook. */
export function createNodesExternalRuntime() {
  return Object.freeze({
    protocol: "storybook-runtime/3",
    create(context: NodesExternalRuntimeContext) {
      let current: NodesExternalStory | null = null
      let interactionTarget: HTMLElement | null = null
      let disposed = false

      const publish = (): void => {
        if (current === null) return
        context.present(Object.freeze({
          protocol: "story-presentation/1",
          node: current.element,
          componentRoot: current.componentRoot,
          source: current.source(),
          values: Object.freeze({props: current.props ?? null}),
        }))
      }
      const onInteraction = (): void => publish()
      const unmount = async (): Promise<void> => {
        if (current === null) return
        if (interactionTarget !== null) {
          interactionTarget.removeEventListener("click", onInteraction)
          interactionTarget.removeEventListener("input", onInteraction)
          interactionTarget.removeEventListener("change", onInteraction)
        }
        const previous = current
        current = null
        interactionTarget = null
        previous.dispose()
      }
      const mount = async (input: NodesExternalStoryInput): Promise<void> => {
        if (disposed) throw new Error("Nodes external runtime is disposed")
        await unmount()
        if (input.signal.aborted || context.signal.aborted) return
        if (typeof input.story !== "function") {
          throw new TypeError(`Nodes story export must be a factory: ${input.route}`)
        }
        const story = await (input.story as NodesExternalStoryFactory)(context.document, input.route)
        if (input.signal.aborted || context.signal.aborted) {
          story.dispose()
          return
        }
        if (!(story.element instanceof Node) || story.element.ownerDocument !== context.document) {
          story.dispose()
          throw new Error(`Nodes story returned a foreign DOM node: ${input.route}`)
        }
        if (typeof story.dispose !== "function") {
          throw new TypeError(`Nodes story has no dispose lifecycle: ${input.route}`)
        }
        if (story.componentRoot === null || typeof story.componentRoot !== "object" ||
          typeof story.componentRoot.readStyleSheets !== "function") {
          story.dispose()
          throw new TypeError(`Nodes story returned no component stylesheet root: ${input.route}`)
        }
        if (typeof story.source !== "function") {
          story.dispose()
          throw new TypeError(`Nodes story returned no required source: ${input.route}`)
        }
        if (story.ready !== undefined) await story.ready()
        if (input.signal.aborted || context.signal.aborted) {
          story.dispose()
          return
        }
        current = story
        interactionTarget = story.element
        interactionTarget.addEventListener("click", onInteraction)
        interactionTarget.addEventListener("input", onInteraction)
        interactionTarget.addEventListener("change", onInteraction)
        publish()
      }

      return Object.freeze({
        mount,
        update: mount,
        unmount,
        async dispose() {
          if (disposed) return
          disposed = true
          await unmount()
        },
      })
    },
  })
}

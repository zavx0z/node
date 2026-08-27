import {type Object3D} from "@engine/core"
import {UiSurface} from "@layout/core/surface"
import {clearReadOnlyTextParticipants} from "@ui/elements/input"
import {
  drawStorybookPreviewChrome,
  planStorybookPreviewContent,
} from "@zavx0z/storybook/workbench"
import type {
  StorybookStoryArgs,
  StorybookStoryModule,
} from "@zavx0z/storybook/stories"
import type {NodesStoryDescriptor} from "./stories.ts"

export class NodesStoryPreviewSurface extends UiSurface {
  readonly #previewParent: Object3D
  #descriptor: NodesStoryDescriptor | null = null
  #module: StorybookStoryModule | null = null
  #args: StorybookStoryArgs = Object.freeze({})
  #signature = ""

  constructor() {
    super({bgColor: null, borderColor: null})
    this.node.name = "NodesStoryPreviewSurface"
    this.#previewParent = this.createRetainedParent()
    this.#previewParent.name = "NodesStoryPreviewSurface.preview"
  }

  setStory(
    descriptor: NodesStoryDescriptor,
    module: StorybookStoryModule,
    args: StorybookStoryArgs,
  ): void {
    if (this.#descriptor?.route !== descriptor.route) clearReadOnlyTextParticipants(this)
    this.#descriptor = descriptor
    this.#module = module
    this.#args = args
    this.#signature = ""
    this.requestRender()
  }

  setArgs(args: StorybookStoryArgs): void {
    this.#args = args
    this.requestRender()
  }

  protected override render(): void {
    const descriptor = this.#descriptor
    const module = this.#module
    if (descriptor === null || module === null) return
    const signature = `${descriptor.route}:${JSON.stringify(this.#args)}:${this.rectW}:${this.rectH}:${this.pixelScale}`
    if (signature === this.#signature) return
    this.materializeRetainedParent(this.#previewParent, () => {
      const chrome = {
        title: descriptor.title,
        description: `${descriptor.primary.label} · ${descriptor.apiName}`,
      }
      drawStorybookPreviewChrome(this, this.rectW, this.rectH, chrome)
      module.render(
        this,
        this.#args,
        planStorybookPreviewContent(this.rectW, this.rectH, chrome),
      )
    })
    this.#signature = signature
  }
}

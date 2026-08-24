import {planStorybookShell, type StorybookShellFrames} from "@ui/storybook/layout"

export const EDITOR_COMPACT_WIDTH = 980
export const EDITOR_DOCK_HEIGHT = 220

export function planEditorWorkbench(width: number, height: number): StorybookShellFrames {
  return planStorybookShell(width, height, {
    dockHeight: EDITOR_DOCK_HEIGHT,
    ...(width < EDITOR_COMPACT_WIDTH ? {collapsed: ["catalog", "section", "info"]} : {}),
  })
}

import {Pane} from "@ui/components/pane"
import {Typography} from "@ui/components/typography"
import {flexColumn, flexRow} from "@layout/core/flex"
import {defineStorybookStoryModule, type StorybookStoryModule} from "@zavx0z/storybook/stories"

export type NodesOverviewItem = Readonly<{
  label: string
  route: string
}>

export function createNodesOverviewStory(input: Readonly<{
  title: string
  summary: string
  items: readonly NodesOverviewItem[]
}>): StorybookStoryModule {
  return defineStorybookStoryModule({
    defaultArgs: {},
    controls: [],
    render(surface, _args, frame) {
      const columns = frame.w < 620 ? 1 : frame.w < 1080 ? 2 : 3
      const rows = chunk(input.items, columns)
      const summaryH = 34
      const gridY = frame.y + summaryH
      const gridH = Math.max(0, frame.h - summaryH)
      Typography(surface, frame.x, frame.y, frame.w, 24, {
        children: input.summary,
        variant: "caption",
        color: "muted",
      })
      flexColumn({
        x: frame.x,
        y: gridY,
        w: frame.w,
        h: gridH,
        gap: 10,
        items: rows.map((row) => ({
          height: "1fr" as const,
          draw: (rowX: number, rowY: number, rowW: number, rowH: number) => flexRow({
            x: rowX,
            y: rowY,
            w: rowW,
            h: rowH,
            gap: 10,
            items: Array.from({length: columns}, (_, column) => {
              const item = row[column]
              if (item === undefined) return {width: "1fr" as const, height: rowH, draw: () => {}}
              return {
                width: "1fr" as const,
                height: rowH,
                draw: (x: number, y: number, w: number, h: number) => {
                  Pane(surface, x, y, w, h, {variant: "outlined", style: {borderRadius: 10}})
                  Typography(surface, x + 14, y + 12, w - 28, 24, {
                    children: item.label,
                    variant: "title",
                  })
                  Typography(surface, x + 14, y + 40, w - 28, 20, {
                    children: `/${item.route}/`,
                    variant: "caption",
                    color: "muted",
                  })
                },
              }
            }),
          }),
        })),
      })
    },
    source() {
      const typescript = [
        `export const title = ${JSON.stringify(input.title)}`,
        "",
        "export const sections = [",
        ...input.items.map(({label, route}) => `  {label: ${JSON.stringify(label)}, route: ${JSON.stringify(route)}},`),
        "] as const",
      ].join("\n")
      return Object.freeze({
        html: `<section class="nodes-overview">
  <p class="nodes-overview__summary">${escapeHtml(input.summary)}</p>
  <nav class="nodes-overview__items" aria-label="${escapeHtml(input.title)}">
${input.items.map(({label, route}) => `    <a href="/${route}/">${escapeHtml(label)}</a>`).join("\n")}
  </nav>
</section>`,
        css: `.nodes-overview {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 10px;
}

.nodes-overview__summary {
  flex: 0 0 24px;
  margin: 0;
}

.nodes-overview__items {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}`,
        typescript,
      })
    },
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function chunk<T>(values: readonly T[], size: number): readonly (readonly T[])[] {
  const rows: T[][] = []
  for (let index = 0; index < values.length; index += size) rows.push(values.slice(index, index + size))
  return rows
}

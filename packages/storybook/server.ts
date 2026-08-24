import {join} from "node:path"
import {fileURLToPath} from "node:url"
import {startStorybookHubServer} from "@ui/storybook/server"
import {createNodesStorybookPages} from "./server/page-registry.ts"

const server = startStorybookHubServer({
  pages: createNodesStorybookPages(),
  hostname: Bun.env.NODES_STORYBOOK_HOST ?? "127.0.0.1",
  port: Number(Bun.env.NODES_STORYBOOK_PORT ?? 4018),
  staticFiles: {
    "/fonts/jetbrains-mono-bold.ttf": fileURLToPath(import.meta.resolve("@engine/core/fonts/jetbrains-mono-bold.ttf")),
    "/references/blender-4.5.5-reference.png": join(
      import.meta.dir,
      "assets/references/blender-4.5.5-reference.png",
    ),
  },
})

console.log(`[nodes storybook catalog] ${server.url}`)

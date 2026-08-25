import {join} from "node:path"
import {fileURLToPath} from "node:url"
import {startStorybookHubServer} from "@zavx0z/storybook/server"
import {createNodesStorybookApp} from "./server/page-registry.ts"

const server = startStorybookHubServer({
  app: createNodesStorybookApp(),
  hostname: Bun.env.NODES_STORYBOOK_HOST ?? "127.0.0.1",
  port: Number(Bun.env.NODES_STORYBOOK_PORT ?? 4018),
  staticFiles: [
    {
      publicPath: "/fonts/jetbrains-mono-bold.ttf",
      sourcePath: fileURLToPath(import.meta.resolve("@engine/core/fonts/jetbrains-mono-bold.ttf")),
    },
    {
      publicPath: "/references/blender-4.5.5-reference.png",
      sourcePath: join(
        import.meta.dir,
        "assets/references/blender-4.5.5-reference.png",
      ),
    },
  ],
})

console.log(`[nodes storybook catalog] ${server.url}`)

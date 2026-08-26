import {join} from "node:path"
import {fileURLToPath} from "node:url"
import {startStorybookPackageServer} from "@zavx0z/storybook/server"
import {createNodesStorybookApp} from "./server/page-registry.ts"

startStorybookPackageServer({
  app: createNodesStorybookApp(),
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

import {plugin} from "bun"
import {resolve} from "node:path"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"

const repositoryRoot = resolve(import.meta.dir, "..")

plugin(createTemplateJsxBunPlugin({
  persistent: true,
  cwd: repositoryRoot,
  sourceRoots: [
    resolve(repositoryRoot, "bench"),
    resolve(repositoryRoot, "packages/ui"),
  ],
}))

await import("./node-system-runner.tsx")

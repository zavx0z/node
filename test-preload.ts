import {plugin} from "bun"
import {resolve} from "node:path"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"

plugin(createTemplateJsxBunPlugin({
  persistent: true,
  sourceRoots: [
    resolve(import.meta.dir, "packages/ui"),
    resolve(import.meta.dir, "packages/storybook"),
    resolve(import.meta.dir, "../ui/packages/components"),
  ],
}))

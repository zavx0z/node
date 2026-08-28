import {join, resolve} from "node:path"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"

const output = process.argv[2]
if (!output) throw new Error("build-proof requires an output directory")

const packagesRoot = resolve(import.meta.dir, "../..")
const repositoryRoot = resolve(packagesRoot, "..")
const result = await Bun.build({
  entrypoints: [join(packagesRoot, "storybook/app/dom-entry.ts")],
  root: repositoryRoot,
  outdir: output,
  target: "browser",
  format: "esm",
  splitting: true,
  plugins: [createTemplateJsxBunPlugin({
    cwd: repositoryRoot,
    sourceRoots: [
      join(packagesRoot, "ui"),
      join(packagesRoot, "storybook"),
      resolve(packagesRoot, "../../ui/packages/components"),
    ],
  })],
})

if (!result.success) {
  for (const log of result.logs) console.error(log.message)
  process.exit(1)
}

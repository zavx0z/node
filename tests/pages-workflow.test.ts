import {describe, expect, test} from "bun:test"
import {join} from "node:path"
import {fileURLToPath} from "node:url"

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url))
const workflowPath = join(repositoryRoot, ".github/workflows/pages.yml")

describe("Nodes Storybook Pages cold bootstrap", () => {
  test("pins and registers every direct linked Storybook dependency before Nodes", async () => {
    const workflow = await Bun.file(workflowPath).text()
    for (const [repository, revision] of [
      ["zavx0z/engine", "ae461b8ab622d391247c714f3937f18bd5b4ae45"],
      ["zavx0z/layout", "c97bc83b935ae1299c3db304c35483bb30f6de80"],
      ["zavx0z/ui", "74f5e7a8d3defb06787b6975dd672f5c1cba89fc"],
      ["zavx0z/highlighter", "a9f240b682a6ccec042ea04522220f153d3b53eb"],
      ["zavx0z/storybook", "bbacaa721b9327dc771f348f017bd6e0a7cef3df"],
    ] as const) {
      expect(workflow).toContain(`repository: ${repository}\n          ref: ${revision}`)
    }

    const elementsLink = "(cd ui/packages/elements && bun link)"
    const componentsLink = "(cd ui/packages/components && bun link)"
    const nodesInstall = `working-directory: node
        run: bun install --frozen-lockfile`
    const nodesCheck = `working-directory: node
        run: bun run check`

    for (const required of [
      elementsLink,
      componentsLink,
      nodesInstall,
      nodesCheck,
    ]) expect(workflow, required).toContain(required)

    expect(workflow).not.toContain("ui/packages/storybook")
    const bootstrap = [
      "name: Register Engine link",
      "name: Register Layout link",
      "name: Register UI links",
      "name: Install and verify Highlighter dependency",
      "name: Register Highlighter link",
      "name: Install Storybook infrastructure dependencies",
      "name: Register Storybook infrastructure link",
      "name: Install Layout workspace",
      "name: Install UI workspace",
      "name: Install locked Nodes dependencies",
      "name: Verify and build static Storybook",
    ].map((marker) => workflow.indexOf(marker))
    expect(bootstrap.every((position) => position >= 0)).toBeTrue()
    expect(bootstrap).toEqual([...bootstrap].sort((left, right) => left - right))
  })
})

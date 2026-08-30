import {describe, expect, test} from "bun:test"
import {createHash} from "node:crypto"
import {existsSync, readFileSync} from "node:fs"
import {dirname, extname, join, resolve} from "node:path"

const root = resolve(import.meta.dir, "..")
const owners = ["core", "editor", "layout", "worker", "ui"] as const
const manifestSchema = "https://raw.githubusercontent.com/zavx0z/storybook/main/schemas/manifest.schema.json"
const catalogSchema = "https://raw.githubusercontent.com/zavx0z/storybook/main/schemas/catalog.schema.json"

describe("Nodes external Storybook declarations", () => {
  test("preserves the exact 159-leaf baseline across five package owners", async () => {
    const baseline = await json(".storybook/route-baseline.json")
    const declared = (await Promise.all(owners.map(async (owner) => {
      const catalog = await catalogFor(owner)
      return catalog.categories.flatMap((category) => category.subjects.flatMap((subject) =>
        subject.variants.map((variant) => variant.route)))
    }))).flat()

    expect(baseline.leafRoutes).toHaveLength(159)
    expect(declared).toHaveLength(159)
    expect(declared).toEqual(baseline.leafRoutes)
    expect(routeDigest(declared)).toBe(baseline.hashes.leafRoutes)
    expect(new Set(declared).size).toBe(declared.length)
  })

  test("preserves every old overview or records the exact section-to-subject remap", async () => {
    const baseline = await json(".storybook/route-baseline.json") as RouteBaseline
    const remap = await json(".storybook/overview-remap.json") as OverviewRemap
    const semantic = new Map<string, Set<string>>()
    for (const owner of owners) {
      const catalog = await catalogFor(owner)
      semantic.set(`@nodes/${owner}`, new Set([
        "",
        ...catalog.categories.flatMap((category) => [
          category.route,
          ...category.subjects.map((subject) => subject.route),
        ]),
      ]))
    }
    const preserved = new Set([...semantic.values()].flatMap((routes) => [...routes]))
    const remaps = new Map(remap.remaps.map((entry): readonly [string, OverviewRemapEntry] => [entry.from, entry]))
    for (const route of baseline.overviewRoutes) {
      if (preserved.has(route)) continue
      const entry = remaps.get(route)
      expect(entry, route).toBeDefined()
      if (entry === undefined) throw new Error(`Overview remap is missing: ${route}`)
      expect(semantic.get(entry.packageId)?.has(entry.to), route).toBeTrue()
    }
    expect([...remaps.keys()].sort()).toEqual([
      "",
      "layout/adaptive/compound",
      "layout/adaptive/shared",
      "layout/coffman-graham/default",
      "layout/dagre-layered/default",
      "layout/fixed/baseline",
      "ui",
    ])
    expect(remap.law).toContain("section prefixes remain variant grouping metadata")
  })

  test("keeps package manifests structural and module exports owner-local", async () => {
    const project = await json(".storybook/manifest.json")
    expect(project).toMatchObject({schemaVersion: 1, kind: "project", id: "nodes"})
    expect(project.$schema).toBe(manifestSchema)
    expect(project.packages).toHaveLength(5)

    for (const owner of owners) {
      const packageRoot = join(root, "packages", owner)
      const manifest = await json(`packages/${owner}/.storybook/manifest.json`)
      expect(manifest).toMatchObject({
        schemaVersion: 1,
        kind: "package",
        id: `@nodes/${owner}`,
        packageJson: "../package.json",
        runtime: {module: "./runtime.ts", export: "runtime"},
        catalog: "./catalog.json",
      })
      expect(manifest.$schema).toBe(manifestSchema)
      const expectedAuthorStyleSheets = owner === "core" || owner === "editor" || owner === "ui"
        ? [
          {specifier: "@ui/components/theme.css"},
          {specifier: "@nodes/ui/dom.css"},
        ]
        : owner === "layout"
          ? [{specifier: "@nodes/layout/layout-presentation.css"}]
          : [{specifier: "@nodes/worker/worker-protocol.css"}]
      expect(manifest.authorStyleSheets).toEqual(expectedAuthorStyleSheets)
      expect(Object.hasOwn(manifest, "widgetContributions")).toBeFalse()
      const packageJson = await json(`packages/${owner}/package.json`)
      expect(packageJson.name).toBe(manifest.id)
      expect(packageJson.exports).not.toHaveProperty("./storybook")
      expect(packageJson.exports).not.toHaveProperty("./.storybook")
      await expectModuleExport(
        resolve(packageRoot, ".storybook", manifest.runtime.module),
        manifest.runtime.export,
      )
      const catalog = await catalogFor(owner)
      expect((catalog as Catalog & {$schema?: string}).$schema).toBe(catalogSchema)
      for (const category of catalog.categories) {
        expect(category).not.toHaveProperty("sections")
        for (const subject of category.subjects) {
          expect(subject).not.toHaveProperty("sections")
          expect(subject.presentation).toEqual({
            protocol: "story-presentation/1",
            projection: "display",
            widgets: ["props", "source", "diagnostics"],
          })
          for (const variant of subject.variants) {
            expect(Object.hasOwn(variant, "presentation"), variant.route).toBeFalse()
            const path = resolve(packageRoot, ".storybook", variant.module.path)
            expect(path.startsWith(packageRoot), `${owner}: ${path}`).toBeTrue()
            await expectModuleExport(path, variant.module.export)
          }
        }
      }
    }
  })

  test("uses package-level story factories instead of per-variant wrappers or a giant switch", async () => {
    const expectedModuleCounts = {core: 1, editor: 1, layout: 1, worker: 1, ui: 2}
    for (const owner of owners) {
      const catalog = await catalogFor(owner)
      const modules = new Set(catalog.categories.flatMap((category) => category.subjects.flatMap((subject) =>
        subject.variants.map((variant) => `${variant.module.path}#${variant.module.export}`))))
      expect(modules.size, owner).toBe(expectedModuleCounts[owner])
      expect([...modules].some((module) => /variant|route-[0-9]+/u.test(module)), owner).toBeFalse()
    }
  })

  test("moves accepted Blender evidence to @nodes/ui without changing bytes or production exports", async () => {
    const png = join(root, "packages/ui/.storybook/references/blender-4.5.5-reference.png")
    const catalogPath = join(root, "packages/ui/.storybook/references/catalog.json")
    expect(existsSync(png)).toBeTrue()
    expect(existsSync(catalogPath)).toBeTrue()
    expect(createHash("sha256").update(readFileSync(png)).digest("hex"))
      .toBe("a493e1c03591800bb05644963369fca49669aa27f98e67a9971fd91735f2531d")
    expect(createHash("sha256").update(readFileSync(catalogPath)).digest("hex"))
      .toBe("6336fb189b3d3ae7ec4a9189945671e445db6b4a7d22ba3722c2d2a4b9a37cea")
    const uiCatalog = await catalogFor("ui")
    const comparison = uiCatalog.categories.flatMap((category) => category.subjects)
      .flatMap((subject) => subject.variants)
      .find((variant) => variant.route === "ui/comparison/reference/default")
    expect(comparison).toBeDefined()
    if (comparison === undefined || comparison.resources === undefined) {
      throw new Error("UI comparison resources are missing")
    }
    expect(comparison.resources.references).toEqual([
      "./references/blender-4.5.5-reference.png",
      "./references/catalog.json",
    ])
  })

  test("contains no consumer Storybook package, import or lifecycle", async () => {
    expect(existsSync(join(root, "packages/storybook/package.json"))).toBeFalse()
    const rootManifest = await json("package.json")
    expect(rootManifest.devDependencies["@nodes/storybook"]).toBeUndefined()
    expect(rootManifest.devDependencies["@zavx0z/storybook"]).toBeUndefined()
    expect(rootManifest.scripts.check).toBe("bun run typecheck && bun run test")

    const glob = new Bun.Glob("**/*.{ts,tsx,js,mjs,cjs}")
    for await (const path of glob.scan({cwd: root, onlyFiles: true, dot: true})) {
      if (path.startsWith("dist/") || path === "tests/external-storybook.test.ts") continue
      const source = await Bun.file(join(root, path)).text()
      for (const specifier of importedSpecifiers(source)) {
        expect(specifier, path).not.toMatch(/^@zavx0z\/storybook(?:\/|$)/u)
        expect(specifier, path).not.toMatch(/^@nodes\/storybook(?:\/|$)/u)
      }
    }
  })
})

type Catalog = Readonly<{
  categories: readonly Readonly<{
    route: string
    subjects: readonly Readonly<{
      route: string
      presentation: Readonly<{
        protocol: "story-presentation/1"
        projection: "display"
        widgets: readonly ["props", "source", "diagnostics"]
      }>
      variants: readonly Readonly<{
        route: string
        module: Readonly<{path: string; export: string}>
        resources?: Readonly<{references: readonly string[]}>
      }>[]
    }>[]
  }>[]
}>

type RouteBaseline = Readonly<{
  leafRoutes: readonly string[]
  overviewRoutes: readonly string[]
  hashes: Readonly<{leafRoutes: string}>
}>

type OverviewRemapEntry = Readonly<{
  from: string
  packageId: string
  to: string
}>

type OverviewRemap = Readonly<{
  law: string
  remaps: readonly OverviewRemapEntry[]
}>

async function catalogFor(owner: typeof owners[number]): Promise<Catalog> {
  return json(`packages/${owner}/.storybook/catalog.json`) as Promise<Catalog>
}

async function json(path: string): Promise<any> {
  return Bun.file(join(root, path)).json()
}

async function expectModuleExport(path: string, exportName: string): Promise<void> {
  expect(existsSync(path), path).toBeTrue()
  const loader = extname(path) === ".tsx" ? "tsx" : "ts"
  const exports = new Bun.Transpiler({loader}).scan(await Bun.file(path).text()).exports
  expect(exports, `${path}#${exportName}`).toContain(exportName)
}

function routeDigest(routes: readonly string[]): string {
  return createHash("sha256").update(routes.join("\n")).digest("hex")
}

function importedSpecifiers(source: string): readonly string[] {
  return [...source.matchAll(/(?:from\s+|import\s*\(\s*)(["'])([^"']+)\1/gu)]
    .flatMap((match) => match[2] === undefined ? [] : [match[2]])
}

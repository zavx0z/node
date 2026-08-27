# Требования @nodes/storybook

**Создано для [MetaFor](https://github.com/zavx0z/metafor).**

`@nodes/storybook` — один private dev-каталог всего семейства Nodes.
Production contracts остаются у Core, Editor, Layout, Worker и UI; Storybook
лениво показывает их внутри одного общего Workbench и не входит в production
exports.

## Final standard-DOM pipeline

### `NODES-STORYBOOK-DOM-001` — one entry for 224 route nodes

All 158 leaves and 66 overviews in the existing route tree use one direct
`app/dom-entry.ts`. There is no hybrid bootstrap, retained entry, retained
preview/overview module or load-bearing retained story registry. The private
`dom-catalog.ts` contains load-free route/title/owner metadata only; unknown
paths remain rejected by the shared typed route tree.

The entry composes one `@zavx0z/dom` Document, one shared semantic Workbench,
`createDocumentCanvasRuntime()` and the Engine-owned font. Navigation uses the
same `StorybookRouteTreeRouter.go()` and replaces only the controlled preview
subtree inside the existing Workbench; it does not reload the page, create a
second canvas/runtime/process or select a different browser target. Readiness
is published after each lazy story and one presented-frame boundary.

Core/Editor use the common NodeTree controller. Layout keeps the domain
`@nodes/layout` policies and projects their real computed geometry/diagnostics
through the private DOM layout controller. Worker executes exact production
executor envelopes. Parameter and Socket use standard input/select/checkbox
authoring plus independent kind/direction/side metadata. NodeEditor, Frame,
Link, root/UI overviews and Comparison use `NodeWorkbench`, which retains the
real GraphCanvas, NodeTree and Parameter controllers and standard image/listbox
subtrees. Comparison uses the base-path-normalized accepted reference beside
one Noise-style live DOM Node.

The final partition is **224 DOM / 0 retained**. App source and emitted browser
chunks contain no `UiRuntime`, retained Storybook surfaces, `@layout/core`,
`@ui/components`, `@ui/elements`, retained Parameter/Socket renderers or
NodeEditor implementation. `@nodes/storybook` therefore has no direct
Layout/UI/Highlighter/Core/Editor dependency; `@engine/core` remains only for
the shared font, while domain `@nodes/layout`, Worker, UI DOM, renderer and
shared Storybook owners remain explicit.

## Один документ и один Workbench

1. Storybook имеет один package-named process, automatic origin, browser target,
   semantic DOM Document, canvas, document renderer runtime, Router и общий
   пятизонный DOM Workbench.
2. `/` сразу открывает Workbench с representative Core overview. Отдельной landing page,
   package cards, кнопок «Открыть обзор» и package-specific DOM/WebGPU shells нет.
3. Все overview и detail routes принадлежат одному route tree с owner prefixes
   `core/**`, `editor/**`, `layout/**`, `worker/**`, `ui/**`.
4. Переход между любыми разделами выполняется одним `router.go()` без reload,
   `location.assign`, нового canvas, runtime, process или target.
5. Root app владеет только общей навигацией, shell, lazy dispatch и readiness.
   Package owners сохраняют production DOM controllers, route data, state и
   live source; отдельного preview adapter/surface contract больше нет.

## Панели каталога

1. Главная панель показывает semantic owners: `NodeTree`, `NodeTreeEditor`,
   `Раскладка`, `Worker`, `NodeEditor`, `Параметры`, `Сокеты`, `Frame`, `Link`
   и `Сравнение`.
2. Главная строка является route item. Disclosure-only group header не заменяет
   owner route и не выдаётся за открываемый раздел.
3. Для `Раскладка` второстепенная панель показывает `Fixed`, `Adaptive`,
   `Dagre Layered`, `Coffman–Graham`; dock показывает точные policy scenarios.
4. Для `Сокеты` второстепенная панель показывает все public Socket kinds;
   dock показывает `Input`, `Output`, `Bidirectional` выбранного kind.
5. Для `Параметры` второстепенная панель показывает все public Field kinds, а
   dock — `field`, `input`, `output`, `both`, `connected`.
6. Socket kinds принадлежат `@nodes/ui`; Fixed/Adaptive/Dagre/Coffman принадлежат
   `@nodes/layout`. Layout registry не содержит Socket types или группы
   «Сокеты нод».

## Lazy owner modules

1. Root entry eager-загружает DOM Workbench, load-free metadata and small shared
   DOM controller code. Domain policy/fixture data loads in exact lazy chunks.
2. Every story returns one standard element/controller/source tuple. The root
   replaces that element in the existing preview region and disposes the prior
   controller without replacing the Workbench or renderer runtime.
3. Layout and Worker leaves import only their exact policy/executor; their owner
   overviews explicitly aggregate all registered policies. Parameter and Socket
   data remain distinct lazy modules.
4. Bundle evidence scans every emitted chunk and rejects retained Surface,
   NodeEditor, Field/Elements and generic Layout runtime markers.

## Routes и readiness

1. Overview routes оканчиваются `/`; exact leaves не оканчиваются `/`.
   Неизвестный suffix остаётся 404.
2. Root representative — overview `core`. Каждый primary overview показывает
   общую информацию и все secondary items; каждый secondary overview показывает
   все свои variants. Overview имеет собственный lazy presentation module и не
   подставляет первый detail descendant.
3. Общий marker `nodesStorybook=ready` публикуется только после exact lazy module,
   актуального adapter state, render и shared frame boundary.
4. Browser evidence использует глобальный `$storybook`: один target, точный
   route, console 0 и non-black canvas. Restart сохраняет pathname и не
   активирует Chrome.

## Static build

1. `bun run build` создаёт один page artifact под `/node/` с root entry и lazy
   owner/story chunks.
2. Manifest schema 1 фиксирует source/dependency revisions, общий route tree,
   readiness, canvas evidence и hashes без local realpaths.
3. Artifact содержит один Engine font и Node-owned reference assets. Pages
   workflow отсутствует до immutable DOM/renderer revisions и отдельного
   решения владельца о публикации.

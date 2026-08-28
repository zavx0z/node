# Требования @nodes/storybook

**Создано для [MetaFor](https://github.com/zavx0z/metafor).**

`@nodes/storybook` — один private dev-каталог всего семейства Nodes.
Production contracts остаются у Core, Editor, Layout, Worker и UI; Storybook
лениво показывает их внутри одного общего Workbench и не входит в production
exports.

## Final standard-DOM pipeline

### `NODES-STORYBOOK-DOM-001` — one entry for 225 route nodes

All 159 leaves and 66 overviews in the existing route tree use one direct
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
executor envelopes. Every UI route is an adapter over exact public production
owners: `createNodeEditor`, `createNode`, `createParameter`, `createSocket` and
`createLink`. Parameter embeds the exact `@ui/components/field` owner through
`@nodes/ui/parameter`; Storybook does not copy its input/select/checkbox
composition. NodeEditor, Frame, Link, root/UI overviews and Comparison render
rich Blender-like Node structures rather than `NodeWorkbench` or label-only
Graph rectangles. Comparison uses the base-path-normalized accepted reference
beside one live production Node and Parameter subtree.

All 225 route nodes remain on the standard DOM pipeline, but route count and
absence of the former retained implementation are migration mechanics rather
than visual acceptance. App source and emitted browser chunks contain no
`UiRuntime`, retained Storybook surfaces, `@layout/core` or `@ui/elements`.
Production `@nodes/ui` and its exact `@ui/components/field` dependency are
required, not forbidden. `@engine/core` remains only for the shared font,
while domain `@nodes/layout`, Worker, UI DOM, renderer and shared Storybook
owners remain explicit.

### `NODES-STORYBOOK-UI-001` — production-owner previews

1. NodeEditor routes use exact `createNodeEditor()` and its exported CSS. The
   graph contains compact coloured-header Nodes, embedded Properties and
   Parameters, typed Sockets, routed Links, grid, controlled selection and
   Frame composition. A plain rectangle with a title is not a Node preview.
2. Parameter routes use exact `createParameter()` with a real FieldDefinition
   of the selected kind and exact left/right Socket definitions for the route
   variant. Composite color/vector/rotation/matrix/reference/collection/path
   values remain their production Field controls, never string substitutes.
3. Socket routes use exact `createSocket()`, all 19 kinds and independent
   direction/side/shape state. Link routes use exact `createLink()` route
   segments and hit corridors. Storybook does not redraw either owner.
4. Frame presentation is a real production NodeEditor graph with selected
   Frame ownership and nested rich Nodes. Comparison is a neutral composition
   of one accepted raster and one live production Noise-style Node; the
   comparison wrapper owns layout only, not Node visuals.
5. Component CSS shown in source and supplied to the document runtime is the
   combined exact exported `nodeEditorCss`, `nodeCss`, `parameterCss`,
   `socketCss` and `linkCss`, followed only by bounded Storybook comparison /
   preview framing.
6. `/ui/node-editor/scene/compiled-general` mounts the public compiled
   `NodeSystem` over one Core `NodeTree` and one `NodeTreeEditor`. Its
   `useSyncExternalStore` view owns no duplicate tree/value state, and the
   Template compiler removes authored JSX without an npm React fallback.

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
   live source. Private Storybook adapter выбирает props и связывает standard
   events, но не копирует visual tree, CSS или interaction implementation.

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
   old NodeEditor/Parameter renderers, Elements and generic Layout runtime
   markers. Production `createNodeEditor`, `createNode`, `createParameter`,
   `createSocket`, `createLink` and `createField` markers обязаны присутствовать.

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
5. Representative browser gates включают exact routes NodeEditor, Parameter,
   Socket, Frame, Link и Comparison. DOM/readiness/non-black доказывают delivery,
   но visual parity подтверждается только сопоставимым capture рядом с
   accepted reference и отдельным owner verdict.

## Static build

1. `bun run build` создаёт один page artifact под `/node/` с root entry и lazy
   owner/story chunks.
2. Manifest schema 1 фиксирует source/dependency revisions, общий route tree,
   readiness, canvas evidence и hashes без local realpaths.
3. Artifact содержит один Engine font и Node-owned reference assets. Pages
   workflow отсутствует до immutable DOM/renderer revisions и отдельного
   решения владельца о публикации.

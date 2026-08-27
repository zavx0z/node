# Требования @nodes/storybook

**Создано для [MetaFor](https://github.com/zavx0z/metafor).**

`@nodes/storybook` — один private dev-каталог всего семейства Nodes.
Production contracts остаются у Core, Editor, Layout, Worker и UI; Storybook
лениво показывает их внутри одного общего Workbench и не входит в production
exports.

## Один документ и один Workbench

1. Storybook имеет один package-named process, automatic origin, browser target,
   HTML document, canvas, `UiRuntime`, Router, пятизонный Workbench и общую
   нижнюю `StatusBar`.
2. `/` сразу открывает Workbench с representative Core overview. Отдельной landing page,
   package cards, кнопок «Открыть обзор» и package-specific DOM/WebGPU shells нет.
3. Все overview и detail routes принадлежат одному route tree с owner prefixes
   `core/**`, `editor/**`, `layout/**`, `worker/**`, `ui/**`.
4. Переход между любыми разделами выполняется одним `router.go()` без reload,
   `location.assign`, нового canvas, runtime, process или target.
5. Root app владеет только общей навигацией, shell, lazy dispatch и readiness.
   Package owners сохраняют local story descriptors, fixtures, state, source,
   controls и preview adapters.

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

1. Root entry eager-загружает только Workbench и чистую story metadata.
   Production implementations загружаются exact lazy chunks выбранного story.
2. Обычный story рендерится package-owned `StorybookStoryModule` в общей preview
   Surface. Core и Worker не создают отдельный DOM shell.
3. Владелец, которому нужны самостоятельные интерактивные Surface, возвращает
   явный preview adapter. Root регистрирует его surfaces один раз в существующем
   `UiRuntime` и скрывает inactive surfaces.
4. `NodeTreeEditor` использует отдельные preview/dock surfaces, но не создаёт
   второй Workbench. Node UI adapter аналогично владеет NodeEditor/reference
   surfaces только внутри root preview slot.
5. Lazy boundary доказывается chunks: cold root не содержит Core/Editor/Layout/
   Worker/UI implementations, а выбор одного story не импортирует соседний
   policy или owner.

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
   workflow остаётся manual и не публикуется без отдельного решения владельца.

# Node agent rules

- Use `$nodes-dev` from `.agents/skills/nodes-dev` for Node implementation,
  tests and package-specific acceptance semantics. Use the single global
  `$storybook` for `@nodes/storybook` lifecycle, static Pages builds, and
  exact-route DOM, SVG, or WebGPU browser evidence.
- Before changing behavior, read `ARCHITECTURE.md`, the owning package
  `requirements.md`, public types, implementation, and focused tests.
- Preserve the independent Core, Editor, Layout, Worker, UI, and Storybook
  package boundaries. Engine, Layout, and UI are upstream owners; MetaFor is a
  product consumer. Import exact owners directly without aliases or re-exports.
- Preserve the supplied checkout, unrelated changes, linked dependency
  identity, listeners, and browser targets. Use the skill-owned background
  browser path instead of focusing desktop browser windows.
- `@nodes/storybook` has one document, canvas, `UiRuntime`, Router and Workbench.
  `/` shows a representative story in that Workbench; owner prefixes are
  sections of the same catalog. Do not add a landing page, package cards,
  package-specific shells or nested Storybook runtimes.

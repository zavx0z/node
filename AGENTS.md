# Node agent rules

- Use `$nodes-dev` from `.agents/skills/nodes-dev` for Node implementation,
  focused tests and owner acceptance semantics. External Storybook lifecycle is
  owned only by the global `$storybook` tool and the project declaration at
  `.storybook/manifest.json`.
- Before changing behavior, read `ARCHITECTURE.md`, the owning package
  `requirements.md`, public types, implementation and focused tests.
- Preserve the independent `@nodes/core`, `@nodes/editor`, `@nodes/layout`,
  `@nodes/worker` and `@nodes/ui` production boundaries. Story/catalog/runtime
  files remain dev-only under each owner's `storybook/` and `.storybook/`.
- Consumer packages never install or import `@zavx0z/storybook`, never create a
  private `@scope/storybook` package and never own a Storybook server, build,
  launcher, port or frontend shell.
- The upstream document path is `@zavx0z/dom` → `@zavx0z/renderer` →
  `@zavx0z/renderer-webgpu` → `@engine/core`. Generic Layout and
  `@ui/elements` are retired; `@nodes/layout` remains the domain solver owner.
- Import exact owners directly without aliases or production re-exports.
  Preserve supplied checkout, unrelated changes, linked dependency identity,
  listeners and browser targets.
- External Storybook supplies one shared Workbench/Navigation Tree and opens
  one package per tab. Package declarations preserve the 159 historical leaves;
  former section prefixes are variant grouping metadata, never another panel.
- The Blender PNG and provenance catalog remain immutable `@nodes/ui` resources
  under `packages/ui/.storybook/references/` and outside production exports.

# Catalog and DOM package pages

All lifecycle and browser operations use global `$storybook` with exact package
`@nodes/storybook`; its origin is automatic.

## Catalog

Route `/` must publish `nodesStorybook=ready`, `nodesStorybookPage=catalog`
and five package cards with links to the manifest-owned package overviews.
Every nested overview/detail DOM must expose `data-storybook-home` with `/`.

## Core

Route `/core/live-node-tree` is DOM-only. It must show `snapshot()`,
ID-addressed `document()`, revisions and ordered Parameter events without
Engine, Node UI or layout code.

## Worker

Route `/worker/protocol` is DOM-only. It must show serializable fixed and
adaptive request/response envelopes, request id and generation.

For every route: exact reload, DOM ready and console `0`. Do not request canvas
or WebGPU evidence.

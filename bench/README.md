# NodeSystem performance

Run both canonical scales from the repository root:

```bash
bun run bench:node-system
```

The benchmark constructs independent 1k and 10k Core `NodeTree` fixtures.
Every Node has four Parameters, two typed Sockets and participates in one Link
chain. The compiled `NodeSystem` receives one `850 × 500` viewport and
materializes six Nodes; fixture construction remains reported separately from
component interaction timings.

Each process records:

- cold mount, scheduler mounts/renders and semantic Document mutation batches;
- 20 warmed visible value samples with p50/p95 component, CPU renderer and
  WebGPU-backend preparation times;
- one offscreen value update and one culled additive topology update;
- topology timing split into Editor + canonical Core, immutable Core external-
  store projection, and the NodeSystem viewport-selector publication;
- surviving Node/Input identities, renderer frame identity and backend plan
  reuse;
- full RenderFrame diagnostics using the real Engine font. A public
  `style={{overflow: "visible"}}` removes the viewport clip in this diagnostic
  so the default safe backend can prove automatic instancing where it is
  applicable; no `rectInstancing` option or manual GPU hint is supplied.

Budgets are exact multiples of 90 Hz (`11.111 ms`) and 60 Hz (`16.667 ms`).
The 10k additive Editor commit receives two 60 Hz frames; every other
interaction budget is one frame. Cold mount, initial CPU renderer and initial
WebGPU backend preparation receive eight 60 Hz frames each. The command exits
non-zero when any timing or deterministic correctness gate fails.

Three value commits and one additive topology commit warm the compiled/runtime
paths before measurement; their revisions are real, but their timings are not
reported as samples.

The viewport selector is a revision-fenced derived projection of the Core
snapshot. If an append is entirely offscreen and changes no visible Link, it
retains the prior selected snapshot so `useSyncExternalStore` schedules no root
render; it never stores an alternate graph or Parameter value.

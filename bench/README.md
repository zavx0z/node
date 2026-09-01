# NodeSystem performance

Run both canonical scales from the repository root:

```bash
bun run bench:node-system
```

Run retained Path rendering at the two layout-policy edge budgets and the
synthetic 10k stress scale:

```bash
bun run bench:node-paths
```

The Path benchmark materializes exactly one semantic `vector-path` per Link in
a real `GraphCanvas` with one Frame and six Node siblings. It records initial
preparation plus warmed 100-sample stable, transform-only, GraphCanvas selection
and single-route distributions at 512, 2,048 and 10,000 Links. Acceptance
requires selected-last paint order, one shared path run, stable semantic identity
and geometry, zero transform uploads, no semantic DOM reparent, one bounded
CSS-stacking style/order update for
selection (4-byte width plus moved sampled-order range), only the changed
route segment fields, and p50/p95/p99 timing with
interactive p95 inside one 60 Hz frame.

Each scale runs in its own Bun process. This prevents an earlier fixture's
uncollected retained graph from changing the later scale. Explicit GC is used
only for retained-heap snapshots outside every measured sample.

Heap evidence separates the retained baseline after initial apply, the raw
heap after all measured interactions, and the retained heap after yielding out
of the WeakRef job followed by `Bun.gc(true)`. GC never runs inside a timing
sample. This makes an accidentally strong predecessor chain across immutable
10k Link arrays observable without laundering collection time into frame p95.

The benchmark constructs independent 1k and 10k Core `NodeTree` fixtures.
Every Node has four Parameters, two typed Sockets and participates in one Link
chain. The compiled `NodeSystem` receives one `850 × 500` viewport and
materializes six Nodes and eight semantic Link Paths: Links remain visible when
either endpoint is visible or their route bounds cross the viewport. The 1k/10k stores contain
999/9,999 canonical Links. Fixture construction remains reported separately
from component interaction timings.

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
  `style={css\`& { overflow: visible; }\`}` removes the viewport clip in this diagnostic
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

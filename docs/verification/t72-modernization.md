# T72 modernization verification

## Contract and browser acceptance coverage

`server/contract-acceptance.test.js` exercises the public HTTP seam at 11×11, 316×316, and 317×317. It verifies Layout replacement and identity, binary response headers, all three algorithms, both detail tiers, in-range cells, reachability and final-path semantics, and run metrics. `web/src/wayfinder-client.test.js` verifies binary decoding, malformed-envelope rejection, stale-layout recovery, and dimension controls. The ordinary DOM-grid and high-density Canvas views expose a labelled Grid/canvas, live run status, comparable metrics, and the high-density text alternative.

Run the checks with:

```bash
make clean && make
npm --prefix server test
npm --prefix web test
npm --prefix web run lint
npm --prefix web run build
```

## Responsiveness benchmark protocol

The 100 ms targets apply to warm Chromium browser requests and control acknowledgement; the 50 ms threshold applies to the longest Canvas main-thread task. Run the production web build behind the API, open Chromium DevTools Performance, then generate and run each algorithm twice at 316×316 and 317×317. Discard the first sample, retain the second, and record network completion, click-to-status acknowledgement, and the longest Canvas task. The application intentionally uses Canvas at these sizes so the visualization does not create roughly 100,000 DOM grid cells.

This repository's automated checks cover functional envelope behavior; Chromium, Safari, and Firefox performance/visual checks require their respective installed browsers and therefore are recorded as a release-validation step rather than fabricated as automated results.

## Browser validation record

Before release, record each current browser/version with the following matrix at 11×11, 316×316, and 317×317: generate a layout; run BFS, Dijkstra, and A*; confirm metrics and final path; use Clear run overlay and Generate Maze; inspect the Canvas or DOM visual result; and confirm the accessible name, live status, metrics table, and high-density text alternative. Record pass/fail and measured Chromium timings beside the browser versions in the release evidence. This ensures Safari and Firefox behavior is explicitly checked without implying Chromium-only performance guarantees.

## Removed legacy surface

The obsolete JSON Grid and Pathfinding-run serializers and the obsolete BFS response schema were removed. JSON remains only where it is intentionally the configuration format and for small API error/configuration responses; it is not a Layout or Pathfinding-run fallback.

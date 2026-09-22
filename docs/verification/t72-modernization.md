# T72 modernization verification

## Contract and browser acceptance coverage

`server/contract-acceptance.test.js` exercises the public HTTP seam at its fixed 101×101 size. It verifies Layout replacement and identity, binary response headers, all three algorithms, both detail tiers, in-range cells, reachability and final-path semantics, and run metrics. `web/src/wayfinder-client.test.js` verifies binary decoding, malformed-envelope rejection, stale-layout recovery, and fixed-size layout generation. The Canvas view exposes a labelled Grid, live run status, comparable metrics, and a text alternative.

Run the checks with:

```bash
make clean && make
npm --prefix server test
npm --prefix web test
npm --prefix web run lint
npm --prefix web run build
```

## Responsiveness benchmark protocol

The 100 ms targets apply to warm Chromium browser requests and control acknowledgement; the 50 ms threshold applies to the longest Canvas main-thread task. Run the production web build behind the API, open Chromium DevTools Performance, then generate and run each algorithm twice at 101×101. Discard the first sample, retain the second, and record network completion, click-to-status acknowledgement, and the longest Canvas task. The application intentionally uses Canvas so the visualization does not create individual DOM grid cells.

This repository's automated checks cover functional envelope behavior; Chromium, Safari, and Firefox performance/visual checks require their respective installed browsers and therefore are recorded as a release-validation step rather than fabricated as automated results.

## Browser validation record

Before release, record each current browser/version at 101×101: generate a layout; run BFS, Dijkstra, and A*; confirm metrics and final path; use Clear run overlay and Generate Maze; inspect the Canvas visual result; and confirm the accessible name, live status, metrics table, and text alternative. Record pass/fail and measured Chromium timings beside the browser versions in the release evidence. This ensures Safari and Firefox behavior is explicitly checked without implying Chromium-only performance guarantees.

## Removed legacy surface

The obsolete JSON Grid and Pathfinding-run serializers and the obsolete BFS response schema were removed. JSON remains only for small API error responses; it is not a Layout or Pathfinding-run fallback.

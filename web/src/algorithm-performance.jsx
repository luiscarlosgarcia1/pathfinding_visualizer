import "./algorithm-performance.css";

const EMPTY_METRIC = "—";
const METRICS = [
  { key: "runtimeMs", label: "Runtime", format: (value) => `${value.toFixed(2)} ms` },
  { key: "visitedCells", label: "Visited cells", format: (value) => value },
  { key: "pathLength", label: "Path length", format: (value) => value },
  { key: "totalDistance", label: "Total distance", format: (value) => value },
];

function displayMetric(metric, value) {
  return typeof value === "number" ? metric.format(value) : EMPTY_METRIC;
}

export function AlgorithmPerformance({ algorithms, algorithmStats, runStatus }) {
  return (
    <aside className="algorithm-performance" aria-label="Algorithm performance">
      <section className="algorithm-performance__metrics">
        <h2>Algorithm Performance</h2>
        <table className="algorithm-performance__table">
          <caption className="visually-hidden">Comparable metrics for each pathfinding algorithm</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {algorithms.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => (
              <tr key={metric.key}>
                <th scope="row">{metric.label}</th>
                {algorithms.map(({ key }) => <td key={key}>{displayMetric(metric, algorithmStats[key][metric.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="algorithm-performance__status" aria-labelledby="run-status-heading">
        <h2 id="run-status-heading">Run Status</h2>
        <p role="status" aria-live="polite">{runStatus}</p>
      </section>
    </aside>
  );
}

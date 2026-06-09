import type { Language } from "../i18n";
import {
  expectedMultiModeRatios,
  type MultiModeConfig,
  type MultiModeSample,
  type MultiModeSnapshot,
  type MultiModeState,
} from "../sim/multimode";

interface MultiModePanelsProps {
  snapshot: MultiModeSnapshot;
  config: MultiModeConfig;
  language: Language;
}

const MODES: MultiModeState[] = ["AC", "AD", "BC", "BD"];

const MODE_COLORS: Record<MultiModeState, string> = {
  AC: "#1267f2",
  AD: "#16a34a",
  BC: "#f59e0b",
  BD: "#ed253c",
};

export function MultiModePanels({ snapshot, config, language }: MultiModePanelsProps) {
  return (
    <div className="multi-mode-grid">
      <MultiModeCanvas snapshot={snapshot} language={language} />
      <div className="right-column">
        <MultiModeChart samples={snapshot.samples} language={language} />
        <MultiModeSummary snapshot={snapshot} config={config} language={language} />
      </div>
    </div>
  );
}

function MultiModeCanvas({ snapshot, language }: { snapshot: MultiModeSnapshot; language: Language }) {
  return (
    <section className="experiment-panel canvas-panel" aria-label={label(language, "canvas")}>
      <svg
        className="experiment-canvas multi-mode-canvas"
        viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
        role="img"
        aria-label={label(language, "canvas")}
      >
        <rect x="0" y="0" width={snapshot.width} height={snapshot.height} rx="10" />
        {snapshot.points.map((point) => {
          const size = latticeCellFillSize(point.radius);
          return (
            <rect
              key={point.id}
              x={point.x - size / 2}
              y={point.y - size / 2}
              width={size}
              height={size}
              className={`multi-cell state-${point.mode.toLowerCase()}`}
            />
          );
        })}
      </svg>
      <div className="canvas-footer">
        <div className="legend multi-legend">
          {MODES.map((mode) => (
            <span key={mode}>
              <i className={`dot state-${mode.toLowerCase()}`} />
              {mode}
            </span>
          ))}
        </div>
        <span>{label(language, "caption")}</span>
      </div>
    </section>
  );
}

function MultiModeChart({ samples, language }: { samples: MultiModeSample[]; language: Language }) {
  const width = 420;
  const height = 260;
  const padding = { top: 20, right: 18, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const visible = samples.slice(-220);
  const minStep = visible[0]?.step ?? 0;
  const maxStep = visible[visible.length - 1]?.step ?? minStep + 1;
  const x = (step: number) =>
    padding.left + ((step - minStep) / Math.max(1, maxStep - minStep)) * plotWidth;
  const y = (value: number) => padding.top + (1 - value) * plotHeight;

  return (
    <section className="experiment-panel chart-panel">
      <div className="panel-heading">
        <h2>{label(language, "chart")}</h2>
        <div className="chart-legend multi-chart-legend">
          {MODES.map((mode) => (
            <span key={mode} style={{ color: MODE_COLORS[mode] }} className="line-key">
              {mode}
            </span>
          ))}
        </div>
      </div>
      <div className="chart-with-bars">
        <svg className="ratio-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label(language, "chart")}>
          <g className="axis-grid">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <g key={tick}>
                <line x1={padding.left} y1={y(tick)} x2={width - padding.right} y2={y(tick)} />
                <text x={padding.left - 8} y={y(tick) + 4} textAnchor="end">
                  {tick.toFixed(2)}
                </text>
              </g>
            ))}
            <text x={padding.left} y={height - 8} className="axis-label">
              {minStep.toLocaleString()}
            </text>
            <text x={width - padding.right} y={height - 8} textAnchor="end" className="axis-label">
              {maxStep.toLocaleString()}
            </text>
          </g>
          {MODES.map((mode) => (
            <path
              key={mode}
              d={linePath(visible.map((sample) => [x(sample.step), y(valueForMode(sample, mode))]))}
              className="chart-line"
              style={{ stroke: MODE_COLORS[mode] }}
            />
          ))}
        </svg>
        <CurrentMultiModeBar sample={samples[samples.length - 1]} />
      </div>
      <p className="chart-note">{label(language, "chartNote")}</p>
    </section>
  );
}

function MultiModeSummary({
  snapshot,
  config,
  language,
}: {
  snapshot: MultiModeSnapshot;
  config: MultiModeConfig;
  language: Language;
}) {
  const expected = expectedMultiModeRatios(config);
  const latest = snapshot.latest;
  const total = latest.ac + latest.ad + latest.bc + latest.bd;
  return (
    <section className="experiment-panel summary-panel">
      <h2>{label(language, "summary")}</h2>
      <table>
        <thead>
          <tr>
            <th>{label(language, "mode")}</th>
            <th>{label(language, "count")}</th>
            <th>{label(language, "current")}</th>
            <th>{label(language, "expected")}</th>
          </tr>
        </thead>
        <tbody>
          {MODES.map((mode) => (
            <tr key={mode}>
              <th>{mode}</th>
              <td>{countForMode(latest, mode).toLocaleString()}</td>
              <td>{valueForMode(latest, mode).toFixed(3)}</td>
              <td>{expected[`p${mode}`].toFixed(3)}</td>
            </tr>
          ))}
          <tr>
            <th>{label(language, "step")}</th>
            <td colSpan={3}>{latest.step.toLocaleString()}</td>
          </tr>
          <tr>
            <th>N</th>
            <td colSpan={3}>{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function valueForMode(sample: MultiModeSample, mode: MultiModeState): number {
  return sample[`p${mode}`];
}

function countForMode(sample: MultiModeSample, mode: MultiModeState): number {
  return sample[mode.toLowerCase() as "ac" | "ad" | "bc" | "bd"];
}

function CurrentMultiModeBar({ sample }: { sample: MultiModeSample }) {
  return (
    <div
      className="current-bars multi-current-bars"
      aria-label={MODES.map((mode) => `${mode}: ${valueForMode(sample, mode).toFixed(3)}`).join(", ")}
    >
      <div
        className="stacked-vertical-track multi-state-track"
        title={MODES.map((mode) => `${mode}: ${valueForMode(sample, mode).toFixed(3)}`).join(", ")}
      >
        {MODES.map((mode) => (
          <i
            key={mode}
            className={`stack-${mode.toLowerCase()}`}
            style={{ height: `${valueForMode(sample, mode) * 100}%` }}
          />
        ))}
      </div>
      <div className="current-bar-values multi-current-values">
        {MODES.map((mode) => (
          <span key={mode} className={`value-${mode.toLowerCase()}`}>
            {mode} {valueForMode(sample, mode).toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}

function linePath(points: number[][]): string {
  if (points.length === 0) {
    return "";
  }
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function latticeCellFillSize(radius: number): number {
  return (radius / 0.36) * 0.9;
}

function label(
  language: Language,
  key: "canvas" | "caption" | "chart" | "chartNote" | "summary" | "mode" | "count" | "current" | "expected" | "step",
): string {
  const labels = {
    ja: {
      canvas: "4状態ラティス PCA",
      caption: "4状態ラティス PCA (AC / AD / BC / BD)",
      chart: "4状態比率の時系列",
      chartNote: "Fig. 9 型の独立な A/B 軸と C/D 軸を組み合わせた4状態実験。",
      summary: "現在値と独立理論比",
      mode: "状態",
      count: "数",
      current: "現在",
      expected: "期待比",
      step: "ステップ",
    },
    en: {
      canvas: "Four-state lattice PCA",
      caption: "Four-state lattice PCA (AC / AD / BC / BD)",
      chart: "Four-state ratio time series",
      chartNote: "A Fig. 9-style four-state experiment combining independent A/B and C/D axes.",
      summary: "Current values and independent expectation",
      mode: "Mode",
      count: "Count",
      current: "Current",
      expected: "Expected",
      step: "Step",
    },
  } as const;
  return labels[language][key];
}

import type { ExperimentSample } from "../sim/types";

interface RatioChartProps {
  samples: ExperimentSample[];
  title: string;
  pALabel: string;
  pBLabel: string;
  note: string;
}

export function RatioChart({ samples, title, pALabel, pBLabel, note }: RatioChartProps) {
  const width = 620;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 38, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const firstStep = samples[0]?.step ?? 0;
  const lastStep = samples[samples.length - 1]?.step ?? 1;
  const stepRange = Math.max(1, lastStep - firstStep);

  const x = (step: number) => padding.left + ((step - firstStep) / stepRange) * plotWidth;
  const y = (value: number) => padding.top + (1 - value) * plotHeight;

  const pAPath = linePath(samples.map((sample) => [x(sample.step), y(sample.pA)]));
  const pBPath = linePath(samples.map((sample) => [x(sample.step), y(sample.pB)]));

  return (
    <section className="experiment-panel chart-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <div className="chart-legend">
          <span className="line-key line-a">{pALabel}</span>
          <span className="line-key line-b">{pBLabel}</span>
        </div>
      </div>
      <div className="chart-with-bars">
        <svg className="ratio-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <g className="axis-grid">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <g key={tick}>
                <line x1={padding.left} y1={y(tick)} x2={width - padding.right} y2={y(tick)} />
                <text x={padding.left - 12} y={y(tick) + 4}>
                  {tick.toFixed(2)}
                </text>
              </g>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const xPosition = padding.left + tick * plotWidth;
              return <line key={tick} x1={xPosition} y1={padding.top} x2={xPosition} y2={height - padding.bottom} />;
            })}
          </g>
          <path d={pAPath} className="chart-line chart-line-a" />
          <path d={pBPath} className="chart-line chart-line-b" />
          <text x={padding.left} y={height - 10} className="axis-label">
            {firstStep.toLocaleString()} - {lastStep.toLocaleString()}
          </text>
        </svg>
        <CurrentBar sample={samples[samples.length - 1]} pALabel={pALabel} pBLabel={pBLabel} />
      </div>
      <p className="chart-note">{note}</p>
    </section>
  );
}

function linePath(points: number[][]): string {
  if (points.length === 0) {
    return "";
  }
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function CurrentBar({
  sample,
  pALabel,
  pBLabel,
}: {
  sample: ExperimentSample;
  pALabel: string;
  pBLabel: string;
}) {
  return (
    <div
      className="current-bars"
      aria-label={`${pALabel}: ${sample.pA.toFixed(3)}, ${pBLabel}: ${sample.pB.toFixed(3)}`}
    >
      <div className="stacked-vertical-track" title={`${pALabel}: ${sample.pA.toFixed(3)}, ${pBLabel}: ${sample.pB.toFixed(3)}`}>
        <i className="stack-b" style={{ height: `${sample.pB * 100}%` }} />
        <i className="stack-a" style={{ height: `${sample.pA * 100}%` }} />
      </div>
      <div className="current-bar-values">
        <span className="value-a">A {sample.pA.toFixed(2)}</span>
        <span className="value-b">B {sample.pB.toFixed(2)}</span>
      </div>
    </div>
  );
}

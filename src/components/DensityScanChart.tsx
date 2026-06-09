import type { Language } from "../i18n";
import type { PaperScanPreset, PaperScanSeriesResult } from "../sim/paperScan";

interface DensityScanChartProps {
  preset: PaperScanPreset;
  series: PaperScanSeriesResult[];
  language: Language;
}

export function DensityScanChart({ preset, series, language }: DensityScanChartProps) {
  const width = 840;
  const height = 340;
  const padding = { top: 26, right: 30, bottom: 48, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const densityMin = Math.min(...preset.densities);
  const densityMax = Math.max(...preset.densities);
  const x = (density: number) => padding.left + ((density - densityMin) / (densityMax - densityMin)) * plotWidth;
  const y = (pA: number) => padding.top + (1 - pA) * plotHeight;

  return (
    <div className="scan-chart-wrap">
      <svg className="scan-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chartLabel(language)}>
        <g className="axis-grid">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line x1={padding.left} y1={y(tick)} x2={width - padding.right} y2={y(tick)} />
              <text x={padding.left - 12} y={y(tick) + 4}>
                {tick.toFixed(2)}
              </text>
            </g>
          ))}
          {preset.densities.map((density) => (
            <g key={density}>
              <line x1={x(density)} y1={padding.top} x2={x(density)} y2={height - padding.bottom} />
              <text x={x(density)} y={height - 18} textAnchor="middle">
                {density.toFixed(1)}
              </text>
            </g>
          ))}
        </g>

        {series.map((item) => {
          const path = linePath(item.points.map((point) => [x(point.density), y(point.pA)]));
          return (
            <g key={item.id}>
              <path
                d={path}
                className={item.dashed ? "scan-line dashed" : "scan-line"}
                style={{ stroke: item.color }}
              />
              {item.points.map((point) => (
                <circle key={`${item.id}-${point.density}`} cx={x(point.density)} cy={y(point.pA)} r="4" fill={item.color} />
              ))}
            </g>
          );
        })}

        <text x={padding.left} y={18} className="axis-title">
          {label(language, "pA")}
        </text>
        <text x={width - padding.right} y={height - 4} className="axis-title" textAnchor="end">
          {densityLabel(preset, language)}
        </text>
      </svg>
    </div>
  );
}

function linePath(points: number[][]): string {
  if (points.length === 0) {
    return "";
  }
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function label(language: Language, key: "pA"): string {
  const labels = {
    ja: {
      pA: "pA",
    },
    en: {
      pA: "pA",
    },
  } as const;
  return labels[language][key];
}

function chartLabel(language: Language): string {
  return language === "ja" ? "密度 Sweep pA グラフ" : "Density Sweep pA chart";
}

function densityLabel(preset: PaperScanPreset, language: Language): string {
  if (preset.simulationMode === "billiard") {
    return language === "ja" ? "density (area fraction)" : "density (area fraction)";
  }
  return "density";
}

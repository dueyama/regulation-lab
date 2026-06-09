import { DensityScanChart } from "./DensityScanChart";
import type { Language } from "../i18n";
import { billiardParticleCountForDensity, type PaperScanPreset, type PaperScanSeriesResult } from "../sim/paperScan";
import type { ExperimentSnapshot } from "../sim/types";

interface PaperScanViewProps {
  preset: PaperScanPreset;
  results: PaperScanSeriesResult[];
  language: Language;
  running: boolean;
  progressLabel: string;
  preview: ExperimentSnapshot | null;
  previewLabel: string;
  onRun: () => void;
}

export function PaperScanView({
  preset,
  results,
  language,
  running,
  progressLabel,
  preview,
  previewLabel,
  onRun,
}: PaperScanViewProps) {
  const hasData = results.some((series) => series.points.length > 0);
  return (
    <div className="paper-scan-layout">
      <section className="experiment-panel paper-scan-panel">
        <div className="paper-scan-heading">
          <div>
            <h2>{title(preset, language)}</h2>
            <p>{summary(preset, language)}</p>
          </div>
          <button className="primary-action scan-run-button" onClick={onRun} disabled={running}>
            {running ? text(language, "running") : text(language, "run")}
          </button>
        </div>
        <div className="scan-meta-row">
          <span>{preset.figure}</span>
          <span>{methodLabel(preset, language)}</span>
          <span>{systemSizeText(preset, language)}</span>
          <span>{stepLabel(preset, language)}: {preset.steps.toLocaleString()}</span>
          <span>{progressLabel}</span>
        </div>
        <p className="scan-method-note">{methodNote(preset, language)}</p>

        <div className={preview ? "scan-content-grid" : ""}>
          <div>
            {hasData ? (
              <>
                <DensityScanChart preset={preset} series={results} language={language} />
                <div className="scan-legend">
                  {results.map((series) => (
                    <span key={series.id}>
                      <i style={{ background: series.color }} />
                      {language === "ja" ? series.labelJa : series.labelEn}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="scan-empty">{text(language, "empty")}</div>
            )}
          </div>
          {preview && (
            <div className="scan-preview">
              <h3>{text(language, "preview")}</h3>
              <p>{previewLabel}</p>
              <ScanPreviewSvg snapshot={preview} />
              <div className="scan-preview-values">
                <span>A {preview.latest.pA.toFixed(3)}</span>
                <span>B {preview.latest.pB.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {hasData && (
        <section className="experiment-panel scan-table-panel">
          <h2>{text(language, "table")}</h2>
          <table>
            <thead>
              <tr>
                <th>{text(language, "series")}</th>
                <th>{text(language, "density")}</th>
                {preset.simulationMode === "billiard" && <th>N</th>}
                <th>pA</th>
                <th>pB</th>
              </tr>
            </thead>
            <tbody>
              {results.flatMap((series) =>
                series.points.map((point) => (
                  <tr key={`${series.id}-${point.density}`}>
                    <td>{language === "ja" ? series.labelJa : series.labelEn}</td>
                    <td>{point.density.toFixed(1)}</td>
                    {preset.simulationMode === "billiard" && (
                      <td>{billiardParticleCountForDensity(preset, point.density).toLocaleString()}</td>
                    )}
                    <td>{point.pA.toFixed(3)}</td>
                    <td>{point.pB.toFixed(3)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function ScanPreviewSvg({ snapshot }: { snapshot: ExperimentSnapshot }) {
  const maxPoints = 2400;
  const stride = snapshot.mode === "lattice" ? 1 : Math.max(1, Math.ceil(snapshot.points.length / maxPoints));
  const points = snapshot.points.filter((_, index) => index % stride === 0);
  return (
    <svg
      className="scan-preview-canvas"
      viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
      role="img"
      aria-label="Current density simulation preview"
    >
      <rect x="0" y="0" width={snapshot.width} height={snapshot.height} rx="10" />
      {points.map((point) => (
        snapshot.mode === "lattice" ? (
          <rect
            key={point.id}
            x={point.x - latticeCellFillSize(point.radius) / 2}
            y={point.y - latticeCellFillSize(point.radius) / 2}
            width={latticeCellFillSize(point.radius)}
            height={latticeCellFillSize(point.radius)}
            className={point.mode === "A" ? "particle particle-a" : "particle particle-b"}
          />
        ) : (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={Math.max(point.radius, 2.6)}
            className={point.mode === "A" ? "particle particle-a" : "particle particle-b"}
          />
        )
      ))}
    </svg>
  );
}

function latticeCellFillSize(radius: number): number {
  return (radius / 0.36) * 0.9;
}

function title(preset: PaperScanPreset, language: Language): string {
  return language === "ja" ? preset.titleJa : preset.titleEn;
}

function summary(preset: PaperScanPreset, language: Language): string {
  return language === "ja" ? preset.summaryJa : preset.summaryEn;
}

function text(
  language: Language,
  key:
    | "run"
    | "running"
    | "empty"
    | "table"
    | "series"
    | "density"
    | "preview",
) {
  const labels = {
    ja: {
      run: "密度 Sweep 実行",
      running: "計算中",
      empty: "プリセットを選び、密度 Sweep を実行してください。",
      table: "Sweep 結果",
      series: "系列",
      density: "密度",
      preview: "現在のシミュレーション",
    },
    en: {
      run: "Run Sweep",
      running: "Running",
      empty: "Select a preset and run the Density Sweep.",
      table: "Sweep results",
      series: "Series",
      density: "Density",
      preview: "Current simulation",
    },
  } as const;
  return labels[language][key];
}

function methodLabel(preset: PaperScanPreset, language: Language): string {
  if (preset.simulationMode === "billiard") {
    return language === "ja" ? "都度ビリヤード系を実行" : "Live billiard simulation";
  }
  return language === "ja" ? "都度PCAを実行" : "Live PCA simulation";
}

function stepLabel(preset: PaperScanPreset, language: Language): string {
  if (preset.simulationMode === "billiard") {
    return language === "ja" ? "physics steps / density" : "physics steps / density";
  }
  return "MC steps / density";
}

function systemSizeText(preset: PaperScanPreset, language: Language): string {
  if (preset.simulationMode === "billiard") {
    const fieldSize = preset.billiardFieldSize ?? 0;
    const radius = preset.billiardRadius ?? 0;
    const minDensity = Math.min(...preset.densities);
    const maxDensity = Math.max(...preset.densities);
    const minParticles = billiardParticleCountForDensity(preset, minDensity);
    const maxParticles = billiardParticleCountForDensity(preset, maxDensity);
    if (language === "ja") {
      return `領域: ${fieldSize} x ${fieldSize}, 半径: ${radius}, N: ${minParticles}-${maxParticles}`;
    }
    return `Field: ${fieldSize} x ${fieldSize}, radius ${radius}, N: ${minParticles}-${maxParticles}`;
  }

  if (language === "ja") {
    return `格子: ${preset.latticeSize} x ${preset.latticeSize}`;
  }
  return `Lattice: ${preset.latticeSize} x ${preset.latticeSize}`;
}

function methodNote(preset: PaperScanPreset, language: Language): string {
  if (preset.simulationMode === "billiard") {
    if (language === "ja") {
      return "表示値は事前計算ではありません。ビリヤードの density は円粒子の合計面積/領域面積として粒子数へ変換します。これは論文再現ではなく、同じルールを衝突系へ移した密度 Sweep 拡張実験です。";
    }
    return "Values are not precomputed. Billiard density is converted to particle count as total disk area over field area. This is an exploratory extension, not a paper reproduction.";
  }

  if (language === "ja") {
    return "表示値は事前計算ではありません。各密度でラティスPCAを実行します。現在はブラウザで待てる短時間の密度 Sweep で、論文級の完全収束計算ではありません。";
  }
  return "Values are not precomputed. The app runs a lattice PCA for each density. Current presets are short browser Sweeps, not publication-grade fully converged reruns.";
}

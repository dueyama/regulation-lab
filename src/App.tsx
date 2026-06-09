import { useEffect, useMemo, useRef, useState } from "react";
import { ExperimentCanvas } from "./components/ExperimentCanvas";
import { MultiModePanels } from "./components/MultiModePanels";
import { PaperScanView } from "./components/PaperScanView";
import { RatioChart } from "./components/RatioChart";
import regulationMark from "./assets/regulation-mark.png";
import {
  MODE_LABELS,
  RULE_LABELS,
  TEXT,
  describeRule,
  paperParametersForDisplay,
  type Language,
} from "./i18n";
import { createSimulation, DEFAULT_CONFIG, type ExperimentConfig, type ExperimentSnapshot } from "./sim";
import {
  PAPER_SCAN_PRESETS,
  paperScanConfig,
  type PaperScanPresetId,
  type PaperScanSeriesResult,
} from "./sim/paperScan";
import { PAPER_RULE_PARAMETERS, TRANSITION_RULES, theoreticalPA } from "./sim/transition";
import {
  DEFAULT_MULTI_MODE_CONFIG,
  MultiModeLatticeSimulation,
  expectedMultiModeRatios,
  type MultiModeConfig,
  type MultiModeSnapshot,
} from "./sim/multimode";
import type { SimulationMode, TransitionRuleId } from "./sim/types";

type TextLabels = (typeof TEXT)[keyof typeof TEXT];
type LanguageMode = "auto" | "ja" | "en";
type ParameterTab = "core" | "space" | "run";
type ViewMode = "live" | "paperScan" | "multiMode";
type ThemeMode = "dark" | "light";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [parameterTab, setParameterTab] = useState<ParameterTab>("core");
  const [paperPresetId, setPaperPresetId] = useState<PaperScanPresetId>("fig5_symmetric");
  const [scanResults, setScanResults] = useState<PaperScanSeriesResult[]>([]);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [scanPreview, setScanPreview] = useState<ExperimentSnapshot | null>(null);
  const [scanPreviewLabel, setScanPreviewLabel] = useState("");
  const [config, setConfig] = useState<ExperimentConfig>(DEFAULT_CONFIG);
  const [multiConfig, setMultiConfig] = useState<MultiModeConfig>(DEFAULT_MULTI_MODE_CONFIG);
  const runtimeRef = useRef(createSimulation(DEFAULT_CONFIG));
  const multiRuntimeRef = useRef(new MultiModeLatticeSimulation(DEFAULT_MULTI_MODE_CONFIG));
  const scanRunRef = useRef(0);
  const [snapshot, setSnapshot] = useState<ExperimentSnapshot>(() => runtimeRef.current.snapshot());
  const [multiSnapshot, setMultiSnapshot] = useState<MultiModeSnapshot>(() => multiRuntimeRef.current.snapshot());
  const [running, setRunning] = useState(false);
  const [multiRunning, setMultiRunning] = useState(false);
  const language = resolveLanguage(languageMode);
  const labels = TEXT[language];
  const selectedPaperPreset = PAPER_SCAN_PRESETS.find((preset) => preset.id === paperPresetId) ?? PAPER_SCAN_PRESETS[0];

  const configKey = useMemo(() => JSON.stringify(config), [config]);
  const multiConfigKey = useMemo(() => JSON.stringify(multiConfig), [multiConfig]);

  useEffect(() => {
    runtimeRef.current = createSimulation(config);
    setSnapshot(runtimeRef.current.snapshot());
    setRunning(false);
  }, [configKey]);

  useEffect(() => {
    multiRuntimeRef.current = new MultiModeLatticeSimulation(multiConfig);
    setMultiSnapshot(multiRuntimeRef.current.snapshot());
    setMultiRunning(false);
  }, [multiConfigKey]);

  useEffect(() => {
    if (!running) {
      return;
    }

    let frame = 0;
    const tick = () => {
      for (let step = 0; step < config.stepsPerFrame; step += 1) {
        runtimeRef.current.step();
      }
      setSnapshot(runtimeRef.current.snapshot());
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running, config.stepsPerFrame]);

  useEffect(() => {
    if (!multiRunning) {
      return;
    }

    let frame = 0;
    const tick = () => {
      for (let step = 0; step < multiConfig.stepsPerFrame; step += 1) {
        multiRuntimeRef.current.step();
      }
      setMultiSnapshot(multiRuntimeRef.current.snapshot());
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [multiRunning, multiConfig.stepsPerFrame]);

  useEffect(() => {
    setScanResults([]);
    setScanProgress("");
    setScanPreview(null);
    setScanPreviewLabel("");
    scanRunRef.current += 1;
    setScanRunning(false);
  }, [paperPresetId]);

  const theory = theoreticalPA(config);
  const multiTheory = expectedMultiModeRatios(multiConfig);

  const runSelectedPaperScan = async () => {
    const preset = selectedPaperPreset;
    const runId = scanRunRef.current + 1;
    scanRunRef.current = runId;
    setScanRunning(true);
    setScanProgress(`0/${preset.series.length * preset.densities.length}`);
    let completed = 0;
    let nextResults: PaperScanSeriesResult[] = preset.series.map((series) => ({
      id: series.id,
      labelJa: series.labelJa,
      labelEn: series.labelEn,
      color: series.color,
      dashed: series.dashed,
      points: [],
    }));
    setScanResults(nextResults);

    for (const series of preset.series) {
      for (const density of preset.densities) {
        if (scanRunRef.current !== runId) {
          return;
        }
        const scanConfig = paperScanConfig(preset, series, density);
        const simulation = createSimulation(scanConfig);
        const label =
          scanConfig.mode === "billiard"
            ? `${language === "ja" ? series.labelJa : series.labelEn} / density=${density.toFixed(1)} / N=${scanConfig.particleCount.toLocaleString()}`
            : `${language === "ja" ? series.labelJa : series.labelEn} / density=${density.toFixed(1)}`;
        let latestSnapshot = simulation.snapshot();
        setScanPreview(latestSnapshot);
        setScanPreviewLabel(label);

        for (let step = 0; step < preset.steps; step += 1) {
          if (scanRunRef.current !== runId) {
            return;
          }
          simulation.step();
          if (step % 25 === 0 || step === preset.steps - 1) {
            latestSnapshot = simulation.snapshot();
            setScanPreview(latestSnapshot);
            setScanPreviewLabel(`${label} / step=${latestSnapshot.step.toLocaleString()}`);
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          }
        }

        latestSnapshot = simulation.snapshot();
        const sample = latestSnapshot.latest;
        const point = {
          ...sample,
          density,
          seriesId: series.id,
          seriesLabelJa: series.labelJa,
          seriesLabelEn: series.labelEn,
          excludedVolume: series.excludedVolume,
          initialA: series.initialA,
        };
        nextResults = nextResults.map((result) =>
          result.id === series.id ? { ...result, points: [...result.points, point] } : result,
        );
        completed += 1;
        setScanResults(nextResults);
        setScanProgress(`${completed}/${preset.series.length * preset.densities.length}`);
        setScanPreview(latestSnapshot);
        setScanPreviewLabel(`${label} / done`);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
    }

    if (scanRunRef.current === runId) {
      setScanRunning(false);
    }
  };

  return (
    <div className={`app-shell theme-${themeMode}`}>
      <aside className="sidebar">
        <header className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img src={regulationMark} alt="" />
          </div>
          <div>
            <h1>{labels.title}</h1>
            <p>{labels.subtitle}</p>
          </div>
        </header>

        <ControlGroup title={labels.view}>
          <SegmentedControl
            className="view-tabs"
            value={viewMode}
            options={[
              { value: "live", label: labels.liveExperiment },
              { value: "paperScan", label: labels.paperScan },
              { value: "multiMode", label: labels.multiModeExperiment },
            ]}
            onChange={(nextView) => setViewMode(nextView)}
          />
        </ControlGroup>

        <ControlGroup title={labels.appearance}>
          <SegmentedControl
            value={themeMode}
            options={[
              { value: "dark", label: labels.darkMode },
              { value: "light", label: labels.lightMode },
            ]}
            onChange={(nextTheme) => setThemeMode(nextTheme)}
          />
        </ControlGroup>

        {viewMode === "live" ? (
          <>
        <ControlGroup title={labels.mode}>
          <SegmentedControl
            value={config.mode}
            options={(["lattice", "billiard"] as SimulationMode[]).map((mode) => ({
              value: mode,
              label: MODE_LABELS[language][mode],
            }))}
            onChange={(mode) => updateConfig(setConfig, { mode })}
          />
        </ControlGroup>

        <ControlGroup title={labels.transitionRule}>
          <select
            value={config.rule}
            onChange={(event) => updateRuleWithPaperParameters(setConfig, event.target.value as TransitionRuleId)}
          >
            {(["basic_1_1", "asymmetric_1_2", "asymmetric_2_0"] as TransitionRuleId[]).map((rule) => (
              <option key={rule} value={rule}>
                {RULE_LABELS[language][rule]}
              </option>
            ))}
          </select>
          <div className="rule-card">
            <TwoStateFormula rule={config.rule} compact />
            <p>{describeRule(config.rule, language)}</p>
            <div className="paper-parameters">
              <span>{labels.paperParameters}</span>
              <small>{paperParametersForDisplay(config.rule)}</small>
            </div>
          </div>
        </ControlGroup>

        <ControlGroup title={labels.parameters}>
          <SegmentedControl
            className="parameter-tabs"
            value={parameterTab}
            options={[
              { value: "core", label: labels.coreParameters },
              { value: "space", label: labels.spaceParameters },
              { value: "run", label: labels.runParameters },
            ]}
            onChange={(tab) => setParameterTab(tab)}
          />

          <div className="parameter-panel">
            {parameterTab === "core" && (
              <>
                <NumberSlider
                  label={labels.alpha}
                  value={config.alpha}
                  min={0}
                  max={1}
                  step={0.01}
                  accent="blue"
                  onChange={(alpha) => updateConfig(setConfig, { alpha })}
                />
                <NumberSlider
                  label={labels.beta}
                  value={config.beta}
                  min={0}
                  max={1}
                  step={0.01}
                  accent="red"
                  onChange={(beta) => updateConfig(setConfig, { beta })}
                />
                <NumberSlider
                  label={labels.initialA}
                  value={config.initialA}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(initialA) => updateConfig(setConfig, { initialA })}
                />
              </>
            )}

            {parameterTab === "space" && config.mode === "lattice" && (
              <>
                <NumberSlider
                  label={labels.density}
                  value={config.density}
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  onChange={(density) => updateConfig(setConfig, { density })}
                />
                <NumberSlider
                  label={labels.latticeSize}
                  value={config.latticeSize}
                  min={20}
                  max={100}
                  step={1}
                  onChange={(latticeSize) => updateConfig(setConfig, { latticeSize })}
                />
                <label className="toggle-row">
                  <span>{labels.excludedVolume}</span>
                  <button
                    type="button"
                    className={config.excludedVolume ? "toggle active" : "toggle"}
                    onClick={() => updateConfig(setConfig, { excludedVolume: !config.excludedVolume })}
                  >
                    {config.excludedVolume ? labels.excludedVolumeOn : labels.excludedVolumeOff}
                  </button>
                </label>
                <p className="control-help">{labels.excludedVolumeMeaning}</p>
              </>
            )}

            {parameterTab === "space" && config.mode === "billiard" && (
              <>
                <NumberSlider
                  label={labels.particleCount}
                  value={config.particleCount}
                  min={80}
                  max={1200}
                  step={10}
                  onChange={(particleCount) => updateConfig(setConfig, { particleCount })}
                />
                <NumberSlider
                  label={labels.radius}
                  value={config.radius}
                  min={3}
                  max={14}
                  step={0.5}
                  onChange={(radius) => updateConfig(setConfig, { radius })}
                />
                <NumberSlider
                  label={labels.velocity}
                  value={config.velocity}
                  min={0.2}
                  max={6}
                  step={0.1}
                  onChange={(velocity) => updateConfig(setConfig, { velocity })}
                />
                <NumberSlider
                  label={labels.restitution}
                  value={config.restitution}
                  min={0.6}
                  max={1}
                  step={0.01}
                  onChange={(restitution) => updateConfig(setConfig, { restitution })}
                />
                <NumberSlider
                  label={labels.fieldSize}
                  value={config.fieldSize}
                  min={420}
                  max={1000}
                  step={10}
                  onChange={(fieldSize) => updateConfig(setConfig, { fieldSize })}
                />
              </>
            )}

            {parameterTab === "run" && (
              <>
                <label className="seed-field">
                  <span>{labels.seed}</span>
                  <input
                    type="number"
                    value={config.seed}
                    onChange={(event) => updateConfig(setConfig, { seed: Number(event.target.value) || 1 })}
                  />
                </label>
                <NumberSlider
                  label={labels.stepsPerFrame}
                  value={config.stepsPerFrame}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(stepsPerFrame) => updateConfig(setConfig, { stepsPerFrame })}
                />
              </>
            )}
          </div>
        </ControlGroup>
          </>
        ) : viewMode === "paperScan" ? (
          <>
            <ControlGroup title={labels.paperPreset}>
              <select
                value={paperPresetId}
                onChange={(event) => setPaperPresetId(event.target.value as PaperScanPresetId)}
              >
                {PAPER_SCAN_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.figure}: {language === "ja" ? preset.titleJa : preset.titleEn}
                  </option>
                ))}
              </select>
              <div className="rule-card">
                <strong>{selectedPaperPreset.figure}</strong>
                <p>{language === "ja" ? selectedPaperPreset.summaryJa : selectedPaperPreset.summaryEn}</p>
              </div>
              <button className="primary-action sidebar-run-button" onClick={runSelectedPaperScan} disabled={scanRunning}>
                {scanRunning ? labels.scanRunning : labels.runScan}
              </button>
              <p className="control-help">
                {labels.scanProgress}: {scanProgress || labels.scanNotRun}
              </p>
            </ControlGroup>
          </>
        ) : (
          <>
            <ControlGroup title={labels.multiModeRule}>
              <div className="rule-card">
                <FourStateFormula compact />
                <p>{labels.multiModeExplanation}</p>
                <div className="paper-parameters">
                  <span>Fig. 9</span>
                  <small>{labels.multiModeCaption}</small>
                </div>
              </div>
            </ControlGroup>

            <ControlGroup title={labels.parameters}>
              <SegmentedControl
                className="parameter-tabs"
                value={parameterTab}
                options={[
                  { value: "core", label: labels.coreParameters },
                  { value: "space", label: labels.spaceParameters },
                  { value: "run", label: labels.runParameters },
                ]}
                onChange={(tab) => setParameterTab(tab)}
              />

              <div className="parameter-panel">
                {parameterTab === "core" && (
                  <>
                    <NumberSlider
                      label={labels.alpha}
                      value={multiConfig.alpha}
                      min={0}
                      max={1}
                      step={0.01}
                      accent="blue"
                      onChange={(alpha) => updateMultiConfig(setMultiConfig, { alpha })}
                    />
                    <NumberSlider
                      label={labels.beta}
                      value={multiConfig.beta}
                      min={0}
                      max={1}
                      step={0.01}
                      accent="red"
                      onChange={(beta) => updateMultiConfig(setMultiConfig, { beta })}
                    />
                    <NumberSlider
                      label={labels.gamma}
                      value={multiConfig.gamma}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(gamma) => updateMultiConfig(setMultiConfig, { gamma })}
                    />
                    <NumberSlider
                      label={labels.delta}
                      value={multiConfig.delta}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(delta) => updateMultiConfig(setMultiConfig, { delta })}
                    />
                    <NumberSlider
                      label={labels.initialA}
                      value={multiConfig.initialA}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(initialA) => updateMultiConfig(setMultiConfig, { initialA })}
                    />
                    <NumberSlider
                      label={labels.initialC}
                      value={multiConfig.initialC}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(initialC) => updateMultiConfig(setMultiConfig, { initialC })}
                    />
                  </>
                )}

                {parameterTab === "space" && (
                  <>
                    <NumberSlider
                      label={labels.density}
                      value={multiConfig.density}
                      min={0.05}
                      max={0.95}
                      step={0.01}
                      onChange={(density) => updateMultiConfig(setMultiConfig, { density })}
                    />
                    <NumberSlider
                      label={labels.latticeSize}
                      value={multiConfig.latticeSize}
                      min={20}
                      max={100}
                      step={1}
                      onChange={(latticeSize) => updateMultiConfig(setMultiConfig, { latticeSize })}
                    />
                    <label className="toggle-row">
                      <span>{labels.excludedVolume}</span>
                      <button
                        type="button"
                        className={multiConfig.excludedVolume ? "toggle active" : "toggle"}
                        onClick={() => updateMultiConfig(setMultiConfig, { excludedVolume: !multiConfig.excludedVolume })}
                      >
                        {multiConfig.excludedVolume ? labels.excludedVolumeOn : labels.excludedVolumeOff}
                      </button>
                    </label>
                    <p className="control-help">{labels.excludedVolumeMeaning}</p>
                  </>
                )}

                {parameterTab === "run" && (
                  <>
                    <label className="seed-field">
                      <span>{labels.seed}</span>
                      <input
                        type="number"
                        value={multiConfig.seed}
                        onChange={(event) => updateMultiConfig(setMultiConfig, { seed: Number(event.target.value) || 1 })}
                      />
                    </label>
                    <NumberSlider
                      label={labels.stepsPerFrame}
                      value={multiConfig.stepsPerFrame}
                      min={1}
                      max={20}
                      step={1}
                      onChange={(stepsPerFrame) => updateMultiConfig(setMultiConfig, { stepsPerFrame })}
                    />
                  </>
                )}
              </div>
            </ControlGroup>
          </>
        )}
      </aside>

      <main className="workspace">
        {viewMode === "live" ? (
          <>
        <section className="command-strip">
          <div className="command-state">
            <span>{statusText(language, "modelStatus")}</span>
            <strong>{running ? statusText(language, "running") : statusText(language, "paused")}</strong>
          </div>
          <div className="run-controls">
            <button className="primary-action" onClick={() => setRunning(true)} disabled={running}>
              <span className="play-icon" aria-hidden="true" />
              {labels.run}
            </button>
            <button onClick={() => setRunning(false)} disabled={!running}>
              <span className="pause-icon" aria-hidden="true" />
              {labels.pause}
            </button>
            <button
              className="reset-action"
              onClick={() => {
                runtimeRef.current = createSimulation(config);
                setSnapshot(runtimeRef.current.snapshot());
                setRunning(false);
              }}
            >
              <span className="reset-icon" aria-hidden="true" />
              {labels.reset}
            </button>
          </div>
          <div className="status-strip">
            <Metric label={labels.pA} value={snapshot.latest.pA.toFixed(3)} tone="blue" />
            <Metric label={labels.pB} value={snapshot.latest.pB.toFixed(3)} tone="red" />
            <Metric label={labels.ratioBA} value={formatRatio(snapshot.latest.ratioBA)} />
            <Metric label={labels.step} value={snapshot.latest.step.toLocaleString()} />
          </div>
          <SegmentedControl
            className="language-control"
            value={languageMode}
            options={[
              { value: "auto", label: "Auto" },
              { value: "ja", label: "JP" },
              { value: "en", label: "EN" },
            ]}
            onChange={(nextLanguage) => setLanguageMode(nextLanguage)}
          />
        </section>

        <div className="main-grid">
          <ExperimentCanvas
            snapshot={snapshot}
            caption={snapshot.mode === "lattice" ? labels.canvasCaptionLattice : labels.canvasCaptionBilliard}
            legendA={labels.legendA}
            legendB={labels.legendB}
          />
          <div className="right-column">
            <RatioChart
              samples={snapshot.samples}
              title={labels.ratioSeries}
              pALabel={labels.pA}
              pBLabel={labels.pB}
              note={labels.chartNote}
            />
            <SummaryPanel labels={labels} snapshot={snapshot} theory={theory} />
          </div>
        </div>

        <section className="bottom-grid">
          <div className="experiment-panel explanation-panel">
            <h2>{labels.ruleExplanation}</h2>
            <p>{labels.localContact}</p>
            <div className="formula-row">
              <TwoStateFormula rule={config.rule} />
            </div>
            <p>{describeRule(config.rule, language)}</p>
          </div>
          <div className="experiment-panel reference-panel">
            <h2>{labels.reference}</h2>
            <p>{labels.paperCitation}</p>
            <a href="https://doi.org/10.1016/j.jtbi.2017.12.028" target="_blank" rel="noreferrer">
              https://doi.org/10.1016/j.jtbi.2017.12.028
            </a>
            <CopyrightNotice />
          </div>
        </section>
          </>
        ) : viewMode === "paperScan" ? (
          <PaperScanView
            preset={selectedPaperPreset}
            results={scanResults}
            language={language}
            running={scanRunning}
            progressLabel={scanProgress || labels.scanNotRun}
            preview={scanPreview}
            previewLabel={scanPreviewLabel}
            onRun={runSelectedPaperScan}
          />
        ) : (
          <>
            <section className="command-strip">
              <div className="command-state">
                <span>{statusText(language, "modelStatus")}</span>
                <strong>{multiRunning ? statusText(language, "running") : statusText(language, "paused")}</strong>
              </div>
              <div className="run-controls">
                <button className="primary-action" onClick={() => setMultiRunning(true)} disabled={multiRunning}>
                  <span className="play-icon" aria-hidden="true" />
                  {labels.run}
                </button>
                <button onClick={() => setMultiRunning(false)} disabled={!multiRunning}>
                  <span className="pause-icon" aria-hidden="true" />
                  {labels.pause}
                </button>
                <button
                  className="reset-action"
                  onClick={() => {
                    multiRuntimeRef.current = new MultiModeLatticeSimulation(multiConfig);
                    setMultiSnapshot(multiRuntimeRef.current.snapshot());
                    setMultiRunning(false);
                  }}
                >
                  <span className="reset-icon" aria-hidden="true" />
                  {labels.reset}
                </button>
              </div>
              <div className="status-strip">
                <Metric label="AC" value={multiSnapshot.latest.pAC.toFixed(3)} tone="blue" />
                <Metric label="AD" value={multiSnapshot.latest.pAD.toFixed(3)} tone="green" />
                <Metric label="BC" value={multiSnapshot.latest.pBC.toFixed(3)} tone="amber" />
                <Metric label="BD" value={multiSnapshot.latest.pBD.toFixed(3)} tone="red" />
              </div>
              <SegmentedControl
                className="language-control"
                value={languageMode}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "ja", label: "JP" },
                  { value: "en", label: "EN" },
                ]}
                onChange={(nextLanguage) => setLanguageMode(nextLanguage)}
              />
            </section>

            <MultiModePanels snapshot={multiSnapshot} config={multiConfig} language={language} />

            <section className="bottom-grid">
              <div className="experiment-panel explanation-panel">
                <h2>{labels.multiModeRule}</h2>
                <p>{labels.multiModeExplanation}</p>
                <div className="formula-row">
                  <FourStateFormula />
                </div>
                <p>
                  AC={multiTheory.pAC.toFixed(3)}, AD={multiTheory.pAD.toFixed(3)}, BC={multiTheory.pBC.toFixed(3)}, BD=
                  {multiTheory.pBD.toFixed(3)}
                </p>
              </div>
              <div className="experiment-panel reference-panel">
                <h2>{labels.reference}</h2>
                <p>{labels.paperCitation}</p>
                <a href="https://doi.org/10.1016/j.jtbi.2017.12.028" target="_blank" rel="noreferrer">
                  https://doi.org/10.1016/j.jtbi.2017.12.028
                </a>
                <CopyrightNotice />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function updateConfig(
  setConfig: (updater: (current: ExperimentConfig) => ExperimentConfig) => void,
  patch: Partial<ExperimentConfig>,
) {
  setConfig((current) => ({ ...current, ...patch }));
}

function updateMultiConfig(
  setConfig: (updater: (current: MultiModeConfig) => MultiModeConfig) => void,
  patch: Partial<MultiModeConfig>,
) {
  setConfig((current) => ({ ...current, ...patch }));
}

function CopyrightNotice() {
  return <p className="copyright-notice">© 2026 dueyama. Released under the MIT License.</p>;
}

function updateRuleWithPaperParameters(
  setConfig: (updater: (current: ExperimentConfig) => ExperimentConfig) => void,
  rule: TransitionRuleId,
) {
  const preset = PAPER_RULE_PARAMETERS[rule];
  updateConfig(setConfig, { rule, alpha: preset.alpha, beta: preset.beta });
}

function TwoStateFormula({ rule, compact = false }: { rule: TransitionRuleId; compact?: boolean }) {
  const preset = TRANSITION_RULES[rule];
  return (
    <div className={`formula-typeset ${compact ? "compact" : ""}`} aria-label={`A plus ${preset.m}B to B, B plus ${preset.n}B to A`}>
      <FormulaPair
        first={<FormulaReaction left={<FormulaTerm first="A" second={coefficient("B", preset.m)} />} probability="alpha" right="B" />}
        second={<FormulaReaction left={<FormulaTerm first="B" second={coefficient("B", preset.n)} />} probability="beta" right="A" />}
      />
    </div>
  );
}

function FourStateFormula({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`formula-typeset four-state-formula ${compact ? "compact" : ""}`} aria-label="Independent A/B and C/D switching rules">
      <div className="formula-axis">
        <span>A/B</span>
        <FormulaPair
          first={<FormulaReaction left={<FormulaTerm first="A" second="B" />} probability="alpha" right="B" />}
          second={<FormulaReaction left={<FormulaTerm first="B" second="B" />} probability="beta" right="A" />}
        />
      </div>
      <div className="formula-axis">
        <span>C/D</span>
        <FormulaPair
          first={<FormulaReaction left={<FormulaTerm first="C" second="D" />} probability="gamma" right="D" />}
          second={<FormulaReaction left={<FormulaTerm first="D" second="D" />} probability="delta" right="C" />}
        />
      </div>
    </div>
  );
}

function FormulaPair({ first, second }: { first: React.ReactNode; second: React.ReactNode }) {
  return (
    <span className="formula-pair">
      {first}
      <span className="formula-comma">,</span>
      {second}
    </span>
  );
}

function FormulaReaction({
  left,
  probability,
  right,
}: {
  left: React.ReactNode;
  probability: "alpha" | "beta" | "gamma" | "delta";
  right: string;
}) {
  return (
    <span className="formula-reaction">
      <span className="formula-side">{left}</span>
      <span className="reaction-arrow">
        <span>{greekProbability(probability)}</span>
        <i />
      </span>
      <FormulaSymbol value={right} />
    </span>
  );
}

function FormulaTerm({ first, second }: { first: string; second: string }) {
  return (
    <>
      <FormulaSymbol value={first} />
      <span className="formula-plus">+</span>
      <FormulaSymbol value={second} />
    </>
  );
}

function FormulaSymbol({ value }: { value: string }) {
  const coefficientPart = value.match(/^([0-9]+)([A-D])$/);
  if (coefficientPart) {
    return (
      <span className="formula-symbol">
        <span className="formula-coefficient">{coefficientPart[1]}</span>
        <var>{coefficientPart[2]}</var>
      </span>
    );
  }

  return (
    <span className="formula-symbol">
      <var>{value}</var>
    </span>
  );
}

function coefficient(symbol: string, count: number): string {
  return count === 1 ? symbol : `${count}${symbol}`;
}

function greekProbability(probability: "alpha" | "beta" | "gamma" | "delta"): string {
  return {
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
  }[probability];
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="control-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`segmented-control ${className ?? ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? "active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent?: "blue" | "red";
  onChange: (value: number) => void;
}) {
  return (
    <label className={`number-slider ${accent ?? ""}`}>
      <span>{label}</span>
      <input
        className="number-field"
        type="number"
        value={formatControlValue(value, step)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
      />
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "blue" | "red" | "green" | "amber" }) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryPanel({
  labels,
  snapshot,
  theory,
}: {
  labels: TextLabels;
  snapshot: ExperimentSnapshot;
  theory: number | null;
}) {
  const rows = [
    [labels.step, snapshot.latest.step.toLocaleString()],
    [labels.total, (snapshot.latest.a + snapshot.latest.b).toLocaleString()],
    [labels.countA, snapshot.latest.a.toLocaleString()],
    [labels.countB, snapshot.latest.b.toLocaleString()],
    [labels.pA, snapshot.latest.pA.toFixed(3)],
    [labels.pB, snapshot.latest.pB.toFixed(3)],
    [labels.ratioBA, formatRatio(snapshot.latest.ratioBA)],
    [labels.theory, theory === null ? labels.noTheory : theory.toFixed(3)],
  ];

  return (
    <section className="experiment-panel summary-panel">
      <h2>{labels.currentSummary}</h2>
      <table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function formatRatio(value: number): string {
  if (!Number.isFinite(value)) {
    return "∞";
  }
  return value.toFixed(3);
}

function formatControlValue(value: number, step: number): string | number {
  return step < 1 ? value.toFixed(2) : Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function resolveLanguage(mode: LanguageMode): Language {
  if (mode !== "auto") {
    return mode;
  }
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "ja";
}

function statusText(language: Language, key: "modelStatus" | "running" | "paused"): string {
  const table = {
    ja: {
      modelStatus: "モデル状態",
      running: "実行中",
      paused: "停止中",
    },
    en: {
      modelStatus: "Model status",
      running: "Running",
      paused: "Paused",
    },
  } as const;
  return table[language][key];
}

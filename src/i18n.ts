import { PAPER_RULE_PARAMETERS, transitionFormula, TRANSITION_RULES } from "./sim/transition";
import type { SimulationMode, TransitionRuleId } from "./sim/types";

export type Language = "ja" | "en";

export const MODE_LABELS: Record<Language, Record<SimulationMode, string>> = {
  ja: {
    lattice: "ラティス系 PCA",
    billiard: "ビリヤード粒子系",
  },
  en: {
    lattice: "Lattice PCA",
    billiard: "Billiard particles",
  },
};

export const RULE_LABELS: Record<Language, Record<TransitionRuleId, string>> = {
  ja: {
    basic_1_1: "基本形 (m,n) = (1,1)",
    asymmetric_1_2: "非対称 (m,n) = (1,2)",
    asymmetric_2_0: "非対称 (m,n) = (2,0)",
  },
  en: {
    basic_1_1: "Basic (m,n) = (1,1)",
    asymmetric_1_2: "Asymmetric (m,n) = (1,2)",
    asymmetric_2_0: "Asymmetric (m,n) = (2,0)",
  },
};

export const TEXT = {
  ja: {
    title: "Regulation Lab",
    subtitle: "自己組織的レギュレーション実験ツール",
    githubRepository: "GitHub リポジトリ",
    view: "ビュー",
    appearance: "外観",
    darkMode: "Dark",
    lightMode: "Light",
    liveExperiment: "単発実験",
    paperScan: "密度 Sweep",
    multiModeExperiment: "4状態",
    mode: "モード",
    transitionRule: "遷移ルール",
    paperParameters: "論文値",
    parameters: "パラメータ",
    coreParameters: "基本",
    spaceParameters: "空間",
    runParameters: "実行",
    latticeParameters: "ラティス系パラメータ",
    billiardParameters: "ビリヤード系パラメータ",
    alpha: "α (A→B)",
    beta: "β (B→A)",
    gamma: "γ (C→D)",
    delta: "δ (D→C)",
    density: "密度",
    initialA: "初期A比率",
    initialC: "初期C比率",
    latticeSize: "格子サイズ",
    excludedVolume: "排除体積",
    excludedVolumeOn: "あり",
    excludedVolumeOff: "なし",
    particleCount: "粒子数",
    radius: "半径",
    velocity: "速度",
    restitution: "反発係数",
    fieldSize: "領域サイズ",
    stepsPerFrame: "速度",
    seed: "乱数シード",
    language: "言語",
    run: "実行",
    runScan: "密度 Sweep 実行",
    scanRunning: "計算中",
    scanProgress: "進捗",
    scanNotRun: "未実行",
    pause: "一時停止",
    reset: "リセット",
    ratioSeries: "比率の時系列",
    currentSummary: "現在のサマリー",
    ratioBars: "比率の棒グラフ",
    step: "ステップ",
    total: "総数 N",
    countA: "A の数",
    countB: "B の数",
    pA: "pA (A比率)",
    pB: "pB (B比率)",
    ratioBA: "B / A",
    theory: "理論平衡 pA",
    noTheory: "非対称ルールは密度依存を観察",
    ruleExplanation: "ルールの説明",
    paperPreset: "実験プリセット",
    reference: "参考文献",
    multiModeRule: "4状態ルール",
    multiModeCaption: "Fig. 9 型の4状態ラティス PCA",
    multiModeExplanation:
      "独立な A/B レギュレーションと C/D レギュレーションを組み合わせ、各個体を AC, AD, BC, BD の4状態として扱います。",
    multiModeFormula: "A/B: A + B → B, B + B → A; C/D: C + D → D, D + D → C",
    chartNote: "折れ線は0-1スケールの pA と pB のみ。右の1本棒は現在のA/B構成、B/Aはサマリーに表示。",
    canvasCaptionLattice: "ラティス系 PCA (反射境界)",
    canvasCaptionBilliard: "ビリヤード粒子系 (Matter.js)",
    legendA: "A (青)",
    legendB: "B (赤)",
    localContact: "局所接触に基づく確率的な状態更新",
    excludedVolumeMeaning: "排除体積ありでは1格子1個体、なしでは同じ格子点への重なりを許します。",
    paperCitation:
      "Iwamoto, M. & Ueyama, D. (2018). Basis of self-organized proportion regulation resulting from local contacts. Journal of Theoretical Biology, 440, 112-120.",
  },
  en: {
    title: "Regulation Lab",
    subtitle: "Self-organized proportion regulation experiments",
    githubRepository: "GitHub repository",
    view: "View",
    appearance: "Appearance",
    darkMode: "Dark",
    lightMode: "Light",
    liveExperiment: "Live run",
    paperScan: "Density Sweep",
    multiModeExperiment: "4-state",
    mode: "Mode",
    transitionRule: "Transition rule",
    paperParameters: "Paper values",
    parameters: "Parameters",
    coreParameters: "Core",
    spaceParameters: "Space",
    runParameters: "Run",
    latticeParameters: "Lattice parameters",
    billiardParameters: "Billiard parameters",
    alpha: "α (A→B)",
    beta: "β (B→A)",
    gamma: "γ (C→D)",
    delta: "δ (D→C)",
    density: "Density",
    initialA: "Initial A ratio",
    initialC: "Initial C ratio",
    latticeSize: "Lattice size",
    excludedVolume: "Excluded volume",
    excludedVolumeOn: "On",
    excludedVolumeOff: "Off",
    particleCount: "Particle count",
    radius: "Radius",
    velocity: "Velocity",
    restitution: "Restitution",
    fieldSize: "Field size",
    stepsPerFrame: "Speed",
    seed: "Random seed",
    language: "Language",
    run: "Run",
    runScan: "Run Sweep",
    scanRunning: "Running",
    scanProgress: "Progress",
    scanNotRun: "Not run",
    pause: "Pause",
    reset: "Reset",
    ratioSeries: "Ratio time series",
    currentSummary: "Current summary",
    ratioBars: "Ratio bars",
    step: "Step",
    total: "Total N",
    countA: "A count",
    countB: "B count",
    pA: "pA (A ratio)",
    pB: "pB (B ratio)",
    ratioBA: "B / A",
    theory: "Theoretical pA",
    noTheory: "Asymmetric rule: inspect density dependence",
    ruleExplanation: "Rule explanation",
    paperPreset: "Experiment preset",
    reference: "Reference",
    multiModeRule: "Four-state rule",
    multiModeCaption: "Fig. 9-style four-state lattice PCA",
    multiModeExplanation:
      "The experiment combines independent A/B and C/D regulation axes, so each individual has one of four modes: AC, AD, BC, or BD.",
    multiModeFormula: "A/B: A + B → B, B + B → A; C/D: C + D → D, D + D → C",
    chartNote: "Lines show only pA and pB on the 0-1 scale. The single bar shows the current A/B mix; B/A stays in the summary.",
    canvasCaptionLattice: "Lattice PCA (reflective boundary)",
    canvasCaptionBilliard: "Billiard particles (Matter.js)",
    legendA: "A (blue)",
    legendB: "B (red)",
    localContact: "Probabilistic state update from local contacts",
    excludedVolumeMeaning: "Excluded volume on allows one individual per site; off allows overlap on the same site.",
    paperCitation:
      "Iwamoto, M. & Ueyama, D. (2018). Basis of self-organized proportion regulation resulting from local contacts. Journal of Theoretical Biology, 440, 112-120.",
  },
} as const;

export function describeRule(ruleId: TransitionRuleId, language: Language): string {
  const rule = TRANSITION_RULES[ruleId];
  if (language === "ja") {
    return `A個体が少なくとも${rule.m}個のBと局所接触すると確率 α でBへ、B個体が少なくとも${rule.n}個のBと局所接触すると確率 β でAへ変わります。`;
  }
  return `An A individual turns B with probability α when it has at least ${rule.m} local B contacts; a B individual turns A with probability β when it has at least ${rule.n} local B contacts.`;
}

export function formulaForDisplay(ruleId: TransitionRuleId): string {
  return transitionFormula(ruleId);
}

export function paperParametersForDisplay(ruleId: TransitionRuleId): string {
  const preset = PAPER_RULE_PARAMETERS[ruleId];
  return `α=${preset.alpha}, β=${preset.beta}; ${preset.source}; ${preset.context}`;
}

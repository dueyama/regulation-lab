import { BilliardSimulation } from "./billiard";
import { LatticeSimulation } from "./lattice";
import { PAPER_RULE_PARAMETERS } from "./transition";
import {
  DEFAULT_CONFIG,
  type ExperimentConfig,
  type ExperimentSample,
  type SimulationRuntime,
  type TransitionRuleId,
} from "./types";

export type PaperScanPresetId =
  | "fig5_symmetric"
  | "fig7a_asymmetric_1_2"
  | "fig7b_asymmetric_2_0"
  | "fig8_eve"
  | "billiard_basic_1_1"
  | "billiard_asymmetric_1_2"
  | "billiard_asymmetric_2_0";

export interface PaperScanSeriesPreset {
  id: string;
  labelJa: string;
  labelEn: string;
  color: string;
  dashed?: boolean;
  excludedVolume: boolean;
  initialA: number;
}

export interface PaperScanPreset {
  id: PaperScanPresetId;
  figure: string;
  simulationMode: "lattice" | "billiard";
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  rule: TransitionRuleId;
  latticeSize: number;
  billiardFieldSize?: number;
  billiardRadius?: number;
  billiardVelocity?: number;
  billiardRestitution?: number;
  densities: number[];
  steps: number;
  series: PaperScanSeriesPreset[];
}

export interface PaperScanPoint extends ExperimentSample {
  density: number;
  seriesId: string;
  seriesLabelJa: string;
  seriesLabelEn: string;
  excludedVolume: boolean;
  initialA: number;
}

export interface PaperScanSeriesResult {
  id: string;
  labelJa: string;
  labelEn: string;
  color: string;
  dashed?: boolean;
  points: PaperScanPoint[];
}

export const PAPER_DENSITIES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
export const BILLIARD_DENSITIES = PAPER_DENSITIES;
const BILLIARD_SWEEP_STEPS = 600;

export const PAPER_SCAN_PRESETS: PaperScanPreset[] = [
  {
    id: "fig5_symmetric",
    figure: "Fig. 5",
    titleJa: "対称系 (1,1): 密度非依存",
    titleEn: "Symmetric (1,1): density independent",
    summaryJa: "論文 Fig.5。α=0.2, β=0.8。密度を変えても pA はおおむね 0.8 に保たれる。",
    summaryEn: "Paper Fig. 5. α=0.2, β=0.8. pA stays near 0.8 across density.",
    simulationMode: "lattice",
    rule: "basic_1_1",
    latticeSize: 100,
    densities: PAPER_DENSITIES,
    steps: 220,
    series: [
      {
        id: "eve_on_a0_0",
        labelJa: "排除体積あり / 初期A 0%",
        labelEn: "EVE on / initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
    ],
  },
  {
    id: "fig7a_asymmetric_1_2",
    figure: "Fig. 7a",
    titleJa: "非対称系 (1,2): 密度依存",
    titleEn: "Asymmetric (1,2): density dependence",
    summaryJa: "論文 Fig.7a。α=0.01, β=1.0。非対称接触により収束比率が密度に依存する。",
    summaryEn: "Paper Fig. 7a. α=0.01, β=1.0. Asymmetric contacts make the final ratio density dependent.",
    simulationMode: "lattice",
    rule: "asymmetric_1_2",
    latticeSize: 100,
    densities: PAPER_DENSITIES,
    steps: 260,
    series: [
      {
        id: "eve_on_a0_0",
        labelJa: "排除体積あり / 初期A 0%",
        labelEn: "EVE on / initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
    ],
  },
  {
    id: "fig7b_asymmetric_2_0",
    figure: "Fig. 7b + Appendix B",
    titleJa: "非対称系 (2,0): 双安定性",
    titleEn: "Asymmetric (2,0): bistability",
    summaryJa: "論文 Fig.7b と Appendix B。α=0.8, β=0.2。低密度ではAのみへ、高密度では初期値依存の枝が現れる。",
    summaryEn:
      "Paper Fig. 7b and Appendix B. α=0.8, β=0.2. Low density tends toward all A; high density can show initial-condition-dependent branches.",
    simulationMode: "lattice",
    rule: "asymmetric_2_0",
    latticeSize: 100,
    densities: PAPER_DENSITIES,
    steps: 260,
    series: [
      {
        id: "eve_on_a0_0",
        labelJa: "排除体積あり / 初期A 0%",
        labelEn: "EVE on / initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
      {
        id: "eve_on_a0_80",
        labelJa: "排除体積あり / 初期A 80%",
        labelEn: "EVE on / initial A 80%",
        color: "#ed253c",
        dashed: true,
        excludedVolume: true,
        initialA: 0.8,
      },
    ],
  },
  {
    id: "fig8_eve",
    figure: "Fig. 8",
    titleJa: "排除体積比較 (1,2)",
    titleEn: "Excluded-volume comparison (1,2)",
    summaryJa: "論文 Fig.8。α=0.01, β=1.0。排除体積あり/なしで密度依存曲線が変わる。",
    summaryEn: "Paper Fig. 8. α=0.01, β=1.0. EVE on/off changes the density-dependence curve.",
    simulationMode: "lattice",
    rule: "asymmetric_1_2",
    latticeSize: 100,
    densities: PAPER_DENSITIES,
    steps: 260,
    series: [
      {
        id: "eve_on",
        labelJa: "排除体積あり",
        labelEn: "EVE on",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
      {
        id: "eve_off",
        labelJa: "排除体積なし",
        labelEn: "EVE off",
        color: "#ed253c",
        dashed: true,
        excludedVolume: false,
        initialA: 0,
      },
    ],
  },
  {
    id: "billiard_basic_1_1",
    figure: "Billiard extension",
    titleJa: "ビリヤード拡張 (1,1): 面積密度",
    titleEn: "Billiard extension (1,1): area density",
    summaryJa:
      "論文外の拡張実験。density を円粒子の合計面積/領域面積として粒子数に変換し、衝突接触による (1,1) の密度 Sweep を見る。",
    summaryEn:
      "Exploratory extension outside the paper. It converts density to particle count as total disk area over field area, then sweeps collision-driven (1,1) contacts.",
    simulationMode: "billiard",
    rule: "basic_1_1",
    latticeSize: 100,
    billiardFieldSize: 420,
    billiardRadius: 8,
    billiardVelocity: 3.2,
    billiardRestitution: 1,
    densities: BILLIARD_DENSITIES,
    steps: BILLIARD_SWEEP_STEPS,
    series: [
      {
        id: "billiard_a0_0",
        labelJa: "初期A 0%",
        labelEn: "initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
    ],
  },
  {
    id: "billiard_asymmetric_1_2",
    figure: "Billiard extension",
    titleJa: "ビリヤード拡張 (1,2): 面積密度",
    titleEn: "Billiard extension (1,2): area density",
    summaryJa:
      "論文外の拡張実験。density を円粒子の合計面積/領域面積として粒子数に変換し、非対称 (1,2) ルールの密度依存を衝突系で見る。",
    summaryEn:
      "Exploratory extension outside the paper. It converts density to particle count as total disk area over field area and tests the asymmetric (1,2) collision rule.",
    simulationMode: "billiard",
    rule: "asymmetric_1_2",
    latticeSize: 100,
    billiardFieldSize: 420,
    billiardRadius: 8,
    billiardVelocity: 3.2,
    billiardRestitution: 1,
    densities: BILLIARD_DENSITIES,
    steps: BILLIARD_SWEEP_STEPS,
    series: [
      {
        id: "billiard_a0_0",
        labelJa: "初期A 0%",
        labelEn: "initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
    ],
  },
  {
    id: "billiard_asymmetric_2_0",
    figure: "Billiard extension",
    titleJa: "ビリヤード拡張 (2,0): 面積密度",
    titleEn: "Billiard extension (2,0): area density",
    summaryJa:
      "論文外の拡張実験。density を円粒子の合計面積/領域面積として粒子数に変換し、(2,0) の初期値依存が衝突系でも出るかを見る。",
    summaryEn:
      "Exploratory extension outside the paper. It converts density to particle count as total disk area over field area and tests whether the (2,0) branches appear in the collision system.",
    simulationMode: "billiard",
    rule: "asymmetric_2_0",
    latticeSize: 100,
    billiardFieldSize: 420,
    billiardRadius: 8,
    billiardVelocity: 3.2,
    billiardRestitution: 1,
    densities: BILLIARD_DENSITIES,
    steps: BILLIARD_SWEEP_STEPS,
    series: [
      {
        id: "billiard_a0_0",
        labelJa: "初期A 0%",
        labelEn: "initial A 0%",
        color: "#1267f2",
        excludedVolume: true,
        initialA: 0,
      },
      {
        id: "billiard_a0_80",
        labelJa: "初期A 80%",
        labelEn: "initial A 80%",
        color: "#ed253c",
        dashed: true,
        excludedVolume: true,
        initialA: 0.8,
      },
    ],
  },
];

export function paperScanConfig(preset: PaperScanPreset, series: PaperScanSeriesPreset, density: number): ExperimentConfig {
  const parameters = PAPER_RULE_PARAMETERS[preset.rule];
  if (preset.simulationMode === "billiard") {
    const radius = preset.billiardRadius ?? DEFAULT_CONFIG.radius;
    const fieldSize = preset.billiardFieldSize ?? DEFAULT_CONFIG.fieldSize;
    return {
      ...DEFAULT_CONFIG,
      mode: "billiard",
      rule: preset.rule,
      alpha: parameters.alpha,
      beta: parameters.beta,
      density,
      initialA: series.initialA,
      particleCount: billiardParticleCountForDensity(preset, density),
      radius,
      velocity: preset.billiardVelocity ?? DEFAULT_CONFIG.velocity,
      restitution: preset.billiardRestitution ?? DEFAULT_CONFIG.restitution,
      fieldSize,
      excludedVolume: true,
      stepsPerFrame: 1,
    };
  }

  return {
    ...DEFAULT_CONFIG,
    mode: "lattice",
    rule: preset.rule,
    alpha: parameters.alpha,
    beta: parameters.beta,
    latticeSize: preset.latticeSize,
    density,
    excludedVolume: series.excludedVolume,
    initialA: series.initialA,
    stepsPerFrame: 1,
  };
}

export function billiardParticleCountForDensity(preset: PaperScanPreset, density: number): number {
  const radius = preset.billiardRadius ?? DEFAULT_CONFIG.radius;
  const fieldSize = preset.billiardFieldSize ?? DEFAULT_CONFIG.fieldSize;
  const fieldArea = fieldSize * fieldSize;
  const particleArea = Math.PI * radius * radius;
  return Math.max(20, Math.round((density * fieldArea) / particleArea));
}

export function runPaperScanPoint(preset: PaperScanPreset, series: PaperScanSeriesPreset, density: number): PaperScanPoint {
  const config = paperScanConfig(preset, series, density);
  const simulation: SimulationRuntime =
    config.mode === "billiard" ? new BilliardSimulation(config) : new LatticeSimulation(config);
  for (let step = 0; step < preset.steps; step += 1) {
    simulation.step();
  }
  const sample = simulation.snapshot().latest;
  return {
    ...sample,
    density,
    seriesId: series.id,
    seriesLabelJa: series.labelJa,
    seriesLabelEn: series.labelEn,
    excludedVolume: series.excludedVolume,
    initialA: series.initialA,
  };
}

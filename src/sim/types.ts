export type ModeState = "A" | "B";

export type SimulationMode = "lattice" | "billiard";

export type TransitionRuleId = "basic_1_1" | "asymmetric_1_2" | "asymmetric_2_0";

export interface TransitionRulePreset {
  id: TransitionRuleId;
  m: number;
  n: number;
}

export interface ExperimentConfig {
  mode: SimulationMode;
  rule: TransitionRuleId;
  alpha: number;
  beta: number;
  seed: number;
  initialA: number;
  latticeSize: number;
  density: number;
  excludedVolume: boolean;
  particleCount: number;
  radius: number;
  velocity: number;
  restitution: number;
  fieldSize: number;
  stepsPerFrame: number;
}

export interface ExperimentPoint {
  id: number;
  x: number;
  y: number;
  mode: ModeState;
  radius: number;
}

export interface ExperimentSample {
  step: number;
  a: number;
  b: number;
  pA: number;
  pB: number;
  ratioBA: number;
}

export interface ExperimentSnapshot {
  mode: SimulationMode;
  width: number;
  height: number;
  step: number;
  points: ExperimentPoint[];
  latest: ExperimentSample;
  samples: ExperimentSample[];
}

export interface SimulationRuntime {
  step(): void;
  snapshot(): ExperimentSnapshot;
}

export const DEFAULT_CONFIG: ExperimentConfig = {
  mode: "lattice",
  rule: "basic_1_1",
  alpha: 0.2,
  beta: 0.8,
  seed: 12345,
  initialA: 0.5,
  latticeSize: 50,
  density: 0.5,
  excludedVolume: true,
  particleCount: 650,
  radius: 8,
  velocity: 2,
  restitution: 1,
  fieldSize: 800,
  stepsPerFrame: 2,
};

export function makeSample(step: number, a: number, b: number): ExperimentSample {
  const total = Math.max(1, a + b);
  return {
    step,
    a,
    b,
    pA: a / total,
    pB: b / total,
    ratioBA: a === 0 ? Number.POSITIVE_INFINITY : b / a,
  };
}

export function keepRecentSamples(samples: ExperimentSample[], maxSamples = 520): ExperimentSample[] {
  if (samples.length <= maxSamples) {
    return samples;
  }
  return samples.slice(samples.length - maxSamples);
}

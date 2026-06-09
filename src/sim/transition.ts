import { SeededRandom } from "./rng";
import type { ExperimentConfig, ModeState, TransitionRuleId, TransitionRulePreset } from "./types";

export const TRANSITION_RULES: Record<TransitionRuleId, TransitionRulePreset> = {
  basic_1_1: { id: "basic_1_1", m: 1, n: 1 },
  asymmetric_1_2: { id: "asymmetric_1_2", m: 1, n: 2 },
  asymmetric_2_0: { id: "asymmetric_2_0", m: 2, n: 0 },
};

export const PAPER_RULE_PARAMETERS: Record<
  TransitionRuleId,
  { alpha: number; beta: number; source: string; context: string }
> = {
  basic_1_1: {
    alpha: 0.2,
    beta: 0.8,
    source: "Figs. 2-5",
    context: "L=M=100; N=8000 in Figs. 2-4; Density Sweep in Fig. 5",
  },
  asymmetric_1_2: {
    alpha: 0.01,
    beta: 1.0,
    source: "Fig. 7a / Fig. 8",
    context: "L=M=100; Density Sweep",
  },
  asymmetric_2_0: {
    alpha: 0.8,
    beta: 0.2,
    source: "Fig. 7b / Appendix B",
    context: "L=M=100; Density Sweep; bistable above threshold",
  },
};

export function transitionFormula(ruleId: TransitionRuleId): string {
  const rule = TRANSITION_RULES[ruleId];
  return `A + ${rule.m}B → B, B + ${rule.n}B → A`;
}

export function nextModeFromLocalBCount(
  current: ModeState,
  localBCount: number,
  config: Pick<ExperimentConfig, "alpha" | "beta" | "rule">,
  rng: SeededRandom,
): ModeState {
  const rule = TRANSITION_RULES[config.rule];

  if (current === "A" && localBCount >= rule.m && rng.next() < config.alpha) {
    return "B";
  }

  if (current === "B" && localBCount >= rule.n && rng.next() < config.beta) {
    return "A";
  }

  return current;
}

export function theoreticalPA(config: Pick<ExperimentConfig, "alpha" | "beta" | "rule">): number | null {
  if (config.rule !== "basic_1_1") {
    return null;
  }

  const denominator = config.alpha + config.beta;
  if (denominator <= 0) {
    return null;
  }

  return config.beta / denominator;
}

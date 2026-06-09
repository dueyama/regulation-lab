import { BilliardSimulation } from "./billiard";
import { LatticeSimulation } from "./lattice";
import type { ExperimentConfig, SimulationRuntime } from "./types";

export function createSimulation(config: ExperimentConfig): SimulationRuntime {
  if (config.mode === "billiard") {
    return new BilliardSimulation(config);
  }

  return new LatticeSimulation(config);
}

export type {
  ExperimentConfig,
  ExperimentPoint,
  ExperimentSample,
  ExperimentSnapshot,
  ModeState,
  SimulationMode,
  TransitionRuleId,
} from "./types";

export { DEFAULT_CONFIG } from "./types";

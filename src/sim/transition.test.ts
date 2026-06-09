import { describe, expect, it } from "vitest";
import { SeededRandom } from "./rng";
import { PAPER_RULE_PARAMETERS, nextModeFromLocalBCount } from "./transition";
import type { ExperimentConfig } from "./types";

const baseConfig: ExperimentConfig = {
  mode: "lattice",
  rule: "basic_1_1",
  alpha: 1,
  beta: 1,
  seed: 1,
  initialA: 0.5,
  latticeSize: 20,
  density: 0.5,
  excludedVolume: true,
  particleCount: 100,
  radius: 5,
  velocity: 1,
  restitution: 1,
  fieldSize: 400,
  stepsPerFrame: 1,
};

describe("transition rules", () => {
  it("applies the basic (1,1) rule", () => {
    expect(nextModeFromLocalBCount("A", 0, baseConfig, new SeededRandom(1))).toBe("A");
    expect(nextModeFromLocalBCount("A", 1, baseConfig, new SeededRandom(1))).toBe("B");
    expect(nextModeFromLocalBCount("B", 0, baseConfig, new SeededRandom(1))).toBe("B");
    expect(nextModeFromLocalBCount("B", 1, baseConfig, new SeededRandom(1))).toBe("A");
  });

  it("applies the asymmetric (1,2) rule", () => {
    const config = { ...baseConfig, rule: "asymmetric_1_2" as const };
    expect(nextModeFromLocalBCount("A", 1, config, new SeededRandom(1))).toBe("B");
    expect(nextModeFromLocalBCount("B", 1, config, new SeededRandom(1))).toBe("B");
    expect(nextModeFromLocalBCount("B", 2, config, new SeededRandom(1))).toBe("A");
  });

  it("applies the asymmetric (2,0) rule", () => {
    const config = { ...baseConfig, rule: "asymmetric_2_0" as const };
    expect(nextModeFromLocalBCount("A", 1, config, new SeededRandom(1))).toBe("A");
    expect(nextModeFromLocalBCount("A", 2, config, new SeededRandom(1))).toBe("B");
    expect(nextModeFromLocalBCount("B", 0, config, new SeededRandom(1))).toBe("A");
  });

  it("honors zero transition probabilities", () => {
    const config = { ...baseConfig, alpha: 0, beta: 0 };
    expect(nextModeFromLocalBCount("A", 4, config, new SeededRandom(1))).toBe("A");
    expect(nextModeFromLocalBCount("B", 4, config, new SeededRandom(1))).toBe("B");
  });

  it("stores paper parameter values for each rule", () => {
    expect(PAPER_RULE_PARAMETERS.basic_1_1).toMatchObject({ alpha: 0.2, beta: 0.8 });
    expect(PAPER_RULE_PARAMETERS.asymmetric_1_2).toMatchObject({ alpha: 0.01, beta: 1.0 });
    expect(PAPER_RULE_PARAMETERS.asymmetric_2_0).toMatchObject({ alpha: 0.8, beta: 0.2 });
  });
});

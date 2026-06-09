import { describe, expect, it } from "vitest";
import { DEFAULT_MULTI_MODE_CONFIG, MultiModeLatticeSimulation, expectedMultiModeRatios } from "./multimode";

describe("multi-mode lattice simulation", () => {
  it("computes the independent four-state expectation", () => {
    const expected = expectedMultiModeRatios({
      alpha: 0.2,
      beta: 0.8,
      gamma: 0.3,
      delta: 0.7,
    });

    expect(expected.pAC).toBeCloseTo(0.56, 10);
    expect(expected.pAD).toBeCloseTo(0.24, 10);
    expect(expected.pBC).toBeCloseTo(0.14, 10);
    expect(expected.pBD).toBeCloseTo(0.06, 10);
  });

  it("replays the same four-state history for the same seed", () => {
    const config = {
      ...DEFAULT_MULTI_MODE_CONFIG,
      latticeSize: 24,
      density: 0.7,
      seed: 13579,
    };
    const left = new MultiModeLatticeSimulation(config);
    const right = new MultiModeLatticeSimulation(config);

    for (let step = 0; step < 120; step += 1) {
      left.step();
      right.step();
    }

    expect(left.snapshot().latest).toEqual(right.snapshot().latest);
    expect(left.snapshot().points.slice(0, 20)).toEqual(right.snapshot().points.slice(0, 20));
  });

  it("keeps four-state counts normalized", () => {
    const config = {
      ...DEFAULT_MULTI_MODE_CONFIG,
      latticeSize: 20,
      density: 0.6,
    };
    const simulation = new MultiModeLatticeSimulation(config);

    for (let step = 0; step < 80; step += 1) {
      simulation.step();
    }

    const latest = simulation.snapshot().latest;
    expect(latest.ac + latest.ad + latest.bc + latest.bd).toBe(Math.round(20 * 20 * 0.6));
    expect(latest.pAC + latest.pAD + latest.pBC + latest.pBD).toBeCloseTo(1, 10);
  });
});

import { describe, expect, it } from "vitest";
import { createSimulation } from "./index";
import type { ExperimentConfig } from "./types";

const baseConfig: ExperimentConfig = {
  mode: "lattice",
  rule: "basic_1_1",
  alpha: 0.2,
  beta: 0.8,
  seed: 12345,
  initialA: 0.5,
  latticeSize: 30,
  density: 0.65,
  excludedVolume: true,
  particleCount: 120,
  radius: 4,
  velocity: 1.2,
  restitution: 1,
  fieldSize: 360,
  stepsPerFrame: 1,
};

describe("simulation runtimes", () => {
  it("replays the same lattice history for the same seed", () => {
    const left = createSimulation(baseConfig);
    const right = createSimulation(baseConfig);

    for (let index = 0; index < 80; index += 1) {
      left.step();
      right.step();
    }

    expect(left.snapshot().latest).toEqual(right.snapshot().latest);
    expect(left.snapshot().points.slice(0, 20)).toEqual(right.snapshot().points.slice(0, 20));
  });

  it("moves the lattice basic rule toward the expected A-heavy equilibrium", () => {
    const simulation = createSimulation({
      ...baseConfig,
      initialA: 0.05,
      density: 0.8,
      latticeSize: 36,
    });

    for (let index = 0; index < 650; index += 1) {
      simulation.step();
    }

    const pA = simulation.snapshot().latest.pA;
    expect(pA).toBeGreaterThan(0.62);
    expect(pA).toBeLessThan(0.94);
  });

  it("keeps billiard particles deterministic and inside the field", () => {
    const config: ExperimentConfig = {
      ...baseConfig,
      mode: "billiard",
      particleCount: 90,
      fieldSize: 360,
      radius: 4,
      velocity: 1.1,
    };
    const left = createSimulation(config);
    const right = createSimulation(config);
    const initialPoints = left.snapshot().points.slice(0, 10);

    for (let index = 0; index < 60; index += 1) {
      left.step();
      right.step();
    }

    const snapshot = left.snapshot();
    expect(snapshot.latest.a + snapshot.latest.b).toBe(config.particleCount);
    expect(snapshot.points).toHaveLength(config.particleCount);
    expect(snapshot.latest).toEqual(right.snapshot().latest);
    expect(snapshot.points.slice(0, 10)).toEqual(right.snapshot().points.slice(0, 10));
    const movement = initialPoints.reduce((sum, point, index) => {
      const next = snapshot.points[index];
      return sum + Math.hypot(next.x - point.x, next.y - point.y);
    }, 0);
    expect(movement).toBeGreaterThan(10);
    for (const point of snapshot.points) {
      expect(point.x).toBeGreaterThanOrEqual(config.radius - 0.001);
      expect(point.y).toBeGreaterThanOrEqual(config.radius - 0.001);
      expect(point.x).toBeLessThanOrEqual(config.fieldSize - config.radius + 0.001);
      expect(point.y).toBeLessThanOrEqual(config.fieldSize - config.radius + 0.001);
    }
  });

  it("does not apply billiard n=0 transitions without a contact event", () => {
    const simulation = createSimulation({
      ...baseConfig,
      mode: "billiard",
      rule: "asymmetric_2_0",
      alpha: 1,
      beta: 1,
      initialA: 0,
      particleCount: 1,
      fieldSize: 240,
      radius: 5,
      velocity: 1,
    });

    for (let index = 0; index < 80; index += 1) {
      simulation.step();
    }

    expect(simulation.snapshot().latest).toMatchObject({
      a: 0,
      b: 1,
      pA: 0,
      pB: 1,
    });
  });

  it("supports lattice overlap when excluded volume is disabled", () => {
    const simulation = createSimulation({
      ...baseConfig,
      excludedVolume: false,
      latticeSize: 12,
      density: 0.95,
    });

    for (let index = 0; index < 120; index += 1) {
      simulation.step();
    }

    const snapshot = simulation.snapshot();
    expect(snapshot.latest.a + snapshot.latest.b).toBe(Math.round(12 * 12 * 0.95));
    expect(snapshot.points).toHaveLength(snapshot.latest.a + snapshot.latest.b);
  });

  it("does not create a strong lattice boundary pile-up from random walking", () => {
    const config: ExperimentConfig = {
      ...baseConfig,
      alpha: 0,
      beta: 0,
      latticeSize: 40,
      density: 0.5,
      initialA: 0.5,
      excludedVolume: true,
      fieldSize: 400,
    };
    const simulation = createSimulation(config);

    for (let index = 0; index < 600; index += 1) {
      simulation.step();
    }

    const snapshot = simulation.snapshot();
    const margin = config.fieldSize * 0.15;
    const edgeCount = snapshot.points.filter(
      (point) =>
        point.x < margin ||
        point.y < margin ||
        point.x > config.fieldSize - margin ||
        point.y > config.fieldSize - margin,
    ).length;
    const centerCount = snapshot.points.filter(
      (point) =>
        point.x > config.fieldSize * 0.35 &&
        point.x < config.fieldSize * 0.65 &&
        point.y > config.fieldSize * 0.35 &&
        point.y < config.fieldSize * 0.65,
    ).length;
    const edgeRatio = edgeCount / snapshot.points.length;
    const centerRatio = centerCount / snapshot.points.length;

    expect(edgeRatio).toBeGreaterThan(0.43);
    expect(edgeRatio).toBeLessThan(0.58);
    expect(centerRatio).toBeGreaterThan(0.055);
  });
});

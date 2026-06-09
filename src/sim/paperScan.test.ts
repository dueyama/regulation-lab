import { describe, expect, it } from "vitest";
import { PAPER_SCAN_PRESETS, paperScanConfig } from "./paperScan";

describe("paper scan presets", () => {
  it("contains the paper reproduction presets", () => {
    expect(PAPER_SCAN_PRESETS.map((preset) => preset.id)).toEqual([
      "fig5_symmetric",
      "fig7a_asymmetric_1_2",
      "fig7b_asymmetric_2_0",
      "fig8_eve",
      "billiard_basic_1_1",
      "billiard_asymmetric_1_2",
      "billiard_asymmetric_2_0",
    ]);
  });

  it("applies paper alpha and beta values to scan configs", () => {
    const fig5 = PAPER_SCAN_PRESETS[0];
    const fig7a = PAPER_SCAN_PRESETS[1];
    const fig7b = PAPER_SCAN_PRESETS[2];

    expect(paperScanConfig(fig5, fig5.series[0], 0.8)).toMatchObject({
      alpha: 0.2,
      beta: 0.8,
      rule: "basic_1_1",
      density: 0.8,
      mode: "lattice",
    });
    expect(paperScanConfig(fig7a, fig7a.series[0], 0.8)).toMatchObject({
      alpha: 0.01,
      beta: 1,
      rule: "asymmetric_1_2",
    });
    expect(paperScanConfig(fig7b, fig7b.series[0], 0.8)).toMatchObject({
      alpha: 0.8,
      beta: 0.2,
      rule: "asymmetric_2_0",
    });
  });

  it("maps billiard area density to particle count", () => {
    const billiard = PAPER_SCAN_PRESETS.find((preset) => preset.id === "billiard_basic_1_1");
    expect(billiard).toBeDefined();
    if (!billiard) {
      return;
    }

    expect(paperScanConfig(billiard, billiard.series[0], 0.1)).toMatchObject({
      mode: "billiard",
      rule: "basic_1_1",
      particleCount: 88,
      fieldSize: 420,
      radius: 8,
      velocity: 3.2,
      restitution: 1,
    });
    expect(paperScanConfig(billiard, billiard.series[0], 0.9)).toMatchObject({
      mode: "billiard",
      particleCount: 790,
    });
  });
});

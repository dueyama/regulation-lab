import { SeededRandom } from "./rng";

export type MultiModeState = "AC" | "AD" | "BC" | "BD";
type ABState = "A" | "B";
type CDState = "C" | "D";

export interface MultiModeConfig {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
  seed: number;
  initialA: number;
  initialC: number;
  latticeSize: number;
  density: number;
  excludedVolume: boolean;
  fieldSize: number;
  stepsPerFrame: number;
}

interface MultiModeAgent {
  id: number;
  x: number;
  y: number;
  ab: ABState;
  cd: CDState;
}

export interface MultiModePoint {
  id: number;
  x: number;
  y: number;
  mode: MultiModeState;
  radius: number;
}

export interface MultiModeSample {
  step: number;
  ac: number;
  ad: number;
  bc: number;
  bd: number;
  pAC: number;
  pAD: number;
  pBC: number;
  pBD: number;
}

export interface MultiModeSnapshot {
  width: number;
  height: number;
  step: number;
  points: MultiModePoint[];
  latest: MultiModeSample;
  samples: MultiModeSample[];
}

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

export const DEFAULT_MULTI_MODE_CONFIG: MultiModeConfig = {
  alpha: 0.2,
  beta: 0.8,
  gamma: 0.3,
  delta: 0.7,
  seed: 24680,
  initialA: 0.5,
  initialC: 0.5,
  latticeSize: 50,
  density: 0.5,
  excludedVolume: true,
  fieldSize: 800,
  stepsPerFrame: 2,
};

export class MultiModeLatticeSimulation {
  private readonly rng: SeededRandom;
  private readonly size: number;
  private readonly grid: number[][];
  private readonly agents: MultiModeAgent[];
  private samples: MultiModeSample[];
  private timeStep = 0;

  constructor(private readonly config: MultiModeConfig) {
    this.rng = new SeededRandom(config.seed);
    this.size = config.latticeSize;
    this.grid = Array.from({ length: this.size * this.size }, () => []);
    this.agents = this.createAgents();
    this.samples = [this.currentSample()];
  }

  step(): void {
    for (let update = 0; update < this.agents.length; update += 1) {
      const agent = this.agents[this.rng.int(this.agents.length)];
      const bNeighbors = this.countNeighbors(agent.x, agent.y, "ab", "B");
      const dNeighbors = this.countNeighbors(agent.x, agent.y, "cd", "D");

      if (agent.ab === "A" && bNeighbors >= 1 && this.rng.next() < this.config.alpha) {
        agent.ab = "B";
      } else if (agent.ab === "B" && bNeighbors >= 1 && this.rng.next() < this.config.beta) {
        agent.ab = "A";
      }

      if (agent.cd === "C" && dNeighbors >= 1 && this.rng.next() < this.config.gamma) {
        agent.cd = "D";
      } else if (agent.cd === "D" && dNeighbors >= 1 && this.rng.next() < this.config.delta) {
        agent.cd = "C";
      }

      this.tryMove(agent);
    }

    this.timeStep += 1;
    this.samples = keepRecentMultiModeSamples([...this.samples, this.currentSample()]);
  }

  snapshot(): MultiModeSnapshot {
    const cellSize = this.config.fieldSize / this.size;
    const radius = Math.max(2, cellSize * 0.36);
    const points: MultiModePoint[] = this.agents.map((agent) => ({
      id: agent.id,
      x: (agent.x + 0.5) * cellSize,
      y: (agent.y + 0.5) * cellSize,
      mode: `${agent.ab}${agent.cd}` as MultiModeState,
      radius,
    }));

    return {
      width: this.config.fieldSize,
      height: this.config.fieldSize,
      step: this.timeStep,
      points,
      latest: this.samples[this.samples.length - 1],
      samples: this.samples,
    };
  }

  private createAgents(): MultiModeAgent[] {
    const totalCells = this.size * this.size;
    const count = Math.max(1, Math.min(totalCells, Math.round(totalCells * this.config.density)));
    const cells = Array.from({ length: totalCells }, (_, index) => index);
    this.rng.shuffle(cells);

    const agents: MultiModeAgent[] = [];
    for (let index = 0; index < count; index += 1) {
      const cell = cells[index];
      const x = cell % this.size;
      const y = Math.floor(cell / this.size);
      const agent = {
        id: index,
        x,
        y,
        ab: this.rng.next() < this.config.initialA ? "A" : "B",
        cd: this.rng.next() < this.config.initialC ? "C" : "D",
      } satisfies MultiModeAgent;
      agents.push(agent);
      this.grid[this.index(x, y)].push(index);
    }

    return agents;
  }

  private tryMove(agent: MultiModeAgent): void {
    const direction = this.rng.choice(DIRECTIONS);
    const nextX = agent.x + direction.x;
    const nextY = agent.y + direction.y;

    if (!this.inBounds(nextX, nextY)) {
      return;
    }

    const nextIndex = this.index(nextX, nextY);
    if (this.config.excludedVolume && this.grid[nextIndex].length > 0) {
      return;
    }

    const currentCell = this.grid[this.index(agent.x, agent.y)];
    const currentOffset = currentCell.indexOf(agent.id);
    if (currentOffset >= 0) {
      currentCell.splice(currentOffset, 1);
    }
    agent.x = nextX;
    agent.y = nextY;
    this.grid[nextIndex].push(agent.id);
  }

  private countNeighbors<K extends "ab" | "cd">(
    x: number,
    y: number,
    key: K,
    target: K extends "ab" ? ABState : CDState,
  ): number {
    let count = 0;
    for (const direction of DIRECTIONS) {
      const nextX = x + direction.x;
      const nextY = y + direction.y;
      if (!this.inBounds(nextX, nextY)) {
        continue;
      }
      const cell = this.grid[this.index(nextX, nextY)];
      count += cell.reduce((sum, agentIndex) => sum + (this.agents[agentIndex][key] === target ? 1 : 0), 0);
    }
    return count;
  }

  private currentSample(): MultiModeSample {
    let ac = 0;
    let ad = 0;
    let bc = 0;
    let bd = 0;
    for (const agent of this.agents) {
      const mode = `${agent.ab}${agent.cd}`;
      if (mode === "AC") {
        ac += 1;
      } else if (mode === "AD") {
        ad += 1;
      } else if (mode === "BC") {
        bc += 1;
      } else {
        bd += 1;
      }
    }
    return makeMultiModeSample(this.timeStep, ac, ad, bc, bd);
  }

  private index(x: number, y: number): number {
    return y * this.size + x;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }
}

export function makeMultiModeSample(step: number, ac: number, ad: number, bc: number, bd: number): MultiModeSample {
  const total = Math.max(1, ac + ad + bc + bd);
  return {
    step,
    ac,
    ad,
    bc,
    bd,
    pAC: ac / total,
    pAD: ad / total,
    pBC: bc / total,
    pBD: bd / total,
  };
}

export function expectedMultiModeRatios(config: Pick<MultiModeConfig, "alpha" | "beta" | "gamma" | "delta">) {
  const abTotal = config.alpha + config.beta;
  const cdTotal = config.gamma + config.delta;
  const pA = abTotal > 0 ? config.beta / abTotal : 0.5;
  const pC = cdTotal > 0 ? config.delta / cdTotal : 0.5;
  return {
    pAC: pA * pC,
    pAD: pA * (1 - pC),
    pBC: (1 - pA) * pC,
    pBD: (1 - pA) * (1 - pC),
  };
}

function keepRecentMultiModeSamples(samples: MultiModeSample[], maxSamples = 520): MultiModeSample[] {
  if (samples.length <= maxSamples) {
    return samples;
  }
  return samples.slice(samples.length - maxSamples);
}

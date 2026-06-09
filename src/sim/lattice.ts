import { SeededRandom } from "./rng";
import { nextModeFromLocalBCount } from "./transition";
import {
  keepRecentSamples,
  makeSample,
  type ExperimentConfig,
  type ExperimentPoint,
  type ExperimentSample,
  type ExperimentSnapshot,
  type ModeState,
  type SimulationRuntime,
} from "./types";

interface LatticeAgent {
  id: number;
  x: number;
  y: number;
  mode: ModeState;
}

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

export class LatticeSimulation implements SimulationRuntime {
  private readonly rng: SeededRandom;
  private readonly size: number;
  private readonly grid: number[][];
  private readonly agents: LatticeAgent[];
  private samples: ExperimentSample[];
  private timeStep = 0;

  constructor(private readonly config: ExperimentConfig) {
    this.rng = new SeededRandom(config.seed);
    this.size = config.latticeSize;
    this.grid = Array.from({ length: this.size * this.size }, () => []);
    this.agents = this.createAgents();
    this.samples = [this.currentSample()];
  }

  step(): void {
    for (let update = 0; update < this.agents.length; update += 1) {
      const agent = this.agents[this.rng.int(this.agents.length)];
      const nextMode = nextModeFromLocalBCount(
        agent.mode,
        this.countBNeighbors(agent.x, agent.y),
        this.config,
        this.rng,
      );
      agent.mode = nextMode;
      this.tryMove(agent);
    }

    this.timeStep += 1;
    this.samples = keepRecentSamples([...this.samples, this.currentSample()]);
  }

  snapshot(): ExperimentSnapshot {
    const cellSize = this.config.fieldSize / this.size;
    const radius = Math.max(2, cellSize * 0.36);
    const points: ExperimentPoint[] = this.agents.map((agent) => ({
      id: agent.id,
      x: (agent.x + 0.5) * cellSize,
      y: (agent.y + 0.5) * cellSize,
      mode: agent.mode,
      radius,
    }));

    return {
      mode: "lattice",
      width: this.config.fieldSize,
      height: this.config.fieldSize,
      step: this.timeStep,
      points,
      latest: this.samples[this.samples.length - 1],
      samples: this.samples,
    };
  }

  private createAgents(): LatticeAgent[] {
    const totalCells = this.size * this.size;
    const count = Math.max(1, Math.min(totalCells, Math.round(totalCells * this.config.density)));
    const cells = Array.from({ length: totalCells }, (_, index) => index);
    this.rng.shuffle(cells);

    const agents: LatticeAgent[] = [];
    for (let index = 0; index < count; index += 1) {
      const cell = cells[index];
      const x = cell % this.size;
      const y = Math.floor(cell / this.size);
      const mode: ModeState = this.rng.next() < this.config.initialA ? "A" : "B";
      const agent = { id: index, x, y, mode };
      agents.push(agent);
      this.grid[this.index(x, y)].push(index);
    }

    return agents;
  }

  private tryMove(agent: LatticeAgent): void {
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

  private countBNeighbors(x: number, y: number): number {
    let count = 0;
    for (const direction of DIRECTIONS) {
      const nextX = x + direction.x;
      const nextY = y + direction.y;
      if (!this.inBounds(nextX, nextY)) {
        continue;
      }
      const cell = this.grid[this.index(nextX, nextY)];
      count += cell.reduce((sum, agentIndex) => sum + (this.agents[agentIndex].mode === "B" ? 1 : 0), 0);
    }
    return count;
  }

  private currentSample(): ExperimentSample {
    let a = 0;
    let b = 0;
    for (const agent of this.agents) {
      if (agent.mode === "A") {
        a += 1;
      } else {
        b += 1;
      }
    }
    return makeSample(this.timeStep, a, b);
  }

  private index(x: number, y: number): number {
    return y * this.size + x;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }
}

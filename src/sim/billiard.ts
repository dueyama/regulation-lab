import Matter from "matter-js";
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

interface BilliardParticle {
  id: number;
  mode: ModeState;
  body: Matter.Body;
  targetSpeed: number;
}

export class BilliardSimulation implements SimulationRuntime {
  private readonly rng: SeededRandom;
  private readonly engine: Matter.Engine;
  private readonly particles: BilliardParticle[];
  private previousContacts = new Set<string>();
  private samples: ExperimentSample[];
  private timeStep = 0;

  constructor(private readonly config: ExperimentConfig) {
    this.rng = new SeededRandom(config.seed);
    this.engine = Matter.Engine.create();
    this.engine.enableSleeping = false;
    this.engine.positionIterations = 10;
    this.engine.velocityIterations = 10;
    this.engine.constraintIterations = 4;
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.particles = this.createParticles();
    Matter.Composite.add(this.engine.world, this.particles.map((p) => p.body));
    this.samples = [this.currentSample()];
  }

  step(): void {
    Matter.Engine.update(this.engine, 1000 / 60);
    this.resolveOverlaps();
    this.keepInsideBounds();
    this.applyContactTransitions();
    this.timeStep += 1;
    this.samples = keepRecentSamples([...this.samples, this.currentSample()]);
  }

  snapshot(): ExperimentSnapshot {
    const points: ExperimentPoint[] = this.particles.map((particle) => ({
      id: particle.id,
      x: particle.body.position.x,
      y: particle.body.position.y,
      mode: particle.mode,
      radius: this.config.radius,
    }));

    return {
      mode: "billiard",
      width: this.config.fieldSize,
      height: this.config.fieldSize,
      step: this.timeStep,
      points,
      latest: this.samples[this.samples.length - 1],
      samples: this.samples,
    };
  }

  private createParticles(): BilliardParticle[] {
    const particles: BilliardParticle[] = [];
    const positions: Array<{ x: number; y: number }> = [];
    const gridPositions =
      this.config.particleCount > 340 ? this.createJitteredGridPositions(this.config.particleCount) : null;
    const radius = this.config.radius;
    const minimumDistance = radius * 2.15;

    for (let id = 0; id < this.config.particleCount; id += 1) {
      const position = gridPositions?.[id] ?? this.findFreePosition(positions, minimumDistance);
      if (!gridPositions) {
        positions.push(position);
      }
      const mode: ModeState = this.rng.next() < this.config.initialA ? "A" : "B";
      const body = Matter.Bodies.circle(position.x, position.y, radius, {
        restitution: this.config.restitution,
        friction: 0,
        frictionAir: 0,
        frictionStatic: 0,
        inertia: Number.POSITIVE_INFINITY,
        slop: 0,
        label: `particle-${id}`,
      });
      const angle = this.rng.next() * Math.PI * 2;
      const speed = this.config.velocity * (0.75 + this.rng.next() * 0.5);
      Matter.Body.setVelocity(body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      });
      particles.push({ id, mode, body, targetSpeed: speed });
    }

    return particles;
  }

  private createJitteredGridPositions(count: number): Array<{ x: number; y: number }> {
    const radius = this.config.radius;
    const min = radius + 4;
    const max = this.config.fieldSize - radius - 4;
    const columns = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / columns);
    const span = max - min;
    const spacingX = columns <= 1 ? 0 : span / (columns - 1);
    const spacingY = rows <= 1 ? 0 : span / (rows - 1);
    const jitter = Math.max(0, Math.min(spacingX || radius, spacingY || radius, radius * 1.1) * 0.22);
    const positions: Array<{ x: number; y: number }> = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns && positions.length < count; column += 1) {
        positions.push({
          x: clamp(min + column * spacingX + (this.rng.next() - 0.5) * jitter, min, max),
          y: clamp(min + row * spacingY + (this.rng.next() - 0.5) * jitter, min, max),
        });
      }
    }

    return this.rng.shuffle(positions);
  }

  private findFreePosition(positions: Array<{ x: number; y: number }>, minimumDistance: number): {
    x: number;
    y: number;
  } {
    const radius = this.config.radius;
    const min = radius + 4;
    const max = this.config.fieldSize - radius - 4;

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const position = {
        x: min + this.rng.next() * (max - min),
        y: min + this.rng.next() * (max - min),
      };
      if (positions.every((other) => squaredDistance(position, other) >= minimumDistance * minimumDistance)) {
        return position;
      }
    }

    return {
      x: min + this.rng.next() * (max - min),
      y: min + this.rng.next() * (max - min),
    };
  }

  private applyContactTransitions(): void {
    const bContacts = new Map<number, number>();
    const currentContacts = new Set<string>();
    const activeParticles = new Set<number>();
    for (const particle of this.particles) {
      bContacts.set(particle.id, 0);
    }

    const contactLimit = this.config.radius * 2.02;
    const contactLimitSquared = contactLimit * contactLimit;

    this.visitNearbyParticlePairs(contactLimit, (a, b) => {
      if (squaredDistance(a.body.position, b.body.position) > contactLimitSquared) {
        return;
      }

      const contactKey = `${a.id}:${b.id}`;
      currentContacts.add(contactKey);
      if (b.mode === "B") {
        bContacts.set(a.id, (bContacts.get(a.id) ?? 0) + 1);
      }
      if (a.mode === "B") {
        bContacts.set(b.id, (bContacts.get(b.id) ?? 0) + 1);
      }

      if (!this.previousContacts.has(contactKey)) {
        activeParticles.add(a.id);
        activeParticles.add(b.id);
      }
    });

    for (const particle of this.particles) {
      if (!activeParticles.has(particle.id)) {
        continue;
      }
      particle.mode = nextModeFromLocalBCount(
        particle.mode,
        bContacts.get(particle.id) ?? 0,
        this.config,
        this.rng,
      );
    }

    this.previousContacts = currentContacts;
  }

  private keepInsideBounds(): void {
    const min = this.config.radius;
    const max = this.config.fieldSize - this.config.radius;
    for (const particle of this.particles) {
      const position = particle.body.position;
      const velocity = particle.body.velocity;
      let x = position.x;
      let y = position.y;
      let vx = velocity.x;
      let vy = velocity.y;

      if (x < min) {
        x = min;
        vx = Math.abs(vx);
      } else if (x > max) {
        x = max;
        vx = -Math.abs(vx);
      }

      if (y < min) {
        y = min;
        vy = Math.abs(vy);
      } else if (y > max) {
        y = max;
        vy = -Math.abs(vy);
      }

      const speed = Math.hypot(vx, vy);
      if (speed < 0.001) {
        const angle = this.rng.next() * Math.PI * 2;
        vx = Math.cos(angle) * particle.targetSpeed;
        vy = Math.sin(angle) * particle.targetSpeed;
      } else {
        const scale = particle.targetSpeed / speed;
        vx *= scale;
        vy *= scale;
      }

      Matter.Body.setPosition(particle.body, { x, y });
      Matter.Body.setVelocity(particle.body, { x: vx, y: vy });
    }
  }

  private resolveOverlaps(): void {
    const minimumDistance = this.config.radius * 2;
    const minimumDistanceSquared = minimumDistance * minimumDistance;

    this.visitNearbyParticlePairs(minimumDistance, (left, right) => {
      const a = left.body;
      const b = right.body;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared <= 0 || distanceSquared >= minimumDistanceSquared) {
        return;
      }

      const distance = Math.sqrt(distanceSquared);
      const correction = (minimumDistance - distance) / 2;
      const nx = dx / distance;
      const ny = dy / distance;

      Matter.Body.setPosition(a, {
        x: a.position.x - nx * correction,
        y: a.position.y - ny * correction,
      });
      Matter.Body.setPosition(b, {
        x: b.position.x + nx * correction,
        y: b.position.y + ny * correction,
      });
    });
  }

  private visitNearbyParticlePairs(
    cellSize: number,
    callback: (left: BilliardParticle, right: BilliardParticle) => void,
  ): void {
    const buckets = new Map<string, BilliardParticle[]>();
    for (const particle of this.particles) {
      const cellX = Math.floor(particle.body.position.x / cellSize);
      const cellY = Math.floor(particle.body.position.y / cellSize);

      for (let y = cellY - 1; y <= cellY + 1; y += 1) {
        for (let x = cellX - 1; x <= cellX + 1; x += 1) {
          const bucket = buckets.get(`${x}:${y}`);
          if (!bucket) {
            continue;
          }
          for (const other of bucket) {
            callback(other, particle);
          }
        }
      }

      const key = `${cellX}:${cellY}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(particle);
      } else {
        buckets.set(key, [particle]);
      }
    }
  }

  private currentSample(): ExperimentSample {
    let a = 0;
    let b = 0;
    for (const particle of this.particles) {
      if (particle.mode === "A") {
        a += 1;
      } else {
        b += 1;
      }
    }
    return makeSample(this.timeStep, a, b);
  }
}

function squaredDistance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

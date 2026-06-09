export class SeededRandom {
  private readonly state = new Uint32Array(624);
  private index = 624;

  constructor(seed: number) {
    this.state[0] = seed >>> 0;
    if (this.state[0] === 0) {
      this.state[0] = 5489;
    }
    for (let index = 1; index < 624; index += 1) {
      const previous = this.state[index - 1];
      this.state[index] = (Math.imul(1812433253, previous ^ (previous >>> 30)) + index) >>> 0;
    }
  }

  next(): number {
    return this.nextUint32() / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  choice<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const other = this.int(index + 1);
      [items[index], items[other]] = [items[other], items[index]];
    }
    return items;
  }

  private nextUint32(): number {
    if (this.index >= 624) {
      this.twist();
    }

    let value = this.state[this.index];
    this.index += 1;

    value ^= value >>> 11;
    value ^= (value << 7) & 0x9d2c5680;
    value ^= (value << 15) & 0xefc60000;
    value ^= value >>> 18;

    return value >>> 0;
  }

  private twist(): void {
    for (let index = 0; index < 624; index += 1) {
      const y = (this.state[index] & 0x80000000) + (this.state[(index + 1) % 624] & 0x7fffffff);
      let next = this.state[(index + 397) % 624] ^ (y >>> 1);
      if (y % 2 !== 0) {
        next ^= 0x9908b0df;
      }
      this.state[index] = next >>> 0;
    }
    this.index = 0;
  }
}

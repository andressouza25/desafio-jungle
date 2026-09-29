export interface RandomSource {
  next(): number;
}

// Mulberry32: the same uint32 seed always produces the same sequence in [0, 1).
export function createSeededRandom(seed: number): RandomSource {
  if (!Number.isInteger(seed)) throw new RangeError('A random seed must be an integer.');
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}

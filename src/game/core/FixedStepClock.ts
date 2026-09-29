export const SIMULATION_TIMING = Object.freeze({ stepMs: 1000 / 60, maxFrameMs: 250, maxStepsPerFrame: 8 });

export interface SimulationClock {
  readonly elapsedSeconds: number;
  advance(elapsedMs: number): number;
  rebase(): void;
  reset(): void;
}

export class FixedStepClock implements SimulationClock {
  private accumulatorMs = 0;
  private elapsedMs = 0;
  private skipNextDelivery = true;

  get elapsedSeconds() { return this.elapsedMs / 1000; }

  advance(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    if (this.skipNextDelivery) {
      this.skipNextDelivery = false;
      return 0;
    }
    const { stepMs, maxFrameMs, maxStepsPerFrame } = SIMULATION_TIMING;
    const epsilon = stepMs * 1e-9;
    this.accumulatorMs += Math.min(elapsedMs, maxFrameMs);
    let steps = 0;
    while (this.accumulatorMs + epsilon >= stepMs && steps < maxStepsPerFrame) {
      this.accumulatorMs = Math.max(0, this.accumulatorMs - stepMs);
      this.elapsedMs += stepMs;
      steps += 1;
    }
    // Drop excess whole steps rather than carrying an unbounded catch-up debt.
    if (this.accumulatorMs + epsilon >= stepMs) this.accumulatorMs %= stepMs;
    return steps;
  }

  rebase() {
    this.accumulatorMs = 0;
    this.skipNextDelivery = true;
  }

  reset() {
    this.elapsedMs = 0;
    this.rebase();
  }
}

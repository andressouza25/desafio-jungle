import type { FeedbackEvent } from '../core/FeedbackEvent';
import type { GameSnapshot } from '../GameSession';

const supplied = import.meta.glob('../../../assets/sounds/*.wav', { eager: true, query: '?url', import: 'default' });
export type AudioFactory = (url: string) => HTMLAudioElement;

// Instance ownership, six total voices, two per sound. No timers or gameplay mutations.
export class GameAudio {
  private unlocked = false;
  private destroyed = false;
  private snapshot: GameSnapshot | null = null;
  private readonly voices = new Set<HTMLAudioElement>();
  private readonly loops = new Map<string, HTMLAudioElement>();
  private healthWarned = false;
  private timeWarned = false;
  constructor(private readonly createAudio: AudioFactory = (url) => new Audio(url)) {}
  unlock() {
    if (this.destroyed) return;
    this.unlocked = true;
    this.syncLoops();
  }
  private create(name: string) {
    const url = supplied[`../../../assets/sounds/${name}.wav`];
    if (typeof url !== 'string') return null;
    const audio = this.createAudio(url); audio.volume = 0.35; return audio;
  }
  play(name: string) {
    if (!this.unlocked || this.destroyed) return;
    const active = [...this.voices];
    if (active.filter((voice) => voice.dataset.sound === name).length >= 2 || active.length >= 6) return;
    const audio = this.create(name); if (!audio) return;
    audio.dataset.sound = name;
    this.voices.add(audio);
    audio.onended = () => this.release(audio);
    audio.onerror = () => this.release(audio);
    void audio.play().catch(() => this.release(audio));
  }
  private release(audio: HTMLAudioElement) {
    audio.pause(); audio.onended = null; audio.onerror = null;
    audio.removeAttribute('src'); audio.load(); this.voices.delete(audio);
  }
  private stop() {
    for (const voice of this.voices) this.release(voice);
    for (const loop of this.loops.values()) this.release(loop);
    this.loops.clear();
  }
  private syncLoops() {
    if (!this.unlocked || this.destroyed || this.snapshot?.state !== 'running') return;
    for (const name of ['ocean_ambience_loop', 'ship_sailing_loop']) {
      if (this.loops.has(name)) continue;
      const audio = this.create(name); if (!audio) continue;
      audio.loop = true; audio.volume = name === 'ocean_ambience_loop' ? 0.12 : 0.06;
      this.loops.set(name, audio);
      void audio.play().catch(() => {
        if (this.loops.get(name) === audio) this.loops.delete(name);
        this.release(audio);
      });
    }
  }
  react(event: FeedbackEvent) {
    this.play({ fire: 'cannon_fire_1', impact: 'cannonball_water_hit_1', damage: 'ship_wood_hit_1', destruction: 'ship_explosion_1' }[event.kind]);
  }
  sync(snapshot: GameSnapshot) {
    const previous = this.snapshot;
    this.snapshot = snapshot;
    if (snapshot.state !== previous?.state || snapshot.config !== previous?.config) {
      this.stop();
      if (snapshot.state === 'running') {
        if (previous?.state !== 'paused') { this.healthWarned = false; this.timeWarned = false; }
        this.play(previous?.state === 'paused' ? 'game_resume' : 'game_start'); this.syncLoops();
      } else if (snapshot.state === 'paused') this.play('game_pause');
      else if (snapshot.result) this.play(snapshot.result.reason === 'player-death' ? 'game_over' : 'game_complete');
    }
    if (snapshot.state !== 'running') return;
    if (!this.healthWarned && snapshot.playerHealth > 0 && snapshot.playerHealth / snapshot.playerMaxHealth <= 0.25) {
      this.healthWarned = true; this.play('health_low');
    }
    if (!this.timeWarned && snapshot.remainingSeconds <= 10) { this.timeWarned = true; this.play('time_warning'); }
    if (previous && snapshot.score > previous.score) this.play('score_point');
  }
  destroy() { if (this.destroyed) return; this.destroyed = true; this.stop(); }
}

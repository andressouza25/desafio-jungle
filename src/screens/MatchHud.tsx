import type { GameSnapshot } from '../game/GameSession';
import heart from '../../assets/png/default/ui/hud/icon_heart.png';
import score from '../../assets/png/default/ui/hud/icon_score.png';
import time from '../../assets/png/default/ui/hud/icon_time.png';
import { formatMatchTime } from './ResultScreen';
export function MatchHud({ snapshot }: { snapshot: GameSnapshot | null }) {
  return <dl className="match-hud" aria-label="Match information">
    <div><dt><img src={heart} alt="" />Health</dt><dd>{snapshot?.playerHealth ?? 0} / {snapshot?.playerMaxHealth ?? 0}</dd></div>
    <div><dt><img src={score} alt="" />Score</dt><dd>{snapshot?.score ?? 0}</dd></div>
    <div><dt><img src={time} alt="" />Time remaining</dt><dd>{formatMatchTime(snapshot?.remainingSeconds ?? 0)}</dd></div>
  </dl>;
}

import forward from '../../assets/png/default/ui/controls/icon_forward.png';
import left from '../../assets/png/default/ui/controls/icon_turn_left.png';
import right from '../../assets/png/default/ui/controls/icon_turn_right.png';
import front from '../../assets/png/default/ui/controls/icon_fire_front.png';
import fireLeft from '../../assets/png/default/ui/controls/icon_fire_left.png';
import fireRight from '../../assets/png/default/ui/controls/icon_fire_right.png';
import pause from '../../assets/png/default/ui/controls/icon_pause.png';

const controls = [
  ['turnLeft', 'Rotate left', left], ['moveForward', 'Move forward', forward], ['turnRight', 'Rotate right', right],
  ['pause', 'Pause', pause],
  ['fireLeft', 'Left broadside', fireLeft], ['fireFront', 'Front attack', front], ['fireRight', 'Right broadside', fireRight],
] as const;
export function TouchControls({ active }: { active: boolean }) {
  return <div className="touch-controls" role="group" aria-label="Touch gameplay controls">
    {controls.map(([action, label, icon]) => <button key={action} type="button" data-game-action={action}
      aria-label={label} disabled={!active}><img src={icon} alt="" draggable={false} /></button>)}
  </div>;
}

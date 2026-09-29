import type { Screen } from '../app/navigation';
import { ArtButton } from '../components/ui/ArtButton';
import { ScreenShell } from '../components/ui/ScreenShell';
import pirateTitle from '../../assets/png/default/ui/menu/title_pirate_battle.png';
import pirateShip from '../../assets/png/default/ships/ship_2.png';

export function MainMenuScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <ScreenShell className="menu-panel--home">
      <h1 className="menu-title"><img src={pirateTitle} alt="Pirate Battle" /></h1>
      <p className="menu-tagline">Set sail. Take command.</p>
      <nav className="menu-nav" aria-label="Main menu">
        <div className="menu-nav__primary">
          <ArtButton type="button" onClick={() => onNavigate('game')}>Play</ArtButton>
          <ArtButton type="button" onClick={() => onNavigate('options')}>Options</ArtButton>
        </div>
        <div className="menu-instructions">
          <img src={pirateShip} alt="" aria-hidden="true" />
          <p>Navigate the islands. Survive the battle.</p>
          <details>
            <summary>How to play</summary>
            <p>Sail forward, turn your ship, and fire cannons to defeat enemy ships. Avoid islands and survive until the match ends.</p>
          </details>
        </div>
        <div className="menu-nav__secondary">
          <ArtButton type="button" variant="secondary" onClick={() => onNavigate('ranking')}>Ranking</ArtButton>
          <ArtButton type="button" variant="secondary" onClick={() => onNavigate('match-history')}>Match History</ArtButton>
        </div>
      </nav>
    </ScreenShell>
  );
}

import type { ReactNode } from 'react';
import jungleLogo from '../../../assets/logo_jungle_gaming.svg';

export function ScreenShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="sea-screen">
      <div className="sea-screen__island sea-screen__island--left" aria-hidden="true" />
      <div className="sea-screen__island sea-screen__island--right" aria-hidden="true" />
      <div className="sea-screen__ship sea-screen__ship--left" aria-hidden="true" />
      <div className="sea-screen__ship sea-screen__ship--right" aria-hidden="true" />
      <div className={`menu-panel ${className}`.trim()}>{children}</div>
      <img className="sea-screen__credit" src={jungleLogo} alt="" aria-hidden="true" />
    </div>
  );
}

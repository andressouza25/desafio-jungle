import { useEffect, useRef } from 'react';
import { ArtButton } from '../components/ui/ArtButton';

export function PauseDialog({ onResume, onLeave }: { onResume: () => boolean; onLeave: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    dialog?.querySelector('button')?.focus();
    return () => {
      dialog?.close();
      if (document.activeElement === document.body && previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  function resume() {
    ref.current?.close();
    if (!onResume()) { ref.current?.showModal(); ref.current?.querySelector('button')?.focus(); }
  }
  return <dialog ref={ref} className="pause-dialog" aria-labelledby="pause-title" aria-describedby="pause-description"
    onCancel={(event) => { event.preventDefault(); resume(); }}>
    <h2 id="pause-title">Paused</h2>
    <p id="pause-description">Ready when you are. Gameplay has stopped.</p>
    <div className="pause-dialog__actions">
      <ArtButton onClick={resume}>Resume</ArtButton>
      <ArtButton variant="secondary" onClick={onLeave}>Main Menu</ArtButton>
    </div>
  </dialog>;
}

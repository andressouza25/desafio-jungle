import { useState } from 'react';
import { ArtButton } from '../components/ui/ArtButton';
import { NumberStepper } from '../components/ui/NumberStepper';
import { ScreenShell } from '../components/ui/ScreenShell';
import { loadOptions, OPTION_LIMITS, parseOptionValue, saveOptions } from '../storage/options';
import type { GameOptions } from '../storage/options';

type OptionErrors = Partial<Record<keyof GameOptions, string>>;

export function OptionsScreen({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState(loadOptions);
  const [duration, setDuration] = useState(String(saved.sessionDurationSeconds));
  const [spawnInterval, setSpawnInterval] = useState(String(saved.enemySpawnIntervalSeconds));
  const [errors, setErrors] = useState<OptionErrors>({});
  const [status, setStatus] = useState('');

  const hasChanges = duration !== String(saved.sessionDurationSeconds)
    || spawnInterval !== String(saved.enemySpawnIntervalSeconds);

  function updateValue(field: keyof GameOptions, value: string) {
    if (field === 'sessionDurationSeconds') setDuration(value);
    else setSpawnInterval(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus('');
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDuration = parseOptionValue(duration, OPTION_LIMITS.sessionDurationSeconds);
    const parsedSpawn = parseOptionValue(spawnInterval, OPTION_LIMITS.enemySpawnIntervalSeconds);
    const nextErrors: OptionErrors = {};
    if (parsedDuration === null) nextErrors.sessionDurationSeconds = 'Enter a whole number from 60 to 180 seconds.';
    if (parsedSpawn === null) nextErrors.enemySpawnIntervalSeconds = 'Enter a whole number from 1 to 30 seconds.';
    setErrors(nextErrors);
    if (parsedDuration === null || parsedSpawn === null) {
      setStatus('Check the highlighted settings before saving.');
      return;
    }

    const next: GameOptions = {
      sessionDurationSeconds: parsedDuration,
      enemySpawnIntervalSeconds: parsedSpawn,
    };
    if (!saveOptions(next)) {
      setStatus('Settings could not be saved in this browser. Please try again.');
      return;
    }
    setSaved(next);
    setStatus('Settings saved. They will apply to your next match.');
  }

  return (
    <ScreenShell className="menu-panel--options">
      <h1 className="screen-title">Options</h1>
      <form className="options-form" onSubmit={handleSave} noValidate>
        <NumberStepper
          id="session-duration"
          label="Game session time"
          value={duration}
          min={OPTION_LIMITS.sessionDurationSeconds.min}
          max={OPTION_LIMITS.sessionDurationSeconds.max}
          hint="60–180 seconds"
          error={errors.sessionDurationSeconds}
          onChange={(value) => updateValue('sessionDurationSeconds', value)}
        />
        <NumberStepper
          id="spawn-interval"
          label="Enemy spawn time"
          value={spawnInterval}
          min={OPTION_LIMITS.enemySpawnIntervalSeconds.min}
          max={OPTION_LIMITS.enemySpawnIntervalSeconds.max}
          hint="1–30 seconds"
          error={errors.enemySpawnIntervalSeconds}
          onChange={(value) => updateValue('enemySpawnIntervalSeconds', value)}
        />
        <p className="options-form__status" role="status">{status}</p>
        <div className="options-form__actions">
          <ArtButton type="submit" disabled={!hasChanges && Object.keys(errors).length === 0}>
            Save Changes
          </ArtButton>
          <ArtButton type="button" variant="secondary" onClick={onBack}>Main Menu</ArtButton>
        </div>
      </form>
    </ScreenShell>
  );
}

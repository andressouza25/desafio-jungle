interface NumberStepperProps {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  hint: string;
  error?: string;
  onChange: (value: string) => void;
}

export function NumberStepper({ id, label, value, min, max, hint, error, onChange }: NumberStepperProps) {
  const numericValue = Number(value);
  const validNumber = /^\d+$/.test(value.trim()) && Number.isInteger(numericValue);

  function step(direction: -1 | 1) {
    const next = validNumber ? numericValue + direction : min;
    onChange(String(Math.max(min, Math.min(max, next))));
  }

  return (
    <div className={`number-stepper${error ? ' number-stepper--invalid' : ''}`}>
      <label className="number-stepper__label" htmlFor={id}>{label}</label>
      <div className="number-stepper__control">
        <button
          className="round-button round-button--minus"
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => step(-1)}
          disabled={validNumber && numericValue <= min}
        />
        <div className="number-stepper__input-wrap">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          />
          <span aria-hidden="true">s</span>
        </div>
        <button
          className="round-button round-button--plus"
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => step(1)}
          disabled={validNumber && numericValue >= max}
        />
      </div>
      <p className="number-stepper__hint" id={`${id}-hint`}>{hint}</p>
      {error && <p className="number-stepper__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

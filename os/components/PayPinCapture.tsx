import { useRef } from 'react';

type PayPinCaptureProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
};

/** Shared six-digit payment PIN capture used by payment sheets and dialogs. */
export function PayPinCapture({ value, onChange, length = 6 }: PayPinCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.slice(0, length);
  return (
    <button
      type="button"
      aria-label="payment password"
      className="flex w-full justify-center gap-2"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        value={digits}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
        inputMode="numeric"
        autoComplete="off"
        aria-label="payment password input"
        className="sr-only"
      />
      {Array.from({ length }, (_, index) => (
        <span key={index} className="flex h-10 w-10 items-center justify-center border-b-2 border-[#555] text-xl">
          {digits[index] ? '●' : ''}
        </span>
      ))}
    </button>
  );
}

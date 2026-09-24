import React, { useEffect, useRef } from 'react';

/**
 * Hidden PIN field so computer-use `type` can fill a custom keypad.
 * `inputMode="none"` keeps the OS keyboard from covering the pad.
 */
export function PayPinCapture({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focus = () => ref.current?.focus({ preventScroll: true });
    focus();
    const el = ref.current;
    if (!el) return;
    const onBlur = () => window.setTimeout(focus, 0);
    el.addEventListener('blur', onBlur);
    return () => el.removeEventListener('blur', onBlur);
  }, []);

  return (
    <input
      ref={ref}
      type="tel"
      inputMode="none"
      autoComplete="off"
      autoFocus
      aria-label="pay-pin"
      data-keep-keyboard
      value={value}
      maxLength={6}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      style={{
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
        pointerEvents: 'none',
        border: 0,
        padding: 0,
      }}
    />
  );
}

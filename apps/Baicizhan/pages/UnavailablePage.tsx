import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';

export default function UnavailablePage() {
  const s = useStrings();
  const { bindBack } = useBaicizhanGestures();
  const [sp] = useSearchParams();
  const feature = sp.get('feature') ?? s.featureDefaultName;

  return (
    <div className="flex h-full items-center justify-center bg-black/35 px-6" data-status-bar-foreground="light">
      <div role="dialog" aria-modal="true" aria-labelledby="unavailable-title" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EEF2FF] text-2xl">🛠️</div>
        <div id="unavailable-title" className="mt-4 text-lg font-bold text-[#212121]">{feature}</div>
        <div className="mt-2 text-sm leading-6 text-[#7B88A0]">{s.featureUnavailableDetail}</div>
        <button {...bindBack()} autoFocus className="mt-6 w-full rounded-full bg-[#2F58E8] py-3 text-sm font-semibold text-white">{s.confirm}</button>
      </div>
    </div>
  );
}

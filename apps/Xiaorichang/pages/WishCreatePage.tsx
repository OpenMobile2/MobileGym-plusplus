import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

export default function WishCreatePage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const [name, setName] = useState('');
  const [cost, setCost] = useState(100);

  return (
    <div className="flex h-full flex-col" style={{ background: colors.brandWash }} data-status-bar-foreground="dark">
      <PageHeader title={s.wishAdd} />
      <div className="px-4">
        <div className="rounded-2xl bg-white p-4">
          <input
            {...action('glow.wish.name.input', () => {}, { params: { value: name } })}
            value={name} onChange={(e) => setName(e.target.value)} placeholder={s.wishName}
            className="w-full bg-transparent text-base outline-none" />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-4">
          <span className="text-sm text-[#424242]">{s.wishCost}</span>
          <input type="number"
            {...action('glow.wish.cost.set', () => {}, { params: { value: cost } })}
            value={cost} onChange={(e) => setCost(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 rounded-xl bg-[#F5F6F7] px-3 py-2 text-right text-sm outline-none" />
        </div>
        <button
          {...action('glow.wish.commit', () => { st.addWish(name, cost); back(); })}
          className="mt-5 w-full rounded-full py-3 text-[15px] font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          {s.confirm}
        </button>
      </div>
    </div>
  );
}

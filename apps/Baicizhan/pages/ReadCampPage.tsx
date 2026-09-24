import React, { useState } from 'react';
import type { ActivityResult } from '@/os/types/manifest';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';

const LEVELS = [
  { key: 'basic', id: 'read.camp.select.basic', label: '初阶', sub: '词汇量3500内' },
  { key: 'mid', id: 'read.camp.select.mid', label: '中阶', sub: '词汇量6000内' },
  { key: 'high', id: 'read.camp.select.high', label: '高阶', sub: '词汇量6000+' },
] as const;

export default function ReadCampPage() {
  const s = useStrings();
  const { action, bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [lv, setLv] = useState('basic');
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-12" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-[#E6F4EF] p-4"><div className="text-lg font-bold text-[#2C7A6B]">薄荷阅读带读营</div><div className="text-xs text-[#5B9A8C]">陪你读完人生第一本英文书</div></div>
        <div className="mt-4 flex gap-3">
          {LEVELS.map((l) => {
            const on = l.key === lv;
            return (
              <button key={l.key} {...action(l.id, () => setLv(l.key))} className="flex-1 rounded-2xl p-3 text-center" style={{ background: on ? '#E6F4EF' : '#F4F6F9', outline: on ? `1px solid ${colors.readTeal}` : 'none' }}>
                <div className="text-sm font-semibold" style={{ color: on ? colors.readTeal : '#33405C' }}>{l.label}</div><div className="text-[10px] text-[#9AA5B1]">{l.sub}</div>
              </button>
            );
          })}
        </div>
        <button {...bindTap('read.camp.unavailable.open', { params: { feature: '更新阅读词汇量' } })} className="mt-3 text-xs text-[#5B78C8]">更新词汇量 ›</button>
        <div className="mt-3 overflow-hidden rounded-2xl bg-[#F4F6F9]">
          <div className="h-32 bg-[#B0C4B8]" />
          <div className="p-3"><div className="text-sm font-semibold text-[#33405C]">100天,和阿加莎一起「纸上剧本杀」</div><div className="mt-1 text-xs text-[#9AA5B1]">第93期 · 初阶 · 约8分钟/天 · 主理人Ruby</div>
            <div className="mt-1 text-xs text-[#9AA5B1]">7月21日~10月28日 · 3524人已报名</div>
            <button {...action('read.camp.pay.system', () => {
              const selected = LEVELS.find((item) => item.key === lv) ?? LEVELS[0];
              const launched = window.__OS__?.startActivityForResult?.(
                'alipay',
                {
                  action: 'ACTION_PAY',
                  scheme: 'alipays',
                  data: { amount: 99, orderId: `bcz-read-camp-${selected.key}`, merchantName: '百词斩', subject: `薄荷阅读带读营·${selected.label}`, source: 'baicizhan' },
                },
                (result: ActivityResult) => { if (result.resultCode === 'OK') st.registerReadCamp(selected.key); },
              );
              if (!launched) toast();
            })} disabled={st.readCampLevel === lv} className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.readTeal }}>{st.readCampLevel === lv ? '已报名' : '去报名'}</button></div>
        </div>
      </div>
    </div>
  );
}

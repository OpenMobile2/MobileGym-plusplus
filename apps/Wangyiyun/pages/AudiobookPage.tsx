import React from 'react';
import { Screen, useToast, coverBg, WY, NOT_OPEN } from '../components/ui';
import { HomeTopTabs } from '../components/parts';

const BOOKS = [['程教授，别来无恙', '现代言情 · 113万播放'], ['一吻定情', '9.3 · 17万播放'], ['今天也没变成玩偶呢', '限免 · 198万播放']];
export default function AudiobookPage() {
  const [toast, showToast] = useToast();
  return (
    <Screen>
      <HomeTopTabs />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="rounded-xl p-3 my-2 text-white text-[13px]" style={{ background: `linear-gradient(90deg,${WY.vipGold},#C79A54)` }}>Hi，邀你畅听万本会员好书 · 3元升级</div>
        <div className="flex gap-3 py-2 text-[13px]">{['排行榜', '全部分类', '奇想剧场'].map((c) => <button key={c} onClick={() => showToast(NOT_OPEN)} className="px-3 py-1.5 rounded-full bg-white border-none cursor-pointer" style={{ color: WY.textPrimary }}>{c}</button>)}</div>
        {BOOKS.map(([t, s], i) => (
          <button key={t} onClick={() => showToast(NOT_OPEN)} className="flex items-center gap-3 w-full py-3 border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <span className="w-5 text-[15px]" style={{ color: WY.primary }}>{i + 1}</span>
            <div className="w-12 h-16 rounded" style={{ background: coverBg(t) }} />
            <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>{t}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{s}</div></div>
          </button>
        ))}
        {toast}
      </div>
    </Screen>
  );
}

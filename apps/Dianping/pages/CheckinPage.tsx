import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { CHECKIN_MOODS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcClose, IcSearch, IcCheckinPin, IcMapMini } from '../res/icons';

export default function CheckinPage() {
  const s = useAppStrings(strings, stringsEn);
  const { action, bindBack } = useDianpingGestures();
  const [sp] = useSearchParams();
  const fromShop = sp.get('shop') || '';
  const shops = useDianpingStore((st) => st.shops);
  const addCheckin = useDianpingStore((st) => st.addCheckin);
  const showToast = useDianpingStore((st) => st.showToast);
  // 从店铺打卡进入时,把该店排到最前并默认选中
  const nearby = [...shops]
    .sort((a, b) => {
      if (a.id === fromShop) return -1;
      if (b.id === fromShop) return 1;
      return a.distanceM - b.distanceM;
    })
    .slice(0, 8);
  const [selectedId, setSelectedId] = useState(fromShop || nearby[0]?.id || '');
  const [mood, setMood] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const selected = shops.find((x) => x.id === selectedId);
  const checkinCount = useDianpingStore((st) => st.checkins.length);
  const moodLabel = CHECKIN_MOODS.find((m) => m.id === mood)?.label;

  const commit = () => {
    if (!selectedId) return;
    addCheckin(selectedId, mood ?? undefined);
    setDone(true);
  };

  return (
    <div className="relative flex h-full flex-col justify-end" data-status-bar-foreground="dark">
      {/* 顶部半透明地图占位(仿从底部弹出的浮层,点击空白处下沉关闭) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E7F0DF] to-[#DDE9F0]" />
      <button
        type="button"
        aria-label="close"
        className="absolute inset-0 border-none bg-black/25 cursor-pointer"
        {...bindBack()}
      />

      {/* 选中地点浮层 */}
      <div className="relative z-10 flex flex-col items-center pb-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8A4C] to-[#FF6633] shadow-lg">
          <IcCheckinPin size={26} className="text-white" />
        </span>
        <span className="mt-1 max-w-[70%] truncate rounded-full bg-white/90 px-3 py-1 text-[14px] font-semibold text-(--app-c-text-primary)">
          {selected?.name ?? '选择打卡地点'}
        </span>
      </div>

      {/* 底部 sheet */}
      <div className="relative z-10 rounded-t-[18px] bg-(--app-c-card-bg) pb-3">
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-black text-(--app-c-text-primary)">{s.tabCheckin}</span>
            <span className="text-[13px] text-(--app-c-text-muted)">留下值得记住的时刻</span>
          </div>
          <button type="button" className="border-none bg-transparent p-1 text-(--app-c-text-secondary) cursor-pointer" {...bindBack()}>
            <IcClose size={22} />
          </button>
        </div>

        <div className="px-4 pb-2 pt-1">
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-full border-none bg-(--app-c-page-bg) px-3 text-left text-[13px] text-(--app-c-text-muted) cursor-pointer"
            {...action('checkin.search.open.disabled', () => showToast(s.notOpen))}
          >
            <IcSearch size={15} className="text-(--app-c-text-muted)" />
            {s.search}
          </button>
        </div>

        <div
          className="max-h-[38vh] overflow-y-auto"
          data-scroll-container="checkin"
          data-scroll-direction="vertical"
        >
          {nearby.map((shop) => {
            const sel = shop.id === selectedId;
            return (
              <div key={shop.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left cursor-pointer"
                  {...action('checkin.shop.select.target', () => setSelectedId(shop.id), { params: { id: shop.id } })}
                >
                  <IcMapMini size={20} className="shrink-0 text-[#888]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-(--app-c-text-primary)">{shop.name}</div>
                    <div className="text-[12px] text-(--app-c-text-muted)">
                      {shop.category} {shop.distanceM}m
                    </div>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] text-white ${
                      sel ? 'bg-[#FF6633]' : 'border-2 border-[#DDD]'
                    }`}
                  >
                    {sel ? '✓' : ''}
                  </span>
                </button>
                {sel ? (
                  <div className="flex gap-2 overflow-x-auto px-4 pb-2">
                    {CHECKIN_MOODS.map((m) => {
                      const on = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`shrink-0 rounded-full border px-3 py-1 text-[12px] cursor-pointer ${
                            on ? 'border-[#FF6633] bg-[#FFF1EA] text-[#FF6633]' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-secondary)'
                          }`}
                          {...action('checkin.mood.select.target', () => setMood(on ? null : m.id), {
                            params: { target: m.id },
                          })}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="px-4 pt-2">
          <button
            type="button"
            className="w-full rounded-full border-none bg-[#FF6633] py-3 text-center text-[16px] font-bold text-white cursor-pointer disabled:opacity-50"
            disabled={!selectedId}
            {...action('checkin.submit.commit', commit)}
          >
            {s.checkinNow}
          </button>
        </div>
      </div>

      {/* 打卡成功(对齐 added_2 · 参照原图打卡后评价) */}
      {done ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 px-8">
          <div className="w-full rounded-[16px] bg-(--app-c-card-bg) px-5 pb-5 pt-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8A4C] to-[#FF6633] shadow-lg">
              <IcCheckinPin size={30} className="text-white" />
            </span>
            <div className="mt-3 text-[20px] font-black text-(--app-c-text-primary)">打卡成功</div>
            <div className="mt-1 text-[14px] font-medium text-(--app-c-text-primary)">
              {selected?.name ?? ''}
            </div>
            <div className="mt-1 text-[12px] text-(--app-c-text-muted)">
              {moodLabel ? `心情·${moodLabel} · ` : ''}这是你在点评的第 {checkinCount} 次打卡
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-full border-none bg-[#FF6633] py-2.5 text-[15px] font-bold text-white cursor-pointer"
              {...bindBack()}
            >
              {s.done}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

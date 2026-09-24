import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { DIANPING_CONFIG } from '../data';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcShare, IcSearch, IcPersonAdd, IcPear } from '../res/icons';
import { Stars } from '../components/Stars';
import { sharePlainText } from '@/os/shareBridge';

type Tab = 'dynamic' | 'reviews' | 'notes';

export default function ProfilePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const userReviews = useDianpingStore((st) => st.userReviews);
  const checkins = useDianpingStore((st) => st.checkins);
  const browseHistory = useDianpingStore((st) => st.browseHistory);
  const orders = useDianpingStore((st) => st.orders);
  const [sp] = useSearchParams();
  const initialTab: Tab = sp.get('tab') === 'reviews' ? 'reviews' : 'dynamic';
  const [tab, setTab] = useState<Tab>(initialTab);
  const user = DIANPING_CONFIG.user;

  const footprint = browseHistory.filter((e) => e.kind === 'shop').length;
  const dining = orders.filter((o) => o.status !== 'pending_pay').length;

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 彩色头部 */}
      <div className="bg-gradient-to-b from-[#9C6B4E] to-[#B98A6E] px-4 pb-3 pt-1 text-white">
        <div className="flex items-center justify-between">
          <button type="button" className="border-none bg-transparent p-1 text-white cursor-pointer" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <button
            type="button"
            className="border-none bg-transparent p-1 text-white cursor-pointer"
            {...action('profile.share.open', () => {
              const text = `【大众点评】${userProfile.nickname}的主页 https://dianping.mock/profile`;
              const launched = sharePlainText(text, {
                onResult: (result) => {
                  if (result.resultCode === 'OK') showToast('分享成功');
                },
              });
              if (!launched) showToast(s.notOpen);
            })}
          >
            <IcShare size={19} />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <IcPear size={64} className="shrink-0 rounded-full ring-2 ring-white/50" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-black">{userProfile.nickname}</div>
            <div className="mt-0.5 text-[12px] text-white/85">{userProfile.gender} | IP: 江苏省</div>
            <span className="mt-1 inline-block rounded-full bg-[#F5C518] px-1.5 py-0.5 text-[10px] font-bold text-[#7A4E00]">
              Lv{user.level ?? 5}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[13px] text-white/90">{userProfile.bio}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-5">
            {(
              [
                [String(user.fans ?? 3), s.fans],
                [String(user.following ?? 5), s.following],
                [String(user.likes ?? 10), s.likesGot],
              ] as const
            ).map(([n, label]) => (
              <div key={label} className="text-center">
                <div className="text-[16px] font-black">{n}</div>
                <div className="text-[11px] text-white/80">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-white/70 bg-transparent px-4 py-1.5 text-[13px] font-medium text-white cursor-pointer"
              {...bindTap('profile.edit-open')}
            >
              {s.editProfile}
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-transparent text-white cursor-pointer"
              {...action('profile.edit.open.disabled', () => showToast(s.notOpen))}
            >
              <IcPersonAdd size={16} />
            </button>
          </div>
        </div>
        {/* 统计卡 */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              [s.checkin, `累计${checkins.length}次`],
              [s.mineFootprint, `${footprint}个足迹`],
              [s.mineTaste, `用餐${dining}次`],
            ] as const
          ).map(([t, sub]) => (
            <div key={t} className="rounded-[10px] bg-white/15 px-2 py-2">
              <div className="text-[13px] font-bold">{t}</div>
              <div className="mt-0.5 text-[11px] text-white/85">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[16px] bg-white" data-scroll-container="profile" data-scroll-direction="vertical">
        <div className="flex items-center border-b border-[#F0F0F0] px-4">
          {(
            [
              ['dynamic', s.tabDynamic],
              ['reviews', s.reviews],
              ['notes', s.tabNote],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                className={`relative mr-6 border-none bg-transparent py-3 text-[15px] cursor-pointer ${
                  active ? 'font-bold text-[#222]' : 'text-[#888]'
                }`}
                {...action('profile.tab.select.target', () => setTab(id), { params: { target: id } })}
              >
                {label}
                {active ? <span className="absolute bottom-0 left-0 h-[3px] w-6 rounded-full bg-[#FF6633]" /> : null}
              </button>
            );
          })}
          <button
            type="button"
            className="ml-auto border-none bg-transparent p-1 text-[#999] cursor-pointer"
            {...action('profile.edit.open.disabled', () => showToast(s.notOpen))}
          >
            <IcSearch size={18} />
          </button>
        </div>

        {tab === 'notes' ? (
          <div className="py-16 text-center text-[13px] text-[#999]">还没有发布笔记</div>
        ) : userReviews.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyReviews}</div>
        ) : (
          userReviews.map((r) => (
            <button
              key={r.id}
              type="button"
              className="flex w-full flex-col border-none border-b border-[#F5F5F5] bg-white px-4 py-3 text-left cursor-pointer"
              {...bindTap('shop.review-open', { params: { shopId: r.shopId, reviewId: r.id } })}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-[14px] font-semibold text-[#222]">{r.shopName}</span>
                <Stars score={r.score} size={11} showScore={false} />
              </div>
              <div className="mt-1 text-[13px] leading-5 text-[#555]">{r.body}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

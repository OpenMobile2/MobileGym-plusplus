import React, { useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, formatCount } from '../components/ui';
import { IcHeadphones, IcChevronRight } from '../res/icons';

function fmtDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
}

const TABS = ['会员', '儿童会员'] as const;

export function MemberCenterPage() {
  const { bindTap } = useXimalayaGestures();
  const user = useXimalayaStore((st) => st.user);
  const albums = useXimalayaStore((st) => st.albums);
  const [tab, setTab] = useState<string>('会员');

  const superList = albums.filter((a) => a.isVip).slice(0, 4);
  const childAlbums = albums.filter((a) => a.category.includes('儿童')).slice(0, 4);
  const gridAlbums = childAlbums.length ? childAlbums : albums.slice(0, 4);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#1C1B22] text-white" data-status-bar-foreground="light">
      {/* 顶部 会员/儿童会员 切换 */}
      <div className="shrink-0 h-11 flex items-center justify-center gap-8 bg-[#1C1B22]">
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'member.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) })}
              className={active ? 'text-[16px] font-semibold text-[#F5C36B]' : 'text-[15px] text-white/60'}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 用户 + VIP 状态卡 */}
        <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-br from-[#3A3140] to-[#241E28] p-4">
          <div className="flex items-center gap-3">
            <Img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-[#F5C36B]/60" />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[#F5D9A0]">{user.name}</div>
              <div className="text-[12px] text-white/60 mt-0.5">
                {tab === '会员'
                  ? user.isVip
                    ? `VIP 有效期至 ${fmtDate(user.vipExpireAt)}`
                    : '你还不是 VIP 会员'
                  : '开通儿童 VIP,守护孩子的耳朵'}
              </div>
            </div>
          </div>
          <button
            {...bindTap('member.purchase-open')}
            className="mt-3 w-full h-10 rounded-full bg-gradient-to-r from-[#F5D9A0] to-[#E7B85C] text-[#4A2F0B] text-[15px] font-semibold"
          >
            {tab === '会员' ? (user.isVip ? '续费会员' : '立即开通') : '开通儿童 VIP'}
          </button>
        </div>

        {tab === '会员' && (
          <div className="mx-3 mt-4 rounded-2xl bg-[#26232C] p-4">
            <div className="text-[12px] text-white/50">我的 VIP 值</div>
            <div className="text-[22px] font-semibold text-[#F5C36B] mt-1">{formatCount(user.listenHours * 10)}</div>
          </div>
        )}

        {/* 超前听 / 抢先听 专辑 */}
        <div className="mx-3 mt-4 mb-4">
          <div className="text-[16px] font-semibold mb-2">{tab === '会员' ? '白金专享·超前听' : '儿童精选'}</div>
          <div className="flex flex-col gap-2.5">
            {(tab === '会员' ? superList : gridAlbums).map((a) => (
              <div
                key={a.id}
                {...bindTap('member.superlisten-open', { params: { id: a.id } })}
                className="rounded-xl bg-[#26232C] p-2.5 flex gap-3 items-center"
              >
                <Img src={a.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium line-clamp-2">{a.title}</div>
                  <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                    <IcHeadphones size={11} />{formatCount(a.playCount)}
                  </div>
                </div>
                <span className="shrink-0 h-7 px-3 rounded-full bg-[#F5C36B]/20 text-[#F5C36B] text-[12px] flex items-center gap-0.5">
                  去收听<IcChevronRight size={13} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

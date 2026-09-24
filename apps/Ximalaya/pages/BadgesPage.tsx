import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { TopBar, Sheet, showToast } from '../components/ui';
import { IcMedal, IcShare, IcClose } from '../res/icons';
import type { Badge } from '../types';

const BADGE_TABS = ['收听成就', '频道粉丝成就', '限定成就'] as const;

export function BadgesPage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const [sp] = useSearchParams();
  const badges = useXimalayaStore((st) => st.badges);
  const [tab, setTab] = useState<string>(BADGE_TABS[0]);
  const [detail, setDetail] = useState<Badge | null>(null);
  const [expanded, setExpanded] = useState(false);

  const earnedCount = badges.filter((b) => b.earned).length;
  const inGroup = badges.filter((b) => b.group === tab);
  const shown = expanded ? inGroup : inGroup.slice(0, 6);
  const shareOpen = sp.get('panel') === 'share';

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar
        title="勋章墙"
        right={
          <button {...bindTap('badges.share-open')} aria-label="分享" className="w-9 h-9 flex items-center justify-center text-[#666]">
            <IcShare size={20} />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 勋章数 + 佩戴管理 */}
        <div className="bg-white px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-[20px] font-semibold text-[#333]">{earnedCount} 枚</div>
            <div className="text-[12px] text-[#999] mt-0.5">已超过 98% 的用户</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'badges.wear.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
            className="h-8 px-3 rounded-full border border-[#EEE] text-[13px] text-[#666]"
          >
            佩戴管理
          </button>
        </div>

        {/* 分类 Tab */}
        <div className="bg-white flex items-center gap-6 px-4 h-11 border-t border-[#F5F5F5] text-[14px]">
          {BADGE_TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'badges.tab.select.opt' }, { params: { tab: t }, onTrigger: () => { setTab(t); setExpanded(false); } })}
                className={active ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] h-11' : 'text-[#999] h-11'}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* 勋章网格 */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {shown.map((b) => (
            <button
              key={b.id}
              {...bindTap({ kind: 'action', id: 'badges.detail.open' }, { params: { bid: b.id }, onTrigger: () => setDetail(b) })}
              className="bg-white rounded-xl py-4 flex flex-col items-center gap-2"
            >
              <div className={'w-14 h-14 rounded-full flex items-center justify-center ' + (b.earned ? 'bg-[#FFF0EF] text-[#FE4543]' : 'bg-[#F0F0F0] text-[#CCC]')}>
                <IcMedal size={30} />
              </div>
              <div className={'text-[12px] text-center px-1 line-clamp-2 ' + (b.earned ? 'text-[#333]' : 'text-[#BBB]')}>{b.title}</div>
            </button>
          ))}
        </div>

        {inGroup.length > 6 && !expanded && (
          <button
            {...bindTap({ kind: 'action', id: 'badges.more.tap' }, { onTrigger: () => setExpanded(true) })}
            className="mx-auto mb-4 block text-[13px] text-[#999]"
          >
            展开更多
          </button>
        )}
      </div>

      {/* 勋章详情弹窗(获得弹窗 + 立即分享) */}
      {detail && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-[74%] bg-white rounded-2xl p-5 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute top-2 right-2 text-[#CCC]"><IcClose size={20} /></button>
            <div className="text-[14px] text-[#FE4543] font-medium">{detail.earned ? '恭喜获得勋章!' : '尚未获得'}</div>
            <div className={'w-20 h-20 rounded-full mt-3 flex items-center justify-center ' + (detail.earned ? 'bg-[#FFF0EF] text-[#FE4543]' : 'bg-[#F0F0F0] text-[#CCC]')}>
              <IcMedal size={44} />
            </div>
            <div className="text-[16px] font-semibold text-[#333] mt-3 text-center">{detail.title}</div>
            <div className="text-[12px] text-[#999] mt-1">{detail.earned ? `获得于 ${detail.date}` : '继续收听即可解锁'}</div>
            <button
              {...bindTap('badges.share-open', { beforeTrigger: () => setDetail(null) })}
              className="mt-4 w-full h-10 rounded-full bg-[#FE4543] text-white text-[15px] font-medium"
            >
              立即分享
            </button>
          </div>
        </div>
      )}

      {/* 分享面板(URL 驱动) */}
      {shareOpen && (
        <Sheet title="分享到" onCloseNode={<button {...bindBack()} className="absolute right-3 text-[#999]"><IcClose size={18} /></button>}>
          <div className="grid grid-cols-4 gap-4 p-5">
            {['微信', '朋友圈', 'QQ', '微博'].map((c) => (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix4' }, { onTrigger: () => showToast('该功能暂未开放') })}
                className="flex flex-col items-center gap-1.5 text-[12px] text-[#666]"
              >
                <div className="w-12 h-12 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#999]"><IcShare size={22} /></div>
                {c}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

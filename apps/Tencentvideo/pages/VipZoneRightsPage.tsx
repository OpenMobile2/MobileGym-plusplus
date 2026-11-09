// 会员专区·领权益。节点 vip.zone.rights(tab 根页 /vipzone,spec 12 条交互)。
// 视觉证据 748:米色顶区(V力值/积分 + 「开JUMP卡去现场」深色按钮)→ 子tab行 →
// TODAY 双 banner → 会员等级权益(V1~V8 阶梯,当前档位金色)→ 当前等级特权楼层。
// 数字一律读 user + membership:收银台 mock 支付会加 V力值/积分并升 SVIP,本页要跟着变(交活标准③)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { ZoneTabRow } from '../components/vipzone';
import { IcArrowRight, IcFollow } from '../res/icons';

export default function VipZoneRightsPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const membership = useTencentvideoStore((s) => s.membership);
  const user = useTencentvideoStore((s) => s.user);
  const contents = useTencentvideoStore((s) => s.contents);
  const yearHotActivity = useTencentvideoStore((s) => s.yearHotActivity);

  const vPower = membership.vPower;
  const levels = vPower.levels;
  // 当前档位在阶梯里的位置(证据 748:V1 柱下方标「当前」,右侧档位灰显)
  const currentIndex = Math.max(0, levels.findIndex((l) => l.level === vPower.current));

  // TODAY 双卡:种子没有单独的运营位,用年度热门首组的前两部内容顶上(证据 748 两张剧集运营卡)
  const todayCards = useMemo(() => {
    const ids = yearHotActivity.groups[0]?.ids ?? [];
    return ids
      .slice(0, 2)
      .map((id) => contents.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [yearHotActivity.groups, contents]);

  const tabBind = () => bindTap('vip.zone.points.open.fromTab');

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      {/* 顶区(证据 748:米金底,左侧 V力值/积分,右侧深色 JUMP 按钮) */}
      <div className="shrink-0 flex items-center gap-4 px-3 py-3" style={{ background: C.rankChipBg }}>
        <div className="text-center">
          <div className="text-[20px] font-bold leading-[24px]" style={{ color: C.text }}>
            {vPower.value}
          </div>
          <div className="text-[11px]" style={{ color: C.textSub }}>
            V力值
          </div>
        </div>
        <button
          {...bindTap('vip.zone.points.open.fromScore')}
          className="text-center bg-transparent border-none p-0"
        >
          <div className="text-[20px] font-bold leading-[24px]" style={{ color: C.text }}>
            {user.points}
          </div>
          <div className="text-[11px]" style={{ color: C.textSub }}>
            积分
          </div>
        </button>
        <div className="flex-1" />
        <span className="text-[12px]" style={{ color: C.textSub }}>{membership.levelLabel} · {membership.expire}到期</span>
      </div>

      <ZoneTabRow tabs={['领权益', '花积分']} activeLabel="领权益" getBind={tabBind} />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* TODAY 楼层(证据 748:大写标题 + 右侧日历 icon + 两张横向运营卡) */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <span className="text-[22px] font-bold" style={{ color: C.text }}>
            TODAY
          </span>
          <IcFollow size={20} style={{ color: C.textSub }} aria-hidden />
        </div>
        <div className="flex gap-2 px-3 overflow-x-auto scrollbar-none">
          {todayCards.map((c) => (
            <button
              key={c.id}
              {...bindTap('detail.series.open.fromVipToday', { params: { contentId: c.id } })}
              className="shrink-0 w-[268px] rounded-xl overflow-hidden border-none p-0 text-left"
              style={{ background: C.chipGray }}
            >
              <div className="relative h-[150px]">
                <TvImg id={c.still} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute left-2.5 top-2 pr-10">
                  <div className="text-[15px] font-bold text-white leading-[20px]">{c.title}</div>
                  <div className="text-[13px] font-semibold text-white/90 leading-[18px]">
                    {c.tags.join(' · ')}
                  </div>
                </div>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 h-8 text-[12px]"
                style={{ background: C.primary, color: '#FFFFFF' }}
              >
                <span className="flex-1 truncate">{c.recommend}</span>
                <IcArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>

        {/* 会员等级权益(证据 748) */}
        <div className="flex items-center justify-between px-3 pt-5">
          <span className="text-[18px] font-bold" style={{ color: C.text }}>
            会员等级权益
          </span>
        </div>
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-[12px]" style={{ color: C.textSub }}>
            {vPower.current}等级,拥有{vPower.value}V力值,享{membership.levelUpCard.current.items}项等级权益
          </span>
          <span className="text-[12px]" style={{ color: C.textSub }}>权益展示</span>
        </div>

        <div className="mx-3 mt-2 rounded-xl px-2 pt-3 pb-2" style={{ background: C.chipGray }}>
          <div className="flex items-end gap-1">
            {levels.map((lv, i) => {
              const current = i === currentIndex;
              const reached = i <= currentIndex;
              return (
                <div
                  key={lv.level}
                  className="flex-1 min-w-0 flex flex-col items-center bg-transparent border-none p-0 h-[92px]"
                >
                  {/* 档位名固定在同一条基线上,柱子由下往上顶到基线(证据 748) */}
                  <span
                    className="text-[15px] font-bold leading-[20px]"
                    style={{ color: current ? C.memberLevel : C.textTertiary }}
                  >
                    {lv.level}
                  </span>
                  <span className="flex-1 w-full flex items-end pt-1">
                    <span
                      className="w-full rounded-t-[3px]"
                      style={{
                        height: 16 + i * 7,
                        background: reached ? C.vipBadgeBg : C.divider,
                      }}
                    />
                  </span>
                  <span
                    className="text-[9px] leading-[12px] h-3 truncate w-full text-center"
                    style={{ color: current ? C.memberLevel : C.textTertiary }}
                  >
                    {current ? '当前' : ''}
                  </span>
                </div>
              );
            })}
          </div>
          {/* 每档特权名(种子 vPower.levels[].perk) */}
          <div className="flex gap-1 pt-1">
            {levels.map((lv, i) => (
              <span
                key={lv.level}
                className="flex-1 min-w-0 text-[9px] leading-[12px] text-center truncate"
                style={{ color: i === currentIndex ? C.memberLevel : C.textSub }}
              >
                {lv.perk}
              </span>
            ))}
          </div>
        </div>

        {/* 当前等级特权楼层(证据 748 底部截断的浅色楼层) */}
        <div className="px-3 pt-5">
          <div className="text-[18px] font-bold pb-2" style={{ color: C.text }}>
            {vPower.current}特权
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: C.primaryBg }}>
            <div className="text-[14px] font-semibold" style={{ color: C.memberLevel }}>
              {membership.levelUpCard.current.label}
            </div>
            <div className="text-[12px] pt-0.5" style={{ color: C.text }}>
              可享{membership.levelUpCard.current.items}项 · 总价值
              {membership.levelUpCard.current.value}元 · {membership.levelUpCard.current.tagline}
            </div>
            <div className="text-[11px] pt-1" style={{ color: C.textSub }}>
              {membership.levelUpCard.gapNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 个人主页(用户资料页)。节点 me.profile(spec 8 条交互 / 3 个 tab uiState)。
// 视觉证据:724(渐变 banner + 白卡资料区 + 三卡 + 观影成就 + 动态/评分/弹幕 tab 空态 +
// 底部浮动「写动态 | 发视频」)。
// 顶部渐变要一路铺到状态栏底下 → 走 CHROME_TOP_COLOR_KEY(与首页沉浸态同一套机制)。
import React, { useEffect } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { CHROME_TOP_COLOR_KEY, TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { EmptyState } from '../components/ui';
import type { BindProps } from '../components/ui';
import { IcArrowRight, IcCamera, IcFeedback, IcMore, IcNavBack } from '../res/icons';

/** 当前 tab 的页面态键(动态/评分/弹幕,均为空态) */
const TAB_KEY = 'me.profile.tab';

/**
 * banner 渐变:起点用品牌青绿(design-tokens 主色),收尾用 components/Img.tsx 里
 * 既有的深青 #0a4a52(同一套品牌暗调),不引入新色。
 */
const BANNER_GRADIENT = `linear-gradient(160deg, ${C.primary} 0%, #0a4a52 100%)`;

export default function MeProfilePage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const user = useTencentvideoStore((s) => s.user);
  const membership = useTencentvideoStore((s) => s.membership);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);

  const activeTab = typeof ui[TAB_KEY] === 'string' ? (ui[TAB_KEY] as string) : user.profileTabs[0];

  useEffect(() => {
    setUi(CHROME_TOP_COLOR_KEY, C.primary);
    return () => setUi(CHROME_TOP_COLOR_KEY, '');
  }, [setUi]);

  const wontfix = (id: string): BindProps =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  /**
   * 三卡内容照 724:我的等级(V力值)/我的卡牌/我的纪念票。
   * 纪念票张数种子里没有独立字段,用同为 0 的 user.diamonds 顶上(已在交付报告里提诉求)。
   */
  const cards = [
    { title: '我的等级', note: `V力值 ${user.vPower}` },
    { title: '我的卡牌', note: '看剧集卡·快乐加倍' },
    { title: '我的纪念票', note: `拥有 ${user.diamonds} 张` },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 渐变 banner + 顶部返回/⋯(白色前景压在深色渐变上) */}
        <div className="relative h-[132px]" style={{ background: BANNER_GRADIENT }}>
          <div className="flex items-center h-11 px-2">
            <button
              {...bindBack()}
              className="bg-transparent border-none p-1"
              style={{ color: C.darkText }}
              aria-label={s.back}
            >
              <IcNavBack size={22} />
            </button>
            <div className="flex-1" />
            <button
              {...wontfix('me.profile.more.wontfix')}
              className="bg-transparent border-none p-1"
              style={{ color: C.darkText }}
              aria-label="更多"
            >
              <IcMore size={20} />
            </button>
          </div>
          {/* 右上会员纪念票/勋章装饰(724) */}
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 opacity-90">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
            >
              {membership.vPower.current}
            </span>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-[10px]"
              style={{ background: C.svipBarBg, color: C.svipBarText }}
            >
              {user.vipLevelLabel}
            </span>
          </div>
        </div>

        {/* 资料白卡(压住 banner 下缘) */}
        <div className="-mt-4 rounded-t-2xl px-4 pt-3" style={{ background: C.pageBg }}>
          <div className="flex items-center gap-3">
            <TvImg
              id={user.avatar}
              alt={user.nickname}
              className="w-[62px] h-[62px] rounded-full object-cover -mt-8 border-4"
              style={{ borderColor: C.pageBg }}
            />
            <span className="flex-1 text-[22px] font-bold truncate" style={{ color: C.text }}>
              {user.nickname}
            </span>
            <button
              {...wontfix('me.profile.edit.wontfix')}
              className="shrink-0 px-3 h-8 rounded-full border-none text-[13px]"
              style={{ background: C.chipGray, color: C.text }}
            >
              修改资料
            </button>
          </div>

          <div className="pt-3 text-[12px]" style={{ color: C.textTertiary }}>
            暂无简介
          </div>

          {/* 关注/粉丝/转赞评(724 全为 0) */}
          <div className="flex items-center gap-3 pt-2.5">
            {[
              { label: '关注', value: user.following },
              { label: '粉丝', value: user.followers },
              { label: '转赞评', value: user.interactions },
            ].map((item) => (
              <button
                key={item.label}
                {...wontfix('me.profile.social.wontfix')}
                className="bg-transparent border-none p-0 text-[13px]"
                style={{ color: C.textSub }}
              >
                <span className="font-semibold" style={{ color: C.text }}>
                  {item.value}
                </span>{' '}
                {item.label}
              </button>
            ))}
          </div>

          {/* 三卡 */}
          <div className="flex gap-2 pt-3">
            {cards.map((card) => (
              <button
                key={card.title}
                {...wontfix('me.profile.cards.wontfix')}
                className="flex-1 min-w-0 rounded-xl px-2.5 py-2 border-none text-left"
                style={{ background: C.chipGray }}
              >
                <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>
                  {card.title}
                </div>
                <div className="text-[10px] truncate" style={{ color: C.textSub }}>
                  {card.note}
                </div>
              </button>
            ))}
          </div>

          {/* 观影成就 */}
          <button
            {...wontfix('me.profile.achieve.wontfix')}
            className="w-full rounded-xl px-3 py-3 mt-2 border-none text-left"
            style={{ background: C.chipGray }}
          >
            <div className="flex items-center">
              <span className="flex-1 text-[13px]" style={{ color: C.textSub }}>
                观影成就
              </span>
              <span className="text-[12px]" style={{ color: C.rankChipText }}>
                已领取 {user.achievements.medalCount} 个勋章
              </span>
              <IcArrowRight size={13} style={{ color: C.rankChipText }} />
            </div>
            <div className="flex items-end pt-2">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: C.memberLevel }}>
                  鉴片新生
                </div>
                <div className="text-[11px]" style={{ color: C.textSub }}>
                  观影累计20部+
                </div>
              </div>
              <div className="text-center px-3">
                <div className="text-[18px] font-bold leading-[22px]" style={{ color: C.text }}>
                  {user.achievements.films}
                </div>
                <div className="text-[10px]" style={{ color: C.textSub }}>
                  观看部数
                </div>
              </div>
              <div className="text-center">
                <div className="text-[18px] font-bold leading-[22px]" style={{ color: C.text }}>
                  {user.achievements.days}
                </div>
                <div className="text-[10px]" style={{ color: C.textSub }}>
                  观看天数
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 内容 tab:动态/评分/弹幕,三 tab 均空态(spec:内容未拍) */}
        <div className="flex items-end gap-5 px-4 pt-4">
          {user.profileTabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                {...bindTap({ kind: 'action', id: 'me.profile.tab.switch' }, {
                  params: { tab },
                  onTrigger: () => setUi(TAB_KEY, tab),
                })}
                className="bg-transparent border-none p-0"
              >
                <div
                  className="text-[16px]"
                  style={{ color: active ? C.text : C.textSub, fontWeight: active ? 700 : 400 }}
                >
                  {tab}
                </div>
                <div
                  className="h-[3px] w-5 mx-auto mt-1 rounded-full"
                  style={{ background: active ? C.primary : 'transparent' }}
                />
              </button>
            );
          })}
        </div>
        <EmptyState text={`还没有${activeTab}内容`} />
      </div>

      {/* 底部浮动:写动态 | 发视频 */}
      <div className="shrink-0 flex justify-center pb-3 pt-1" style={{ background: C.pageBg }}>
        <div
          className="flex items-center rounded-full px-1 h-10"
          style={{ background: C.pageBg, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}
        >
          <button
            {...wontfix('me.profile.publish.wontfix')}
            className="flex items-center gap-1 px-4 bg-transparent border-none text-[14px]"
            style={{ color: C.text }}
          >
            <IcFeedback size={16} />
            写动态
          </button>
          <span className="w-px h-4" style={{ background: C.divider }} />
          <button
            {...wontfix('me.profile.publish.wontfix')}
            className="flex items-center gap-1 px-4 bg-transparent border-none text-[14px]"
            style={{ color: C.text }}
          >
            <IcCamera size={16} />
            发视频
          </button>
        </div>
      </div>
    </div>
  );
}

// 个人中心页。节点 me.home(spec 23 条交互 / 3 个 uiState)。
// 视觉证据:736(顶部工具行 + 金色会员卡 + 宽带 banner + 设备行 + 四宫格 + 观看历史横滑)、
// 735(继续下滚:广告卡 + 功能列表长条)、frame:b06fd5@2(「19元开通SVIP」进收银台)。
// 版式要点(照 736):页面底是浅灰、内容分块成白色圆角卡,块间 8px 留白,几乎不用分割线。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { landscapeCornerNote } from '../components/cards';
import type { BindProps } from '../components/ui';
import {
  IcArrowRight, IcCast, IcCoin, IcComment, IcDownload, IcFollow, IcGift, IcMenu,
  IcMore, IcScan, IcSettings, IcStar, IcTogether, IcTv, IcUnlock, IcVolume,
} from '../res/icons';

/** 功能列表(735:我的金币/我的游戏/额度/我的资产/免费看漫剧/摸鱼免费玩/…)行首图标,按序取用。 */
const SERVICE_ICONS = [IcCoin, IcUnlock, IcGift, IcCast, IcTv, IcVolume];

export default function MeHomePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const user = useTencentvideoStore((s) => s.user);
  const membership = useTencentvideoStore((s) => s.membership);
  const vipCards = useTencentvideoStore((s) => s.vipCards);
  const profileGrid = useTencentvideoStore((s) => s.profileGrid);
  const profileServices = useTencentvideoStore((s) => s.profileServices);
  const watchHistory = useTencentvideoStore((s) => s.watchHistory);
  const contents = useTencentvideoStore((s) => s.contents);
  const messages = useTencentvideoStore((s) => s.messages);
  const loggedIn = useTencentvideoStore((s) => s.loggedIn);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const loginMock = useTencentvideoStore((s) => s.loginMock);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  // 观看历史横滑只放真剧集条目(聚合行「看过的短视频」只在 me.history 里出现,证据 734)
  const historyCards = useMemo(
    () =>
      watchHistory
        .filter((h) => h.contentId !== undefined)
        .map((h) => ({ entry: h, content: byId.get(h.contentId as string) }))
        .filter((x) => x.content !== undefined)
        .slice(0, 8),
    [watchHistory, byId],
  );

  // 顶部消息 icon 红点(736 右上角);未读来自入口未读 + 会话未读
  const unread = useMemo(
    () =>
      messages.entries.reduce((n, e) => n + e.unread, 0) +
      messages.conversations.reduce((n, c) => n + c.unread, 0),
    [messages],
  );

  const wontfix = (id: string): BindProps =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  return (
    <div
      className="relative flex flex-col h-full"
      style={{ background: C.chipGray }}
      data-status-bar-foreground="dark"
    >
      {/* 页面左缘:右滑拉出侧边抽屉(spec swipe-left → me.drawer.open.swipe)。
          做成贴左边的窄条触发区,不遮挡卡片内容。 */}
      <button
        {...bindTap('me.drawer.open.swipe')}
        className="absolute left-0 top-11 bottom-0 w-2 z-10 bg-transparent border-none p-0"
        aria-label="侧滑打开抽屉"
      />

      {/* 顶部工具行(736):左抽屉 icon,右 情侣亲子/扫一扫/消息(红点)/设置 */}
      <div className="shrink-0 flex items-center h-11 px-3" style={{ background: C.chipGray }}>
        <button
          {...bindTap('me.drawer.open.fromMe')}
          className="bg-transparent border-none p-0"
          style={{ color: C.text }}
          aria-label="抽屉"
        >
          <IcMenu size={22} />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <button
            {...wontfix('me.tools.couple.wontfix')}
            className="bg-transparent border-none p-0"
            style={{ color: C.text }}
            aria-label="情侣亲子"
          >
            <IcTogether size={21} />
          </button>
          <button
            {...wontfix('me.tools.scan.wontfix')}
            className="bg-transparent border-none p-0"
            style={{ color: C.text }}
            aria-label="扫一扫"
          >
            <IcScan size={21} />
          </button>
          <button
            {...bindTap('msg.center.open.fromMe')}
            className="relative bg-transparent border-none p-0"
            style={{ color: C.text }}
            aria-label="消息"
          >
            <IcComment size={21} />
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: C.redDot }}
              />
            )}
          </button>
          <button
            {...bindTap('settings.home.open.fromMe')}
            className="bg-transparent border-none p-0"
            style={{ color: C.text }}
            aria-label="设置"
          >
            <IcSettings size={21} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 会员卡(736 金底):头像 + 昵称 + 等级角标 + 切换 icon;右侧大等级字;下挂三入口 */}
        <div
          className="mx-3 mt-1 rounded-xl px-3 pt-3 pb-2.5"
          style={{ background: `linear-gradient(160deg, #F7E7BC, ${C.memberCardBg})` }}
        >
          {loggedIn ? (
            <>
              <div className="flex items-start">
                <button
                  {...bindTap('me.profile.open.fromMe')}
                  className="flex items-center gap-2 bg-transparent border-none p-0 text-left min-w-0"
                >
                  <TvImg
                    id={user.avatar}
                    alt={user.nickname}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span
                        className="text-[17px] font-semibold truncate"
                        style={{ color: C.memberLevel }}
                      >
                        {user.nickname}
                      </span>
                      <span
                        className="px-1 rounded text-[10px] leading-[15px] font-semibold shrink-0"
                        style={{ background: C.goldBtnText, color: C.vipBadgeBg }}
                      >
                        {user.vipLevelLabel}
                      </span>
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: C.goldBtnText }}>
                      积分:{user.points}　钻石:{user.diamonds}
                    </div>
                  </div>
                </button>
                <button
                  {...wontfix('me.account.switchicon.wontfix')}
                  className="bg-transparent border-none p-0 ml-1 mt-1"
                  style={{ color: C.goldBtnText }}
                  aria-label="切换账号"
                >
                  ⇄
                </button>
                <div className="flex-1" />
                <span
                  className="text-[34px] font-bold leading-[38px] tracking-tight"
                  style={{ color: C.memberLevel }}
                >
                  {membership.vPower.current}
                </span>
              </div>

              <div className="flex items-stretch mt-2.5">
                {vipCards.map((card, i) => {
                  // 视频VIP 一格是唯一有实拍去向的入口(收银台);其余两格 spec 锁定为暂未开放
                  const bind = card.id === 'video_vip'
                    ? bindTap('vip.cashier.open.fromMe')
                    : wontfix('me.card.sidevip.wontfix');
                  return (
                    <button
                      key={card.id}
                      {...bind}
                      className={`flex-1 min-w-0 bg-transparent border-none p-0 ${
                        i === 2 ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="text-[14px] font-semibold truncate" style={{ color: C.memberLevel }}>
                        {card.label}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: C.goldBtnText }}>
                        {/* 视频会员入口始终读全局到期日，VIP 续费与 SVIP 升级后都能立即看出差异。 */}
                        {card.id === 'video_vip' ? `${membership.expire}到期` : card.note}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* 未登录态(退出账号后):会员卡区换成一键登录(spec inferred,不做真流程) */
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 text-[15px] font-semibold" style={{ color: C.memberLevel }}>
                登录后同步观看记录与会员权益
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'auth.login.mock' }, { onTrigger: () => loginMock() })}
                className="shrink-0 px-4 h-8 rounded-full border-none text-[13px] font-semibold"
                style={{ background: C.goldBtnText, color: C.vipBadgeBg }}
              >
                一键登录
              </button>
            </div>
          )}
        </div>

        {/* 「优惠宽带送SVIP」运营行(736):保留一条 wontfix 打点,不再做成多处假 CTA */}
        <button
          {...wontfix('me.banner.broadband.wontfix')}
          className="flex items-center gap-1.5 w-full px-4 py-2 bg-transparent border-none text-left"
        >
          <IcCast size={14} style={{ color: C.text }} />
          <span className="text-[12px]" style={{ color: C.text }}>
            优惠宽带送SVIP
          </span>
        </button>

        {/* 登录设备行(736),去登录设备管理页 */}
        <div className="px-3">
          <button
            {...bindTap('device.manage.open.fromMe')}
            className="flex items-center gap-2 w-full px-3 h-12 rounded-xl border-none"
            style={{ background: C.pageBg }}
          >
            <IcTv size={18} style={{ color: C.text }} />
            <span className="flex-1 text-left text-[14px]" style={{ color: C.text }}>
              {user.deviceLoginTip}
            </span>
            <IcArrowRight size={16} style={{ color: C.textTertiary }} />
          </button>
        </div>

        {/* 四宫格:预约/加追、下载、收藏、我的周边(736) */}
        <div
          className="grid grid-cols-4 mx-3 mt-2 py-3 rounded-xl"
          style={{ background: C.pageBg }}
        >
          {profileGrid.map((label, i) => {
            const Icon = [IcFollow, IcDownload, IcStar, IcGift][i] ?? IcGift;
            const bind =
              i === 0
                ? bindTap('me.follows.open.fromMe')
                : i === 1
                  ? bindTap('download.mine.open.fromMe')
                  : i === 2
                    ? bindTap('me.favorites.open.fromMe')
                    : wontfix('me.grid.goods.wontfix');
            return (
              <button
                key={label}
                {...bind}
                className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0"
              >
                <Icon size={22} style={{ color: C.text }} />
                <span className="text-[12px]" style={{ color: C.text }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 观看历史楼层:标题行进历史页,横滑卡进详情续播(736) */}
        <div className="mx-3 mt-2 rounded-xl pt-3 pb-3" style={{ background: C.pageBg }}>
          <button
            {...bindTap('me.history.open.fromMe')}
            className="flex items-center gap-1.5 w-full px-3 pb-2 bg-transparent border-none"
          >
            <IcTv size={16} style={{ color: C.text }} />
            <span className="flex-1 text-left text-[15px] font-semibold" style={{ color: C.text }}>
              观看历史
            </span>
            <IcArrowRight size={16} style={{ color: C.textTertiary }} />
          </button>
          <div
            className="flex gap-2 overflow-x-auto px-3 scrollbar-none"
            data-scroll-container="historyRow"
            data-scroll-direction="horizontal"
          >
            {historyCards.map(({ entry, content }) => {
              const c = content!;
              return (
                <button
                  key={entry.id}
                  {...bindTap('detail.series.open.fromMeHistory', { params: { contentId: c.id } })}
                  className="shrink-0 w-[132px] bg-transparent border-none p-0 text-left"
                >
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <TvImg id={c.still ?? c.poster} alt={c.title} className="w-full h-full object-cover" />
                    <div
                      className="absolute bottom-0 inset-x-0 px-1.5 pb-0.5 pt-4 text-right text-white text-[10px] leading-none"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
                    >
                      {landscapeCornerNote(c)}
                    </div>
                    {entry.progressPct !== undefined && entry.progressPct > 0 && (
                      <div
                        className="absolute bottom-0 inset-x-0 h-[2px]"
                        style={{ background: C.progressRest }}
                      >
                        <div
                          className="h-full"
                          style={{ width: `${entry.progressPct}%`, background: C.primarySoft }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] truncate" style={{ color: C.text }}>
                    {c.title} {entry.episode}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 广告卡(735):整卡一个 wontfix,收掉「立即下载/⋯」重复假入口 */}
        <button
          {...wontfix('me.ad.wontfix')}
          className="mx-3 mt-2 rounded-xl p-2.5 w-[calc(100%-24px)] border-none text-left"
          style={{ background: C.pageBg }}
        >
          <div className="flex gap-2.5">
            <div className="relative shrink-0 w-[132px] aspect-video rounded-lg overflow-hidden">
              <TvImg id="banner_shop.png" alt="广告" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start gap-1">
                <span
                  className="shrink-0 mt-0.5 px-1 rounded text-[10px] leading-[14px]"
                  style={{ background: C.chipGray, color: C.textTertiary }}
                >
                  广告
                </span>
                <span className="flex-1 text-[13px] leading-[18px] line-clamp-2" style={{ color: C.text }}>
                  精彩游戏推荐
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center text-[12px]" style={{ color: C.primary }}>
                立即下载
                <div className="flex-1" />
                <IcMore size={16} style={{ color: C.textTertiary }} />
              </div>
            </div>
          </div>
        </button>

        {/* 功能列表(735):只留真入口「我的金币」+ 一条 wontfix 代表行,收掉一长串假入口 */}
        <div className="mx-3 mt-2 rounded-xl px-3" style={{ background: C.pageBg }}>
          {(() => {
            const real = profileServices[0];
            const misc = profileServices[profileServices.length - 1];
            const rows = [
              { label: real, Icon: SERVICE_ICONS[0], bind: bindTap('coin.center.open.fromMe') },
              ...(misc && misc !== real
                ? [{ label: misc, Icon: SERVICE_ICONS[1], bind: wontfix('me.list.misc.wontfix') }]
                : []),
            ];
            return rows.map(({ label, Icon, bind }) => (
              <button
                key={label}
                {...bind}
                className="flex items-center gap-2.5 w-full h-12 bg-transparent border-none p-0"
              >
                <Icon size={18} style={{ color: C.text }} />
                <span className="flex-1 text-left text-[14px]" style={{ color: C.text }}>
                  {label}
                </span>
                <IcArrowRight size={16} style={{ color: C.textTertiary }} />
              </button>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

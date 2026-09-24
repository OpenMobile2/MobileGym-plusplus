import React from 'react';
import * as TimeService from '../../../../os/TimeService';
import Img from '../../components/Img';
import { useYoukuGestures } from '../../hooks/useYoukuGestures';
import {
  CATALOG, SHORTS, DRAMAS, CREATORS, catalogById, creatorById, fmtCount, typeLabel,
} from '../../components/feedShared';
import type { CatalogItem, ShortDrama, ShortVideo } from '../../types';

/**
 * 会员+我的模块共享层(阶段⑤,pages/me/ 子组件合同)。
 * - 图标别名(Ic 前缀合同,模块内新建避免争抢共享 res/)
 * - 内容条目解析(在追/收藏/历史/下载按 id+ctype 反查片库)
 * - 空态插画 / 确认弹层 / 开关等纯展示件
 */
export {
  Download as IcDownload,
  Star as IcStar,
  CalendarCheck as IcCalendarCheck,
  CirclePlay as IcCirclePlay,
  Tv as IcTv,
  Bell as IcBell,
  ScanLine as IcScan,
  Settings as IcSettings,
  Ticket as IcTicket,
  FileText as IcOrder,
  MonitorSmartphone as IcTvHelper,
  Share2 as IcShare,
  Search as IcSearch,
  MessageCircle as IcDm,
  Heart as IcHeart,
  EllipsisVertical as IcMore,
  ChevronLeft as IcBack,
  ChevronRight as IcChevron,
  ChevronDown as IcChevronDown,
  Check as IcCheck,
  Plus as IcPlus,
  Headphones as IcService,
  Inbox as IcInbox,
  Coins as IcCoin,
} from 'lucide-react';

export { CATALOG, SHORTS, DRAMAS, CREATORS, catalogById, creatorById, fmtCount, typeLabel };

// ------------------------------------------------------------------ 内容解析
export interface ResolvedContent {
  id: string;
  ctype: string;
  title: string;
  /** 16:9 展示图 */
  cover: string;
  /** 2:3 海报 */
  poster: string;
  badge: string;
  episodeCount?: number;
  updatedTo?: number;
  durationSec?: number;
  typeText: string;
}

/** 按 id+ctype 反查片库/短视频/短剧,产出统一展示字段 */
export function resolveContent(id: string, ctype: string): ResolvedContent | null {
  if (ctype === 'short') {
    const s = SHORTS.find((x) => x.id === id) as ShortVideo | undefined;
    if (!s) return null;
    return {
      id, ctype, title: s.title, cover: s.cover, poster: s.cover, badge: '',
      durationSec: s.durationSec, typeText: '短视频',
    };
  }
  if (ctype === 'drama') {
    const d = DRAMAS.find((x) => x.id === id) as ShortDrama | undefined;
    if (!d) return null;
    return {
      id, ctype, title: d.title, cover: d.cover, poster: d.cover, badge: '短剧',
      episodeCount: d.episodeCount, updatedTo: d.updatedTo, typeText: '短剧',
    };
  }
  const c = catalogById(id) as CatalogItem | undefined;
  if (!c) return null;
  return {
    id, ctype, title: c.title, cover: c.still, poster: c.poster, badge: c.badge,
    episodeCount: c.episodeCount, updatedTo: c.updatedTo, durationSec: c.durationSec,
    typeText: typeLabel(String(c.type)),
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** 历史条目标题:剧集/短剧带 第NN集,综艺带 第NN期 */
export function historyTitle(r: ResolvedContent, episode?: number): string {
  if (episode == null) return r.title;
  const c = catalogById(r.id);
  const unit = c && String(c.type) === 'variety' ? '期' : '集';
  return `${r.title} 第${pad2(episode)}${unit}`;
}

/** 观看进度文案(s247:观看不足1% / 观看至N%) */
export function pctText(progressSec: number, durationSec: number): string {
  if (durationSec <= 0) return '观看不足1%';
  const pct = Math.floor((progressSec / durationSec) * 100);
  if (pct < 1) return '观看不足1%';
  return `观看至${Math.min(100, pct)}%`;
}

/** 秒 → mm:ss(短视频角标) */
export function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

export function fmtYmd(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fmtYmdHms(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${fmtYmd(ts)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** 会员到期日拆分(优先 expireTs;回落 sinceTs+30 天);页面用 t('meVipExpire', parts) */
export function vipExpireParts(
  sinceTs: number | null,
  expireTs?: number | null,
): { y: number; m: number; d: number } {
  const ts = expireTs ?? (sinceTs ?? TimeService.now()) + 30 * 86400000;
  const d = TimeService.fromTimestamp(ts);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/** @deprecated 优先 vipExpireParts + i18n;保留中文兜底 */
export function vipExpireText(sinceTs: number | null, expireTs?: number | null): string {
  const { y, m, d } = vipExpireParts(sinceTs, expireTs);
  return `${y}年${m}月${d}日到期`;
}

/** 相对时间(互动tab:8分钟前) */
export function relTime(ts: number): string {
  const diff = TimeService.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  const d = TimeService.fromTimestamp(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ------------------------------------------------------------------ 展示组件

/** 甄嬛空态插画(s198『臣妾做不到啊!』:宫灯+跪姿黄袍小人,内联 SVG 不裂图) */
export function EmptyZhenhuan({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center">
      {text && <div className="mb-16 text-[17px] text-white">{text}</div>}
      <svg width="150" height="150" viewBox="0 0 150 150" fill="none" aria-hidden>
        {/* 宫灯 */}
        <line x1="40" y1="18" x2="40" y2="118" stroke="#8A7A55" strokeWidth="3" />
        <rect x="30" y="26" width="20" height="26" rx="6" fill="#C9A24B" opacity="0.9" />
        <rect x="33" y="30" width="14" height="18" rx="4" fill="#F3D583" />
        <line x1="36" y1="52" x2="36" y2="60" stroke="#C9A24B" strokeWidth="2" />
        <line x1="44" y1="52" x2="44" y2="60" stroke="#C9A24B" strokeWidth="2" />
        {/* 跪姿黄袍小人 */}
        <path d="M78 108 q4 -26 18 -34 q16 -8 26 2 q8 10 4 32 q-2 8 -10 8 l-32 0 q-8 0 -6 -8z" fill="#E8B93B" />
        <path d="M84 110 l44 0 q6 0 6 5 t-6 5 l-44 0 q-6 0 -6 -5 t6 -5z" fill="#2E2618" />
        <circle cx="104" cy="66" r="12" fill="#F5DFC2" />
        <path d="M92 62 q10 -12 24 -2 l-2 -8 q-10 -8 -20 0z" fill="#3A2E1C" />
        <path d="M96 58 q8 -6 16 0 l0 -4 q-8 -6 -16 0z" fill="#C9A24B" />
        {/* 抬手拭泪 */}
        <path d="M96 76 q-6 6 -4 12" stroke="#E8B93B" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="93" cy="90" r="4" fill="#F5DFC2" />
        {/* 题字 */}
        <text x="128" y="30" fontSize="13" fill="#8A8A8A" fontFamily="serif" writingMode="tb">甄嬛传</text>
      </svg>
      <div className="mt-2 text-[12px] tracking-widest text-[#777777]">臣妾做不到啊!</div>
    </div>
  );
}

/** UFO 空态(s213 我的粉丝) */
export function EmptyUfo({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center pt-28">
      <svg width="170" height="150" viewBox="0 0 170 150" fill="none" aria-hidden>
        <ellipse cx="90" cy="70" rx="70" ry="58" fill="url(#ykUfoGlow)" opacity="0.5" />
        <defs>
          <radialGradient id="ykUfoGlow" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#AEC6E8" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="88" cy="72" rx="30" ry="9" fill="#22262E" />
        <ellipse cx="88" cy="66" rx="13" ry="9" fill="#39404C" />
        <ellipse cx="83" cy="70" rx="4" ry="2" fill="#556" opacity="0.8" />
      </svg>
      <div className="mt-4 text-[16px] text-[#CCCCCC]">{text}</div>
    </div>
  );
}

/** 收纳盒空态(s250 我的卡券:蓝红光晕+盒子线稿) */
export function EmptyBox({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center pt-24">
      <div
        className="flex h-44 w-44 items-center justify-center rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 38%, rgba(61,90,254,0.35), rgba(180,40,60,0.25) 55%, transparent 75%)' }}
      >
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.6" aria-hidden>
          <path d="M22 12h-6l-2 3h-4l-2-3H2" stroke="#111" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke="#111" fill="#0D0D0D" />
        </svg>
      </div>
      <div className="mt-3 text-[15px] text-[#999999]">{text}</div>
    </div>
  );
}

/** 通用确认弹层(取关/退出登录):URL 驱动,取消/遮罩=bindBack,确定由调用方传绑定 */
export function ConfirmSheet({
  text,
  confirmText = '确定',
  cancelText = '取消',
  confirmBind,
}: {
  text: string;
  confirmText?: string;
  cancelText?: string;
  confirmBind: object;
}) {
  const { bindBack } = useYoukuGestures();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-[300px] rounded-2xl bg-(--app-c-card-bg) px-5 pb-4 pt-6">
        <div className="text-center text-[16px] leading-6 text-(--app-c-text-primary)">{text}</div>
        <div className="mt-5 flex gap-3">
          <button
            {...bindBack()}
            className="h-10 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-chip-bg) text-[15px] text-(--app-c-text-primary)"
          >
            {cancelText}
          </button>
          <button
            {...confirmBind}
            className="h-10 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 轻开关(设置页,ON=优酷蓝) */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-[#0C7BFF]' : 'bg-[#4A4A4A]'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </span>
  );
}

/** 编辑态圆形勾选框(s243/s248) */
export function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border ${
        checked ? 'border-[#0C7BFF] bg-[#0C7BFF]' : 'border-[#666666] bg-transparent'
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.2" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}

/** 编辑态底部 全选/删除 栏(在追收藏/历史通用样式) */
export function EditBar({
  selectAllBind,
  deleteBind,
  hasSelection,
}: {
  selectAllBind: object;
  deleteBind: object;
  hasSelection: boolean;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center border-t border-(--app-c-border) bg-(--app-c-page-bg)" data-hide-on-keyboard>
      <button {...selectAllBind} className="flex-1 cursor-pointer border-none bg-transparent text-[17px] text-white">
        全选
      </button>
      <button
        {...deleteBind}
        className={`flex-1 cursor-pointer border-none bg-transparent text-[17px] ${hasSelection ? 'text-[#F5265C]' : 'text-[#666666]'}`}
      >
        删除
      </button>
    </div>
  );
}

/** 二级页通用顶栏返回按钮样式 */
export const BACK_BTN_CLS =
  'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-white';

/** 金渐变按钮样式(design-tokens vip.goldGradient,深棕字) */
export const GOLD_BTN_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg,#F8E3A8,#E9C177)',
  color: '#5C4318',
};

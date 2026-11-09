// apps/Tencentvideo/components/me.tsx —— 个人中心族(收藏/加追/观看历史/金币)复用件。
// 抽取原则(PAGE_IMPL_BRIEF §0):只放本族 2 页以上共用的东西。
// - MeListRow  : 725/728/732-734 三张真机图是同一种「横版缩略图 + 右侧三行文字」列表行
//                (收藏 / 加追 / 观看历史),连编辑态复选框位置都一样。
// - EditBar    : 三个列表页的编辑态底栏(全选 / 删除)完全同构。
// - SignCalendar / CoinTaskRow : 侧边抽屉(722/723)与金币中心(731)共用的签到日历与任务行。
// 绑定纪律:组件自身不含任何 transitionId/actionId,一律由页面以字面量绑定后经 bind 传入(硬规则2)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import type { TvSignDay } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';
import { IcCheck, IcTv } from '../res/icons';

/* ---------- 多选态编解码 ----------
 * store.ui 只存 string|number|boolean(types.ts 约定),多选集合用逗号串编码后放进 ui,
 * 避免为编辑态新增 store 字段(PAGE_IMPL_BRIEF §5:页面级开关态一律 setUi)。 */

export function parseSelection(value: string | number | boolean | undefined): string[] {
  return typeof value === 'string' && value !== '' ? value.split(',') : [];
}

export function serializeSelection(ids: readonly string[]): string {
  return ids.join(',');
}

export function toggleSelection(current: readonly string[], id: string): string[] {
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
}

/* ---------- 列表行(725 / 728 / 732-734) ---------- */

export interface MeListRowProps {
  /** 缩略图引用(内容 still/poster) */
  img?: string;
  title: string;
  /** 第二行:观看进度 /「第12集·观看至15%」 */
  subtitle?: React.ReactNode;
  /** 第三行:设备 + 日期(观看历史专用) */
  device?: string;
  date?: string;
  /** 缩略图右上角标(上新/VIP/独播/有更新) */
  badge?: string;
  /** 缩略图右下角文案(更新至15集 / 全40集) */
  cornerNote?: string;
  /** 缩略图右下角评分(电影行,证据 732) */
  rating?: number;
  /** 缩略图底缘青绿进度条(证据 734) */
  progressPct?: number;
  /** 整行绑定:默认态 = 进详情,编辑态 = 选中/取消(页面决定) */
  bind?: BindProps;
  /** 编辑态:显示左侧复选圈 */
  editing?: boolean;
  selected?: boolean;
}

export function MeListRow({
  img,
  title,
  subtitle,
  device,
  date,
  badge,
  cornerNote,
  rating,
  progressPct,
  bind,
  editing = false,
  selected = false,
}: MeListRowProps) {
  return (
    <div {...(bind ?? {})} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer">
      {editing && (
        <span
          className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center"
          style={{
            background: selected ? C.primary : 'transparent',
            border: selected ? 'none' : `1px solid ${C.divider}`,
            color: '#FFFFFF',
          }}
          role="checkbox"
          aria-checked={selected}
        >
          {selected && <IcCheck size={12} />}
        </span>
      )}
      <div className="relative shrink-0 w-[124px] aspect-video rounded-lg overflow-hidden">
        <TvImg id={img} alt={title} className="w-full h-full object-cover" />
        {badge && (
          <div className="absolute top-0 right-0">
            <Badge text={badge} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
          </div>
        )}
        {(cornerNote || (typeof rating === 'number' && Number.isFinite(rating))) && (
          <div
            className="absolute bottom-0 inset-x-0 px-1.5 pb-0.5 pt-4 text-right text-white leading-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
          >
            {typeof rating === 'number' && Number.isFinite(rating) ? (
              <span className="text-[13px] font-semibold">{rating.toFixed(1)}</span>
            ) : (
              <span className="text-[10px]">{cornerNote}</span>
            )}
          </div>
        )}
        {progressPct !== undefined && progressPct > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{ background: C.progressRest }}>
            <div
              className="h-full"
              style={{ width: `${Math.min(100, progressPct)}%`, background: C.primarySoft }}
            />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] mt-1 line-clamp-2" style={{ color: C.textSub }}>
            {subtitle}
          </div>
        )}
        {device && (
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: C.textTertiary }}>
            <IcTv size={11} />
            <span className="truncate">{device}</span>
            {date && <span>{date}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 编辑态底栏(收藏/加追/历史共用) ---------- */

export function EditBar({
  allSelected,
  selectedCount,
  selectAllBind,
  deleteBind,
}: {
  allSelected: boolean;
  selectedCount: number;
  selectAllBind?: BindProps;
  deleteBind?: BindProps;
}) {
  const s = useTencentvideoStrings();
  const enabled = selectedCount > 0;
  return (
    <div
      className="shrink-0 flex items-center h-12 px-4 border-t"
      style={{ background: C.pageBg, borderColor: C.divider }}
    >
      {/* 「全选」「删除」是结构性标签,spec 未给种子键,直接中文字面量(PAGE_IMPL_BRIEF §1) */}
      <button
        {...(selectAllBind ?? {})}
        className="bg-transparent border-none p-0 text-[14px]"
        style={{ color: C.text }}
      >
        {allSelected ? s.deselectAll : s.selectAll}
      </button>
      <div className="flex-1" />
      <button
        {...(deleteBind ?? {})}
        className="px-5 h-8 rounded-full border-none text-[14px]"
        style={{
          background: enabled ? C.unlockRed : C.chipGray,
          color: enabled ? '#FFFFFF' : C.textTertiary,
        }}
      >
        {s.delete}{enabled ? `(${selectedCount})` : ''}
      </button>
    </div>
  );
}

/* ---------- 签到日历(722/723 抽屉 + 731 金币中心) ---------- */

/** 首个未签到的天序号(= 今天);全签完返回 -1。与 state.coinSigninDaily 的推进口径一致。 */
export function nextSignIndex(days: readonly TvSignDay[]): number {
  return days.findIndex((d) => !d.signed);
}

export function SignCalendar({
  days,
  signBind,
  signed,
  /** 抽屉里只露 4 格(证据 723),金币中心 7 格铺满(证据 731) */
  compact = false,
}: {
  days: readonly TvSignDay[];
  signBind?: BindProps;
  signed: boolean;
  compact?: boolean;
}) {
  const s = useTencentvideoStrings();
  const todayIdx = nextSignIndex(days);
  return (
    <div
      className={`flex gap-1.5 ${compact ? 'overflow-x-auto scrollbar-none' : ''}`}
      data-scroll-container={compact ? 'signDays' : undefined}
      data-scroll-direction={compact ? 'horizontal' : undefined}
    >
      {days.map((d, i) => {
        const isToday = i === todayIdx;
        return (
          <div
            key={d.day}
            className={`flex flex-col items-center gap-1 py-1.5 rounded-lg ${
              compact ? 'shrink-0 w-[76px]' : 'flex-1'
            }`}
            style={{ background: compact ? C.chipGray : 'transparent' }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
              style={{
                background: `linear-gradient(180deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
                color: C.goldBtnText,
                opacity: d.signed ? 0.45 : 1,
              }}
            >
              ¥
            </span>
            <span className="text-[13px] font-semibold" style={{ color: C.text }}>
              {d.coins}
            </span>
            {isToday && !signed ? (
              <button
                {...(signBind ?? {})}
                className="px-2.5 h-[22px] rounded-full border-none text-[11px] leading-none"
                style={{ background: C.goldBtnTo, color: C.goldBtnText }}
              >
                {s.signIn}
              </button>
            ) : (
              <span className="text-[11px] leading-[22px]" style={{ color: C.textTertiary }}>
                {d.signed || (isToday && signed)
                  ? s.signed
                  : i === todayIdx + 1
                    ? s.tomorrow
                    : `${s.dayPrefix}${d.day}${s.daySuffix}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 金币任务行(722/723 抽屉 + 731 金币中心) ---------- */

export function CoinTaskRow({
  icon,
  title,
  sub,
  btn,
  bind,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  btn: string;
  bind?: BindProps;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: C.chipGray, color: C.goldBtnText }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold truncate" style={{ color: C.text }}>
          {title}
        </div>
        {sub && (
          <div className="text-[11px] truncate" style={{ color: C.textSub }}>
            {sub}
          </div>
        )}
      </div>
      <button
        {...(bind ?? {})}
        className="shrink-0 px-3 h-7 rounded-full border-none text-[12px]"
        style={{ background: C.rankChipBg, color: C.rankChipText }}
      >
        {btn}
      </button>
    </div>
  );
}

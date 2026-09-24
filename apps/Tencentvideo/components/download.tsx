// apps/Tencentvideo/components/download.tsx —— 下载族(download.select/mine/running/series)公共积木。
// 抽取原则同 detail.tsx / sheets.tsx:组件「无 action」,所有可点元素的绑定由页面以
// 字面量 actionId/transitionId 传入(IMPL_BRIEF 硬规则 8),这里只负责证据里的视觉形态。
// 视觉证据:730/729(我的下载空态 + 更多精彩内容 + 存储条)、856(正在下载行 + 速度行)、
// 857(任务卡 + 进度条)、7130a7@70(单剧卡 + 「N个视频」角标)、819(选集页底部存储条)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, type BindProps } from './ui';
import { IcCheck, IcDownload, IcPlay } from '../res/icons';

/* ---------- 体积换算 ---------- */

/**
 * 任务体积文案(state.sizeTextOf 产出形如「242MB」)→ 数字 MB。
 * 存储条要报「已使用N M」的合计值,所以得能把种子里的文案加起来。
 */
export function sizeMbOf(sizeText: string): number {
  const n = Number(sizeText.match(/[\d.]+/)?.[0] ?? 0);
  return sizeText.includes('G') ? n * 1024 : n;
}

/** 合计体积 → 真机口径的「626M」/「1.2G」文案(证据 856「已使用23M」/7130a7@70「907M」) */
export function fmtSizeMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)}G`;
  return `${Math.round(mb)}M`;
}

/**
 * 存储条的「已使用」口径 = 各任务按进度折算的落盘量(边下边播,下一点占一点)。
 * 证据:856 只有一条刚起步的任务就已经「已使用23M」;7130a7@70 两部下完(242M+626M)
 * 加上第三条在下的任务 = 「已使用907M」—— 都对得上按 % 折算,而不是只算已完成。
 */
export function usedMbOf(items: { sizeText: string; progressPct: number }[]): number {
  return items.reduce((sum, t) => sum + (sizeMbOf(t.sizeText) * t.progressPct) / 100, 0);
}

/* ---------- 底部存储条 ---------- */

/** 页面最底部居中的灰色小字(证据 730「剩余46.6G可用」/856「已使用23M,剩余46.3G可用」) */
export function StorageBar({ text }: { text: string }) {
  return (
    <div className="shrink-0 py-2 text-center text-[12px]" style={{ color: C.textSub }}>
      {text}
    </div>
  );
}

/* ---------- 缩略图 ---------- */

/**
 * 横版缩略图。三种形态都在证据里出现过:
 * - 有图 + 中央播放圆点(857 任务卡 / 7130a7@24 已下载集卡)
 * - 有图 + 左下「N个视频」角标(7130a7@70 单剧卡)
 * - 无图占位 + 下载 icon 灰底(856/7130a7@70 的「正在下载」行)
 */
export function DownloadThumb({
  imgId,
  alt,
  countNote,
  play = false,
  placeholder = false,
  className,
}: {
  imgId?: string;
  alt?: string;
  countNote?: string;
  play?: boolean;
  placeholder?: boolean;
  className?: string;
}) {
  if (placeholder) {
    return (
      <div
        className={`shrink-0 rounded-lg flex items-center justify-center ${className ?? 'w-[104px] h-[58px]'}`}
        style={{ background: C.chipGray, color: C.textSub }}
      >
        <IcDownload size={22} />
      </div>
    );
  }
  return (
    <div className={`relative shrink-0 rounded-lg overflow-hidden ${className ?? 'w-[104px] h-[58px]'}`}>
      <TvImg id={imgId} alt={alt} className="w-full h-full object-cover" />
      {play && (
        <span
          className="absolute inset-0 flex items-center justify-center text-white"
          aria-hidden
        >
          <IcPlay size={20} />
        </span>
      )}
      {countNote && (
        <span
          className="absolute left-1 bottom-1 rounded-[3px] px-1 text-[9px] leading-[14px] text-white"
          style={{ background: C.maskBadge }}
        >
          {countNote}
        </span>
      )}
    </div>
  );
}

/* ---------- 速度 / 进度 ---------- */

/** 「9.2MB/s + VIP加速1.1MB/s」(速度黑字、加速段青绿);暂停态整行换成「已暂停」灰字。 */
export function SpeedLine({
  speedText,
  accelText,
  pausedText,
}: {
  speedText: string;
  accelText: string;
  /** 传入即渲染暂停文案(证据 7130a7@36 全部暂停后) */
  pausedText?: string;
}) {
  if (pausedText) {
    return (
      <div className="text-[12px]" style={{ color: C.textSub }}>
        {pausedText}
      </div>
    );
  }
  return (
    <div className="text-[12px]" style={{ color: C.text }}>
      {speedText}
      <span style={{ color: C.primary }}> + {accelText}</span>
    </div>
  );
}

/** 任务进度细线(证据 856/857:青绿已下载段 + 浅灰底轨,贴在标题与速度行之间) */
export function TaskProgress({ pct }: { pct: number }) {
  return (
    <div className="h-[2px] rounded-full my-1.5 overflow-hidden" style={{ background: C.chipGray }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: C.primary }}
      />
    </div>
  );
}

/* ---------- 编辑模式 ---------- */

/** 卡片左侧勾选圈(证据 7130a7@90) */
export function SelectCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className="shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center"
      style={{
        background: checked ? C.primary : 'transparent',
        border: checked ? 'none' : `1.5px solid ${C.divider}`,
        color: '#FFFFFF',
      }}
      aria-hidden
    >
      {checked && <IcCheck size={13} />}
    </span>
  );
}

/**
 * 编辑模式底栏:左「全选/取消全选」右「删除(n)」(证据 7130a7@90/@64)。
 * 未勾选任何一项时删除置灰。
 */
export function EditBottomBar({
  selectAllLabel,
  deleteLabel,
  selectAllBind,
  deleteBind,
  deleteEnabled,
}: {
  selectAllLabel: string;
  deleteLabel: string;
  selectAllBind: BindProps;
  deleteBind: BindProps;
  deleteEnabled: boolean;
}) {
  return (
    <div
      className="shrink-0 flex items-center h-12 px-6"
      style={{ borderTop: `0.5px solid ${C.divider}`, background: C.pageBg }}
    >
      <button
        {...selectAllBind}
        className="flex-1 bg-transparent border-none text-[14px] text-left"
        style={{ color: C.text }}
      >
        {selectAllLabel}
      </button>
      <button
        {...deleteBind}
        className="flex-1 bg-transparent border-none text-[14px] text-right"
        style={{ color: deleteEnabled ? C.unlockRed : C.textSub }}
      >
        {deleteLabel}
      </button>
    </div>
  );
}

/* ---------- 「更多精彩内容」推荐楼层 ---------- */

/**
 * 下载族底部的 3 张封面推荐(证据 730/856/857:只有海报 + 角标,不带标题行,横向可滑)。
 * 点击进详情、长按负反馈,两个绑定都由页面传入。
 */
export function DownloadRecFloor({
  title,
  items,
  getBind,
  getLongPressBind,
}: {
  title: string;
  items: TvContent[];
  getBind: (content: TvContent) => BindProps;
  /** 长按负反馈(只有 download.mine 有这条交互,download.running 不传) */
  getLongPressBind?: (content: TvContent) => BindProps;
}) {
  if (items.length === 0) return null;
  return (
    <div className="pt-4">
      <div className="px-3 pb-2 text-[16px] font-semibold" style={{ color: C.text }}>
        {title}
      </div>
      <div
        className="flex gap-2 px-3 overflow-x-auto scrollbar-none"
        data-scroll-container="downloadRec"
        data-scroll-direction="horizontal"
      >
        {items.map((c) => (
          <div
            key={c.id}
            className="relative shrink-0 w-[136px] aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
            {...getBind(c)}
            {...(getLongPressBind ? getLongPressBind(c) : {})}
          >
            <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
            {c.badge && (
              <div className="absolute top-0 right-0">
                <Badge text={c.badge} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 下载选集页。节点 download.select(spec v1.0.0,14 条交互)。
// 视觉证据:819(竖屏默认:「下载音画设置」行 + 引导气泡 + 集数宫格 + 预约下载区 +
// VIP下载特权 banner + 底部「下载全部/查看下载列表」+ 存储条「剩余47.1G可用」)、
// 818(音画设置弹层:画质 6 档 + 音质「标准」)、7130a7@4(右上视频浮窗 + 综艺形态期数宫格)、
// 7130a7@29(横屏侧滑下载面板:清晰度720P› + 集数宫格 + 下载全部/查看下载列表 + 预计占用)。
//
// 宫格布局:真机是 flex-wrap 变宽格 —— 纯数字格 7 个一行,带文字的花絮/采访/彩蛋格按文字撑宽
// (818/7130a7@4 都能数出来),所以用 minWidth = (100% - 6*gap)/7 + 文字 padding 还原。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useDownloadTicker } from '../hooks/useDownloadTicker';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TopBar, Badge } from '../components/ui';
import { LandscapeStage } from '../components/LandscapeStage';
import { OptionTile, SheetSectionTitle } from '../components/sheets';
import { StorageBar, fmtSizeMb, sizeMbOf } from '../components/download';
import { stillOf } from '../components/detail';
import { TvImg } from '../components/Img';
import { IcArrowRight, IcClose, IcDownload, IcCheck, IcFullscreen } from '../res/icons';

/** 音画设置弹层的展开态(离散 UI 态一律走 store.ui,不进 queryParams) */
const UI_AVSHEET = 'download.select.avsheet';
/** 首次进页的「这里可以调整下载清晰度」引导气泡(证据 819),点过音画设置行即消失 */
const UI_GUIDE_DONE = 'download.select.guideDismissed';
/** 右上视频浮窗是否已关(证据 7130a7@4 有浮窗、819 已关) */
const UI_FLOATWIN_CLOSED = 'download.select.floatwinClosed';
/** 横屏侧滑下载面板(证据 7130a7@29) */
const UI_LANDSCAPE = 'download.select.landscapePanel';

/**
 * 衍生内容格(花絮/采访/彩蛋/片花)。defaults.json 的 contents 没有「衍生内容」种子字段
 * (已列入交付报告的种子诉求),这里按真机两组证据的形态确定性构造:
 * 剧集 = 独家花絮1 + 独家采访4 + 彩蛋7(818《这一秒过火》);
 * 综艺 = 采访4 + 彩蛋14 + 片花1(7130a7@4《奔跑吧 第10季》)。
 * VIP 角标:花絮/采访为会员专享,彩蛋/片花免费(818 的多数格如此)。
 */
const EXTRA_GROUPS_SERIES = [
  { prefix: '独家花絮', count: 1, vip: true },
  { prefix: '独家采访', count: 4, vip: true },
  { prefix: '彩蛋', count: 7, vip: false },
];
const EXTRA_GROUPS_VARIETY = [
  { prefix: '采访', count: 4, vip: true },
  { prefix: '彩蛋', count: 14, vip: false },
  { prefix: '片花', count: 1, vip: false },
];
/** 衍生内容格的虚拟集号起点:与正片集号错开,任务 id `${contentId}#${episode}` 才不会撞 */
const EXTRA_EPISODE_BASE = 1000;

interface GridCell {
  key: string;
  label: string;
  /** 传给 store.addDownload 的集号 */
  episode: number;
  vip: boolean;
  /** 预告格(预约下载,证据 819 的 16/17) */
  preview?: boolean;
}

export default function DownloadSelectPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  useDownloadTicker();

  const content = useTvContent('tv_');
  const downloads = useTencentvideoStore((st) => st.downloads);
  const settings = useTencentvideoStore((st) => st.settings);
  const playback = useTencentvideoStore((st) => st.playback);
  const qualities = useTencentvideoStore((st) => st.player.qualities);
  const audioQualities = useTencentvideoStore((st) => st.player.audioQualities);
  const downloadReserved = useTencentvideoStore((st) => st.downloadReserved);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const addDownload = useTencentvideoStore((st) => st.addDownload);
  const addAllDownloads = useTencentvideoStore((st) => st.addAllDownloads);
  const reserveDownloadEpisode = useTencentvideoStore((st) => st.reserveDownloadEpisode);
  const setDownloadQuality = useTencentvideoStore((st) => st.setDownloadQuality);

  const contentId = content?.id ?? '';
  const isVariety = content?.category === '综艺';
  const avSheetOpen = ui[UI_AVSHEET] === true;
  const guideOpen = ui[UI_GUIDE_DONE] !== true;
  const floatWinOpen = ui[UI_FLOATWIN_CLOSED] !== true;
  const landscapeOpen = ui[UI_LANDSCAPE] === true;
  const qualityLabel = settings.download.quality;

  /** 正片格 + 衍生内容格(证据 818/7130a7@4 的排列顺序:先集数、后花絮/采访/彩蛋) */
  const cells = useMemo<GridCell[]>(() => {
    if (!content) return [];
    const upTo = Math.max(1, content.updatedTo ?? content.episodes ?? 1);
    const list: GridCell[] = Array.from({ length: upTo }, (_, i) => ({
      key: `ep${i + 1}`,
      label: String(i + 1),
      episode: i + 1,
      vip: content.vipFrom !== undefined && i + 1 >= content.vipFrom,
    }));
    let offset = 0;
    for (const g of isVariety ? EXTRA_GROUPS_VARIETY : EXTRA_GROUPS_SERIES) {
      for (let i = 0; i < g.count; i++) {
        list.push({
          key: `${g.prefix}${i + 1}`,
          label: g.count === 1 ? g.prefix : `${g.prefix}${i + 1}`,
          episode: EXTRA_EPISODE_BASE + offset,
          vip: g.vip,
        });
        offset += 1;
      }
    }
    // 预告格:更新至第 N 集后的两集(证据 819 的 16/17,配合上方「预约下载」区)
    list.push(
      { key: 'preview1', label: `${upTo + 1}`, episode: upTo + 1, vip: true, preview: true },
      { key: 'preview2', label: `${upTo + 2}`, episode: upTo + 2, vip: true, preview: true },
    );
    return list;
  }, [content, isVariety]);

  const previewCells = useMemo(() => cells.filter((c) => c.preview), [cells]);
  const mainCells = useMemo(() => cells.filter((c) => !c.preview), [cells]);

  /** 本剧已在下载队列/已完成的集号(格角标要变下载中箭头 / 已完成对勾) */
  const taskByEpisode = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of downloads.items) {
      if (t.contentId === contentId) m.set(t.episode, t.status);
    }
    return m;
  }, [downloads.items, contentId]);

  /** 横屏面板底部的「预计占用」= 本剧已入队任务体积合计(证据 7130a7@29 的 135M 同位) */
  const plannedSizeText = useMemo(() => {
    const mb = downloads.items
      .filter((t) => t.contentId === contentId)
      .reduce((sum, t) => sum + sizeMbOf(t.sizeText), 0);
    return fmtSizeMb(mb);
  }, [downloads.items, contentId]);

  const currentEpisode = playback.contentId === contentId ? playback.episodeIndex : 0;

  if (!content) return null;

  /* ---------- 绑定 ---------- */

  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const avSheetToggle = bindTap({ kind: 'action', id: 'download.select.avsheet.open' }, {
    onTrigger: () => {
      setUi(UI_GUIDE_DONE, true);
      setUi(UI_AVSHEET, !avSheetOpen);
    },
  });

  /** 任务卡上展示的名字:正片格 →「第N集/期」,衍生格 → 原文案(证据 857 任务卡标题) */
  const cellTaskLabel = (cell: GridCell): string =>
    /^\d+$/.test(cell.label) ? `第${cell.label}${isVariety ? '期' : '集'}` : cell.label;

  const cellBind = (cell: GridCell) => {
    if (cell.preview) {
      return bindTap({ kind: 'action', id: 'download.select.episode.reserve' }, {
        onTrigger: () => reserveDownloadEpisode(contentId, cell.episode),
      });
    }
    return bindTap({ kind: 'action', id: 'download.select.episode.add' }, {
      onTrigger: () => addDownload(contentId, cell.episode, cellTaskLabel(cell)),
    });
  };

  const addAllBind = bindTap({ kind: 'action', id: 'download.select.all.add' }, {
    onTrigger: () => addAllDownloads(contentId, mainCells.map((c) => c.episode)),
  });

  const landscapeToggle = bindTap({ kind: 'action', id: 'download.select.landscape.panel' }, {
    onTrigger: () => setUi(UI_LANDSCAPE, !landscapeOpen),
  });

  /* ---------- 集数宫格 ---------- */

  const cellNode = (cell: GridCell, dark: boolean) => {
    const status = taskByEpisode.get(cell.episode);
    const reserved = downloadReserved.includes(`${contentId}#${cell.episode}`);
    const active = !cell.preview && cell.episode === currentEpisode;
    return (
      <button
        key={cell.key}
        {...cellBind(cell)}
        className="relative rounded-md border-none flex items-center justify-center text-[14px] px-2 h-[44px]"
        style={{
          minWidth: 'calc((100% - 48px) / 7)',
          background: active
            ? dark ? 'rgba(6,191,184,0.20)' : C.primaryBg
            : dark ? 'rgba(255,255,255,0.12)' : C.chipGray,
          color: active ? C.primary : dark ? C.darkText : C.text,
        }}
      >
        {cell.label}
        {cell.preview ? (
          <span className="absolute top-0 left-0">
            <Badge text="预告" variant="orange" className="rounded-none rounded-br-[4px] rounded-tl-[6px]" />
          </span>
        ) : cell.vip ? (
          <span className="absolute top-0 right-0">
            <Badge text="VIP" variant="vip" className="rounded-none rounded-bl-[4px] rounded-tr-[6px]" />
          </span>
        ) : null}
        {/* 已入队 = 下载中箭头,已完成 = 对勾(spec:格角标变下载中箭头) */}
        {status && (
          <span
            className="absolute right-0.5 bottom-0.5"
            style={{ color: status === 'done' ? C.primary : C.textSub }}
            aria-hidden
          >
            {status === 'done' ? <IcCheck size={12} /> : <IcDownload size={12} />}
          </span>
        )}
        {cell.preview && reserved && (
          <span className="absolute right-0.5 bottom-0.5" style={{ color: C.primary }} aria-hidden>
            <IcCheck size={12} />
          </span>
        )}
      </button>
    );
  };

  const grid = (list: GridCell[], dark: boolean) => (
    <div className="flex flex-wrap gap-2">{list.map((cell) => cellNode(cell, dark))}</div>
  );

  /* ---------- 音画设置弹层(证据 818) ---------- */

  // 画质档:去掉「智能清晰度」(818 的下载弹层里没有这一档)
  const downloadQualities = qualities.filter((q) => q.id !== 'auto');
  const svipTile = downloadQualities[0];
  const midTiles = downloadQualities.slice(1, 4);
  const lowTiles = downloadQualities.slice(4);

  const qualityTile = (q: (typeof downloadQualities)[number], className: string) => {
    const selected = q.label === qualityLabel;
    const bind = q.tier === 'svip'
      // SVIP 档要走权益墙(spec:transitionId vip.wall.open.fromDownloadQuality)
      ? bindTap('vip.wall.open.fromDownloadQuality')
      : bindTap({ kind: 'action', id: 'download.select.quality.select' }, {
        onTrigger: () => {
          setDownloadQuality(q.label);
          setUi(UI_AVSHEET, false);
        },
      });
    return (
      <OptionTile
        key={q.id}
        label={q.label}
        sub={q.desc}
        tierBadge={q.tier === 'free' ? undefined : q.tier.toUpperCase()}
        selected={selected}
        locked={q.tier === 'svip'}
        variant="light"
        bind={bind}
        className={className}
      />
    );
  };

  const avSheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* 弹层是页内 UI 态(本路由没有 sheet 参数),关闭复用同一条 avsheet.open 开关 action */}
      <div className="absolute inset-0 bg-black/45" {...avSheetToggle} />
      <div className="relative rounded-t-2xl max-h-[70%] flex flex-col" style={{ background: C.pageBg }}>
        <div className="flex items-center justify-center relative px-4 pt-4 pb-2 shrink-0">
          <div className="font-semibold text-[16px]" style={{ color: C.text }}>
            下载音画设置
          </div>
          <button
            {...avSheetToggle}
            className="absolute right-3 top-3 p-1 bg-transparent border-none"
            style={{ color: C.text }}
            aria-label="关闭"
          >
            <IcClose size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <SheetSectionTitle
            title={<span className="text-[15px] font-semibold" style={{ color: C.text }}>{s.sheetQualityTabs}</span>}
            right={
              <button
                {...wontfix('download.select.avCustom.wontfix')}
                className="flex items-center bg-transparent border-none p-0 text-[12px]"
                style={{ color: C.textSub }}
              >
                自定义<IcArrowRight size={13} />
              </button>
            }
          />
          {svipTile && qualityTile(svipTile, 'w-full h-[56px]')}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {midTiles.map((q) => qualityTile(q, 'h-[56px]'))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {lowTiles.map((q) => qualityTile(q, 'h-[56px]'))}
          </div>
          <SheetSectionTitle
            title={<span className="text-[15px] font-semibold" style={{ color: C.text }}>{s.sheetAudioTab}</span>}
          />
          <OptionTile
            label={audioQualities[audioQualities.length - 1]?.label ?? ''}
            selected
            variant="light"
            bind={wontfix('download.select.avCustom.wontfix')}
            className="w-full h-[48px]"
          />
        </div>
      </div>
    </div>
  );

  /* ---------- 横屏侧滑下载面板(证据 7130a7@29) ---------- */

  const landscapePanel = (
    <div className="absolute inset-0 z-50">
      <LandscapeStage>
        <div className="absolute inset-0 flex">
          <div className="flex-1" {...landscapeToggle} />
          <div className="w-[64%] h-full flex flex-col px-3 py-2" style={{ background: 'rgba(16,16,16,0.92)' }}>
            <div className="flex items-center justify-end shrink-0">
              <button
                {...landscapeToggle}
                className="flex items-center gap-1 bg-transparent border-none p-0 text-[12px] text-white/80"
              >
                清晰度 {qualityLabel}<IcArrowRight size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2" data-scroll-container="landscapeEpisodes" data-scroll-direction="vertical">
              {grid(mainCells, true)}
            </div>
            <div className="shrink-0 flex items-center gap-3 pt-1">
              <button
                {...landscapeToggle}
                className="rounded-full px-4 py-1.5 border-none text-[12px] text-white"
                style={{ background: 'rgba(255,255,255,0.16)' }}
              >
                下载全部
              </button>
              <button
                {...bindTap('download.mine.open.fromSelect')}
                className="rounded-full px-4 py-1.5 border-none text-[12px] text-white"
                style={{ background: 'rgba(255,255,255,0.16)' }}
              >
                查看下载列表
              </button>
              <span className="text-[11px] text-white/55">预计占用{plannedSizeText}</span>
            </div>
          </div>
        </div>
      </LandscapeStage>
    </div>
  );

  /* ---------- 页面 ---------- */

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar title={s.downloadSelectHint} />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="relative px-3 pt-1">
          <button
            {...avSheetToggle}
            className="w-full flex items-center rounded-lg border-none h-12 px-3"
            style={{ background: C.chipGray }}
          >
            <span className="flex-1 text-left text-[15px]" style={{ color: C.text }}>
              下载音画设置
            </span>
            <span className="flex items-center text-[15px]" style={{ color: C.text }}>
              {qualityLabel}<IcArrowRight size={16} />
            </span>
          </button>
          {guideOpen && (
            <div
              className="absolute right-3 top-[52px] z-10 rounded-lg px-3 py-2 text-[13px] text-white pointer-events-none"
              style={{ background: C.toastBg }}
            >
              这里可以调整下载清晰度
            </div>
          )}
        </div>

        <div className="px-3 pt-3">{grid(mainCells, false)}</div>

        {/* 预约下载区(证据 819:VIP 会员尊享 + 更新节奏说明 + 预告格) */}
        <div className="px-3 pt-5">
          <div className="flex items-center gap-1">
            <span className="text-[16px] font-bold" style={{ color: C.text }}>
              VIP会员尊享 预约下载
            </span>
            <button
              {...wontfix('download.select.reserveInfo.wontfix')}
              className="bg-transparent border-none p-0 w-4 h-4 rounded-full text-[10px] leading-4 text-center"
              style={{ background: C.chipGray, color: C.textSub }}
              aria-label="预约下载说明"
            >
              i
            </button>
          </div>
          <div className="pt-1.5 pb-2 text-[13px]" style={{ color: C.textSub }}>
            会员每日18点更新2集, 更新后Wi-Fi下自动下载
          </div>
          {grid(previewCells, false)}
        </div>

        {/* VIP 下载特权 banner(证据 819) */}
        <div className="px-3 pt-5">
          <div className="text-[16px] font-bold pb-2" style={{ color: C.text }}>
            <span>VIP会员尊享</span>下载特权
          </div>
          <button
            {...wontfix('download.select.vipBanner.wontfix')}
            className="relative w-full rounded-xl border-none overflow-hidden text-left px-4 py-5"
            style={{ background: `linear-gradient(120deg, ${C.goldBtnFrom}, ${C.premiereYellow})` }}
          >
            <div className="text-[16px] font-bold" style={{ color: C.goldBtnText }}>
              极速缓存 · 边下边播 · 并行下载
            </div>
            <div className="text-[12px] mt-1" style={{ color: C.rankChipText }}>
              点击了解特权详情
            </div>
          </button>
        </div>

        <div className="h-4" />
      </div>

      {/* 底部操作行 + 存储条(证据 819) */}
      <div className="shrink-0 flex items-center gap-3 px-4 pt-2">
        <button
          {...addAllBind}
          className="flex-1 rounded-full border-none h-11 text-[15px]"
          style={{ background: C.chipGray, color: C.text }}
        >
          下载全部
        </button>
        <button
          {...bindTap('download.mine.open.fromSelect')}
          className="flex-1 rounded-full border-none h-11 text-[15px]"
          style={{ background: C.chipGray, color: C.text }}
        >
          查看下载列表
        </button>
      </div>
      <StorageBar text={`剩余${downloads.remaining}可用`} />

      {/* 右上视频浮窗(证据 7130a7@4:进本页正片缩为右上浮窗,带 × 与全屏 icon) */}
      {floatWinOpen && (
        <div className="absolute right-2 top-12 z-30 w-[150px] rounded-lg overflow-hidden">
          <TvImg id={stillOf(content)} alt={content.title} className="w-full aspect-video object-cover" />
          <button
            {...bindTap({ kind: 'action', id: 'download.select.floatwin.close' }, {
              onTrigger: () => setUi(UI_FLOATWIN_CLOSED, true),
            })}
            className="absolute left-1 top-1 w-5 h-5 rounded-full border-none flex items-center justify-center text-white"
            style={{ background: C.maskBadge }}
            aria-label="关闭浮窗"
          >
            <IcClose size={12} />
          </button>
          <button
            {...landscapeToggle}
            className="absolute right-1 top-1 w-5 h-5 rounded-full border-none flex items-center justify-center text-white"
            style={{ background: C.maskBadge }}
            aria-label="横屏下载面板"
          >
            <IcFullscreen size={12} />
          </button>
          <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: C.primary }} />
        </div>
      )}

      {avSheetOpen && avSheet}
      {landscapeOpen && landscapePanel}
    </div>
  );
}

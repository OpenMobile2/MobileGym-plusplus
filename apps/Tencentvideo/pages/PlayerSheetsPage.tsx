// 节点 player.sheets —— 播放器弹层组。一个路由 7 种面板,由 ?sheet= 区分:
//   more(证据 820 竖屏 10 项)/ speed(822 竖屏、855 横屏)/ quality(854 画质·音质·滤镜)
//   / danmaku(849-851 弹幕工具箱)/ episodes(853 综艺、ba6ce3@30 剧集)/ share(852 分享海报)
// 外壳形态看朝向:横屏 = 右侧抽屉(选集是底部通栏),竖屏 = 底部半屏。
// 朝向由播放页在挂载时写进 ui(hooks/usePlayerOrientation),面板只读。
import React, { useEffect, useMemo, useRef } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { useTvQuery } from '../hooks/useTvParams';
import { usePlayerOrientation } from '../hooks/usePlayerOrientation';
import { TV_COLORS as C } from '../constants';
import { LandscapeStage } from '../components/LandscapeStage';
import { Sheet, LandscapeDrawer, LandscapeBottomPanel } from '../components/Sheet';
import { imgSrc, TvImg } from '../components/Img';
import { saveImageToAlbumWithSystem, shareEpisodeToWechat, shareWithSystem } from '../capabilities';
import {
  EpisodeCardRow,
  EpisodeNumberChips,
  PillChipRow,
  SeasonRow,
  stillOf,
  type EpisodeCardItem,
} from '../components/detail';
import {
  OptionTile,
  RowValue,
  ShareChannelRow,
  SheetSectionTitle,
  SheetSegmented,
  SheetSettingRow,
  SheetSwitch,
  VerticalFillSlider,
} from '../components/sheets';
import type { TvDanmakuMode, TvDanmakuSlider } from '../types';
import {
  IcArrowRight, IcAudioMode, IcBackground, IcBan, IcComment, IcDownload, IcEgg,
  IcFeedback, IcLoop, IcMagic, IcNavBack, IcPalette, IcPip, IcPoster, IcReport,
  IcRoleAvatar, IcShirt, IcSparkle, IcSpeed, IcStar, IcTimer, IcTopDanmaku,
} from '../res/icons';
import {
  currentSeasonOf,
  seasonEpisodeStateOf,
  seasonNumbersOf,
  seasonSubTabsOf,
} from '../utils/seasonEpisodes';

/** 面板内的二级视图(更多 → 倍速 / 定时枚举 / 长按倍速枚举,证据 822) */
const UI_VIEW = 'player.sheets.view';
const UI_SPEED_CUSTOM = 'player.sheets.speedCustomOpen';
const UI_BLOCKWORD_OPEN = 'player.sheets.blockwordOpen';
const UI_BLOCKWORD_DRAFT = 'player.sheets.blockwordDraft';
const UI_SEASON = 'playback.season';
const UI_SUBTAB = 'playback.subTab';
const UI_SEGMENT = 'player.sheets.segment';
const UI_TITLEMODE = 'player.sheets.episodeTitleMode';
const UI_POSTER = 'player.sheets.posterIndex';

/** 选集分段长度(证据 853:1-20 / 21-36) */
const SEGMENT_SIZE = 20;
/** 横屏选集面板一窗露出的期卡数(证据 853:6 张) */
const EPISODE_CARD_WINDOW = 6;

/** 更多面板 10 项的图标(装饰,不入种子) */
const MORE_ICONS: Record<string, React.ReactNode> = {
  画中画: <IcPip size={22} />,
  定时关闭: <IcTimer size={22} />,
  下载: <IcDownload size={22} />,
  倍速: <IcSpeed size={22} />,
  音频播放: <IcAudioMode size={22} />,
  设为禁看: <IcBan size={22} />,
  后台播放: <IcBackground size={22} />,
  循环播放: <IcLoop size={22} />,
  侵权举报: <IcReport size={22} />,
  问题反馈: <IcFeedback size={22} />,
};

const DANMAKU_SWITCH_ICONS: Record<string, React.ReactNode> = {
  palette: <IcPalette size={16} />,
  shirt: <IcShirt size={16} />,
  avatar: <IcRoleAvatar size={16} />,
  top: <IcTopDanmaku size={16} />,
  sparkles: <IcSparkle size={16} />,
  egg: <IcEgg size={16} />,
};

const SHARE_ICONS: Record<string, React.ReactNode> = {
  保存本地: <IcDownload size={18} />,
  微信: <IcComment size={18} />,
  朋友圈: <IcPoster size={18} />,
  QQ: <IcComment size={18} />,
  QQ空间: <IcStar size={18} />,
  微博: <IcMagic size={18} />,
};

export default function PlayerSheetsPage() {
  const { bindTap, back } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const orientation = usePlayerOrientation();
  const sheetParam = useTvQuery('sheet') ?? 'more';

  const contents = useTencentvideoStore((st) => st.contents);
  const player = useTencentvideoStore((st) => st.player);
  const playback = useTencentvideoStore((st) => st.playback);
  const detail = useTencentvideoStore((st) => st.detail);
  const danmakuBlockWords = useTencentvideoStore((st) => st.danmakuBlockWords);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const setSpeed = useTencentvideoStore((st) => st.setSpeed);
  const setLongPressSpeed = useTencentvideoStore((st) => st.setLongPressSpeed);
  const toggleLongPressLockSpeed = useTencentvideoStore((st) => st.toggleLongPressLockSpeed);
  const toggleLeftLongPressRewind = useTencentvideoStore((st) => st.toggleLeftLongPressRewind);
  const selectQuality = useTencentvideoStore((st) => st.selectQuality);
  const selectAudioQuality = useTencentvideoStore((st) => st.selectAudioQuality);
  const selectPlayerFilter = useTencentvideoStore((st) => st.selectPlayerFilter);
  const setDanmakuMode = useTencentvideoStore((st) => st.setDanmakuMode);
  const setDanmakuSetting = useTencentvideoStore((st) => st.setDanmakuSetting);
  const addDanmakuBlockword = useTencentvideoStore((st) => st.addDanmakuBlockword);
  const removeDanmakuBlockword = useTencentvideoStore((st) => st.removeDanmakuBlockword);
  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const audioModeEnter = useTencentvideoStore((st) => st.audioModeEnter);
  const audioModeExit = useTencentvideoStore((st) => st.audioModeExit);
  const pipOpen = useTencentvideoStore((st) => st.pipOpen);
  const setSleepTimer = useTencentvideoStore((st) => st.setSleepTimer);

  // 每次从播放页重新打开「…」都先回到完整更多菜单，不复用上次的「定时关闭」二级态。
  useEffect(() => {
    setUi(UI_VIEW, '');
  }, [setUi, sheetParam]);

  const content = contents.find((c) => c.id === playback.contentId) ?? contents[0];
  const dm = player.danmaku;
  const landscape = orientation === 'landscape';
  const view = String(ui[UI_VIEW] ?? '');
  // 「更多·倍速」在同一路由内换面板(证据 822),所以视图优先于 URL 参数
  const sheet = view || sheetParam;

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });
  /** action + 关面板(选清晰度/集数后面板收起,证据 854/853) */
  const actionThenClose = (id: string, run: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { run(); back(); } });
  /** 切二级视图(不离开路由) */
  const toView = (id: string, next: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => setUi(UI_VIEW, next) });

  /* ============================ 更多面板(证据 820) ============================ */

  const moreBindOf = (label: string) => {
    switch (label) {
      case '画中画':
        return actionThenClose('player.sheets.pip.open', pipOpen);
      case '定时关闭':
        return toView('player.sheets.timer.set', 'timer');
      case '下载':
        return bindTap('download.select.open.fromMore', { params: { contentId: content?.id ?? '' } });
      case '倍速':
        return toView('player.sheets.more.toSpeed', 'speed');
      case '音频播放':
        return playback.audioMode
          ? actionThenClose('player.sheets.audioMode.exit', audioModeExit)
          : actionThenClose('player.sheets.audioMode.enter', audioModeEnter);
      default:
        return wontfix('player.sheets.moreExtra.wontfix');
    }
  };

  const morePanel = (
    <div className={`grid grid-cols-5 gap-y-5 ${landscape ? 'pt-2' : 'pt-3 pb-4'}`}>
      {player.moreMenu.map((label) => (
        <button
          key={label}
          {...moreBindOf(label)}
          className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0"
        >
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: landscape ? 'rgba(255,255,255,0.12)' : C.chipGray,
              color: landscape ? '#FFFFFF' : C.text,
            }}
          >
            {MORE_ICONS[label]}
          </span>
          <span
            className="text-[11px] whitespace-nowrap"
            style={{ color: landscape ? 'rgba(255,255,255,0.8)' : C.textSub }}
          >
            {label === '音频播放' && playback.audioMode ? `退出${label}` : label}
          </span>
        </button>
      ))}
    </div>
  );

  /* ---------- 定时关闭枚举(证据 820 入口,枚举按通用定时推断) ---------- */

  const timerPanel = (
    <div className={landscape ? 'pt-1' : 'pt-2 pb-4'}>
      {player.timerOptions.map((label) => {
        const on = (playback.sleepTimer ?? '不开启') === label;
        return landscape ? (
          <SheetSettingRow
            key={label}
            label={label}
            right={on ? <span className="text-[12px]" style={{ color: C.primary }}>✓</span> : undefined}
            bind={actionThenClose('player.sheets.timer.set', () => setSleepTimer(label))}
          />
        ) : (
          <button
            key={label}
            {...actionThenClose('player.sheets.timer.set', () => setSleepTimer(label))}
            className="w-full flex items-center justify-between rounded-xl border-none px-4 py-3 mb-2 text-[14px]"
            style={{ background: on ? C.primaryBg : C.chipGray, color: on ? C.primary : C.text }}
          >
            {label}
            {on && <span>✓</span>}
          </button>
        );
      })}
    </div>
  );

  /* ============================ 倍速面板(证据 822/855) ============================ */

  const speedCustomOpen = ui[UI_SPEED_CUSTOM] === true;

  const speedLabelOf = (sp: number) => `${sp % 1 === 0 ? sp.toFixed(1) : sp}X`;

  const speedTiles = (
    <div className="grid grid-cols-3 gap-2">
      {player.speeds.map((sp, i) => {
        // 证据 855:最后一格「0.5X」下沿挂一个独立的「自定义 ›」—— 拆成同格里的兄弟按钮,
        // 免得 button 套 button(选倍速 / 展自定义滑杆是两个 action)。
        const withCustom = landscape && i === player.speeds.length - 1;
        const tile = (
          <OptionTile
            label={speedLabelOf(sp)}
            selected={playback.speed === sp}
            variant={landscape ? 'dark' : 'light'}
            className={withCustom ? 'h-[58px] w-full pb-3' : 'h-[58px]'}
            bind={actionThenClose('player.sheets.speed.select', () => setSpeed(sp))}
          />
        );
        return withCustom ? (
          <div key={sp} className="relative flex">
            {tile}
            <button
              {...bindTap({ kind: 'action', id: 'player.sheets.speed.custom' }, {
                onTrigger: () => setUi(UI_SPEED_CUSTOM, !speedCustomOpen),
              })}
              className="absolute inset-x-0 bottom-1 bg-transparent border-none p-0 text-[10px]"
              style={{ color: playback.speed === sp ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }}
            >
              {s.sheetSpeedCustom} ›
            </button>
          </div>
        ) : (
          <React.Fragment key={sp}>{tile}</React.Fragment>
        );
      })}
    </div>
  );

  const speedPanel = (
    <>
      {landscape && <SheetSectionTitle title={s.sheetSpeedSection} />}
      {speedTiles}
      {speedCustomOpen && (
        <div className="mt-2 px-1">
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={playback.speed}
            aria-label={s.sheetSpeedCustom}
            onChange={(e) => setSpeed(Number(e.target.value), false)}
            className="w-full"
          />
          <div className="text-[11px] text-white/60 text-right">{playback.speed}X</div>
        </div>
      )}
      {landscape && (
        <>
          <SheetSectionTitle title={s.sheetSpeedOther} className="mt-4" />
          {view === 'longpress' ? (
            player.speeds.map((sp) => (
              <SheetSettingRow
                key={sp}
                label={speedLabelOf(sp)}
                right={player.longPressSpeed === sp ? (
                  <span className="text-[12px]" style={{ color: C.primary }}>✓</span>
                ) : undefined}
                bind={bindTap({ kind: 'action', id: 'player.sheets.speed.longpress.set' }, {
                  onTrigger: () => { setLongPressSpeed(sp); setUi(UI_VIEW, 'speed'); },
                })}
              />
            ))
          ) : (
            <SheetSettingRow
              label={s.sheetLongPressSpeed}
              right={<RowValue text={speedLabelOf(player.longPressSpeed)} />}
              bind={toView('player.sheets.speed.longpress.set', 'longpress')}
            />
          )}
          <SheetSettingRow
            label={s.sheetLockSpeed}
            info
            right={
              <SheetSwitch
                on={player.longPressLockSpeed}
                bind={bindTap({ kind: 'action', id: 'player.sheets.speed.switch.toggle' }, {
                  onTrigger: toggleLongPressLockSpeed,
                })}
              />
            }
          />
          <SheetSettingRow
            label={s.sheetLeftRewind}
            info
            right={
              <SheetSwitch
                on={player.leftLongPressRewind}
                bind={bindTap({ kind: 'action', id: 'player.sheets.speed.switch.toggle' }, {
                  onTrigger: toggleLeftLongPressRewind,
                })}
              />
            }
          />
        </>
      )}
    </>
  );

  /* ============================ 画质·音质·滤镜(证据 854 / ba6ce3@22) ============================ */

  /** VIP1 账号可选 VIP 及以下档,SVIP 档走权益墙(qa:Q3) */
  const isSvipTier = (tier: string) => tier === 'svip';

  // 抽屉标题带当前档位摘要(证据 854 标题区的「画质 720P · 音质 · 滤镜」)
  const qualitySummary = [
    `${s.sheetQualityTabs} ${player.qualities.find((q) => q.id === playback.qualityId)?.label ?? ''}`,
    player.audioQualities.find((a) => a.id === playback.audioQualityId)?.label,
    player.filters.find((f) => f.id === (playback.filterId ?? player.filters[0].id))?.label,
  ]
    .filter(Boolean)
    .join(' · ');

  const qualityPanel = (
    <>
      <SheetSectionTitle
        title={s.sheetQualityTabs}
        right={
          <button
            {...wontfix('player.sheets.qualityCustom.wontfix')}
            className="bg-transparent border-none p-0 text-[12px] text-white/70 flex items-center"
          >
            {s.sheetSpeedCustom}
            <IcArrowRight size={13} />
          </button>
        }
      />
      <div
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-2"
        style={{ background: 'rgba(255,255,255,0.10)' }}
      >
        <span className="flex-1 text-[11px] text-white/80">{player.qualityTip.text}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {player.qualities.map((q) => (
          <OptionTile
            key={q.id}
            label={q.label}
            sub={q.desc || undefined}
            tierBadge={q.tier === 'free' ? undefined : q.tier.toUpperCase()}
            selected={playback.qualityId === q.id}
            locked={isSvipTier(q.tier)}
            className="h-[52px]"
            bind={
              isSvipTier(q.tier)
                ? bindTap('vip.wall.open.fromQuality')
                : actionThenClose('player.sheets.quality.select', () => selectQuality(q.id))
            }
          />
        ))}
      </div>

      <SheetSectionTitle title={s.sheetAudioTab} className="mt-4" />
      <div className="grid grid-cols-3 gap-2">
        {player.audioQualities.map((a) => (
          <OptionTile
            key={a.id}
            label={a.label}
            sub={a.desc || undefined}
            tierBadge={a.tier === 'free' ? undefined : a.tier.toUpperCase()}
            selected={playback.audioQualityId === a.id}
            locked={isSvipTier(a.tier)}
            // 证据 854:臻悦MAX 是通栏大格,其余三档并排
            className={isSvipTier(a.tier) ? 'col-span-3 h-[46px]' : 'h-[48px]'}
            bind={
              isSvipTier(a.tier)
                ? bindTap('vip.wall.open.fromAudioQuality')
                : bindTap({ kind: 'action', id: 'player.sheets.audioQuality.select' }, {
                    onTrigger: () => selectAudioQuality(a.id),
                  })
            }
          />
        ))}
      </div>

      <SheetSectionTitle title={s.sheetFilterTab} className="mt-4" />
      <div className="grid grid-cols-3 gap-2">
        {player.filters.map((f) => (
          <OptionTile
            key={f.id}
            label={f.label}
            tierBadge={f.tier === 'free' ? undefined : f.tier.toUpperCase()}
            selected={(playback.filterId ?? player.filters[0].id) === f.id}
            locked={isSvipTier(f.tier)}
            className="h-[48px]"
            bind={
              isSvipTier(f.tier)
                ? bindTap('vip.wall.open.fromQuality')
                : bindTap({ kind: 'action', id: 'player.sheets.filter.select' }, {
                    onTrigger: () => selectPlayerFilter(f.id),
                  })
            }
          />
        ))}
      </div>
    </>
  );

  /* ============================ 弹幕工具箱(证据 849-851) ============================ */

  const pendingSlider = useRef<{ key: TvDanmakuSlider['key']; value: string | number } | null>(null);

  const sliderIndexOf = (sl: TvDanmakuSlider): number => {
    const cur = String(dm[sl.key]);
    const i = sl.options.indexOf(cur);
    return i >= 0 ? i : 0;
  };

  const sliderBind = (sl: TvDanmakuSlider) =>
    bindTap<HTMLButtonElement>({ kind: 'action', id: 'player.sheets.danmaku.slider.adjust' }, {
      beforeTrigger: (event) => {
        const el = event.currentTarget;
        const offsetY = (event.nativeEvent as MouseEvent).offsetY;
        if (!el.clientHeight || typeof offsetY !== 'number') {
          pendingSlider.current = null;
          return;
        }
        // 竖滑杆:底部 = 第一档,顶部 = 最后一档
        const pct = Math.max(0, Math.min(1, 1 - offsetY / el.clientHeight));
        const idx = Math.round(pct * (sl.options.length - 1));
        const raw = sl.options[idx];
        pendingSlider.current = { key: sl.key, value: sl.key === 'opacity' ? Number(raw) : raw };
      },
      onTrigger: () => {
        const next = pendingSlider.current;
        if (!next) {
          // 拿不到落点(走查器 click 中点)时前进一档,仍是真实状态变化
          const idx = (sliderIndexOf(sl) + 1) % sl.options.length;
          const raw = sl.options[idx];
          setDanmakuSetting(sl.key, sl.key === 'opacity' ? Number(raw) : raw);
          return;
        }
        setDanmakuSetting(next.key, next.value);
        pendingSlider.current = null;
      },
    });

  const blockwordOpen = ui[UI_BLOCKWORD_OPEN] === true;
  const blockwordDraft = String(ui[UI_BLOCKWORD_DRAFT] ?? '');

  const danmakuPanel = (
    <>
      <SheetSectionTitle title={dm.displayTitle} />
      <div className="flex gap-2">
        {dm.sliders.map((sl) => {
          const idx = sliderIndexOf(sl);
          const raw = sl.options[idx];
          return (
            <VerticalFillSlider
              key={sl.key}
              label={sl.label}
              valueLabel={sl.key === 'opacity' ? `${raw}%` : raw}
              pct={sl.options.length > 1 ? idx / (sl.options.length - 1) : 0}
              bind={sliderBind(sl)}
            />
          );
        })}
      </div>

      <SheetSectionTitle title={dm.modeTitle} className="mt-4" />
      <SheetSegmented
        items={[
          { id: 'full', label: dm.modeLabels.full },
          { id: 'selected', label: dm.modeLabels.selected },
        ]}
        activeId={dm.mode === 'off' ? 'full' : dm.mode}
        getBind={(id) =>
          bindTap({ kind: 'action', id: 'player.danmaku.mode.set' }, {
            onTrigger: () => setDanmakuMode(id as TvDanmakuMode),
          })
        }
      />

      {dm.switchGroups.map((group) => (
        <React.Fragment key={group.title}>
          <SheetSectionTitle title={group.title} className="mt-4" />
          {group.items.map((item) => (
            <SheetSettingRow
              key={item.key}
              icon={item.icon ? DANMAKU_SWITCH_ICONS[item.icon] : undefined}
              label={item.label}
              sub={item.sub}
              info={!item.sub}
              right={
                <SheetSwitch
                  on={dm[item.key]}
                  bind={bindTap({ kind: 'action', id: 'player.sheets.danmaku.switch.toggle' }, {
                    onTrigger: () => setDanmakuSetting(item.key, !dm[item.key]),
                  })}
                />
              }
            />
          ))}
          {/* 证据 851:特殊弹幕组尾部有「互动弹幕 去设置 ›」,spec 未建交互 → 纯展示 */}
          {group.title === '特殊弹幕' && (
            <SheetSettingRow label={dm.interactRow.label} right={<RowValue text={dm.interactRow.value} />} />
          )}
        </React.Fragment>
      ))}

      <SheetSettingRow
        label={dm.blockWordTitle}
        right={<RowValue text={`已添加 ${danmakuBlockWords.length}/${dm.blockWordsMax}`} />}
        bind={bindTap({ kind: 'action', id: 'player.sheets.danmaku.blockword.add' }, {
          onTrigger: () => setUi(UI_BLOCKWORD_OPEN, !blockwordOpen),
        })}
      />
      {blockwordOpen && (
        <div className="mb-1.5">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.10)' }}
            // 键盘配件:点「添加」时键盘别收,收了这行会移位、点空
            data-keep-keyboard="true"
          >
            <input
              value={blockwordDraft}
              onChange={(e) => setUi(UI_BLOCKWORD_DRAFT, e.target.value)}
              placeholder={dm.blockWordPlaceholder}
              aria-label={dm.blockWordTitle}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[12px] text-white placeholder:text-white/45"
            />
            <button
              {...bindTap({ kind: 'action', id: 'player.sheets.danmaku.blockword.add' }, {
                onTrigger: () => {
                  if (!blockwordDraft.trim()) return;
                  addDanmakuBlockword(blockwordDraft);
                  setUi(UI_BLOCKWORD_DRAFT, '');
                },
              })}
              className="shrink-0 bg-transparent border-none p-0 text-[12px]"
              style={{ color: blockwordDraft.trim() ? C.primary : 'rgba(255,255,255,0.45)' }}
            >
              {dm.blockWordAdd}
            </button>
          </div>
          {danmakuBlockWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {danmakuBlockWords.map((w) => (
                <button
                  key={w}
                  {...bindTap({ kind: 'action', id: 'player.sheets.danmaku.blockword.add' }, {
                    onTrigger: () => removeDanmakuBlockword(w),
                  })}
                  className="rounded-full border-none px-2.5 py-1 text-[11px] text-white/85"
                  style={{ background: 'rgba(255,255,255,0.14)' }}
                >
                  {w} ×
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* 证据 851:此刻弹幕列表 —— spec note 明确「仅作展示区不建交互」 */}
      <SheetSettingRow label={dm.nowListRow.label} right={<RowValue text={dm.nowListRow.value} />} />
    </>
  );

  /* ============================ 选集面板(证据 853 / ba6ce3@30) ============================ */

  const isVariety = content?.category === '综艺';
  const episodeContentId = content?.id ?? '';
  const seasons = seasonNumbersOf(content);
  const currentSeason = currentSeasonOf(content, seasons);
  const seasonUiKey = `${UI_SEASON}.${episodeContentId}`;
  const subTabUiKey = `${UI_SUBTAB}.${episodeContentId}`;
  const requestedSeason = (ui[seasonUiKey] as number) || currentSeason;
  const activeSeason = seasons.includes(requestedSeason) ? requestedSeason : currentSeason;
  const subTabs = seasonSubTabsOf(content, activeSeason);
  const requestedSubTab = (ui[subTabUiKey] as string) || subTabs[0] || '';
  const activeSubTab = subTabs.includes(requestedSubTab) ? requestedSubTab : subTabs[0] || '';
  const titleMode = ui[UI_TITLEMODE] === true;

  const total = seasonEpisodeStateOf(content, activeSeason, activeSubTab).available;
  const segments = useMemo(() => {
    const out: string[] = [];
    for (let start = 1; start <= total; start += SEGMENT_SIZE) {
      out.push(`${start}-${Math.min(total, start + SEGMENT_SIZE - 1)}`);
    }
    return out;
  }, [total]);
  const segmentUiKey = `${UI_SEGMENT}.${episodeContentId}.${activeSeason}.${activeSubTab}`;
  const requestedSegment = (ui[segmentUiKey] as string) || '';
  const activeSegment =
    (segments.includes(requestedSegment) ? requestedSegment : '') ||
    segments.find((seg) => {
      const [a, b] = seg.split('-').map(Number);
      return playback.episodeIndex >= a && playback.episodeIndex <= b;
    }) ||
    segments[0] ||
    '';

  const segmentRange = useMemo(() => {
    const [a, b] = (activeSegment || '1-1').split('-').map(Number);
    return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  }, [activeSegment]);

  /**
   * 期卡:期号 + 确定性日期(最新一期 2026-07-13,每期倒推 3 天,与详情页同口径)。
   * 只渲染「正在播放」附近的一窗 —— 证据 853 里盖章那张就落在可视区第 4 位,
   * 面板是自动滚到在播那期的。
   */
  const cardWindow = useMemo(() => {
    const cur = segmentRange.indexOf(playback.episodeIndex);
    if (cur < 0 || segmentRange.length <= EPISODE_CARD_WINDOW) return segmentRange;
    const start = Math.max(0, Math.min(cur - 3, segmentRange.length - EPISODE_CARD_WINDOW));
    return segmentRange.slice(start, start + EPISODE_CARD_WINDOW);
  }, [segmentRange, playback.episodeIndex]);

  const episodeCards = useMemo<EpisodeCardItem[]>(
    () =>
      cardWindow.map((ep) => {
        const dayOffset = (total - ep) * 3;
        const day = 13 - dayOffset;
        const dateText =
          day > 0 ? `2026-07-${String(day).padStart(2, '0')}` : `2026-06-${String(30 + day).padStart(2, '0')}`;
        return {
          episode: ep,
          title: `第${activeSeason}季·${activeSubTab}·第${ep}期:${content?.recommend ?? content?.title ?? ''}`,
          dateText,
          vip: content?.vipFrom !== undefined ? ep >= content.vipFrom : false,
          still: content?.still,
        };
      }),
    [cardWindow, total, content, activeSeason, activeSubTab],
  );

  const titleModeToggle = (
    <button
      {...bindTap({ kind: 'action', id: 'player.sheets.episode.viewmode.toggle' }, {
        onTrigger: () => setUi(UI_TITLEMODE, !titleMode),
      })}
      className="rounded-full border-none px-2.5 py-1 text-[11px]"
      style={{
        background: titleMode ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
        color: titleMode ? '#000000' : 'rgba(255,255,255,0.72)',
      }}
    >
      {s.sheetEpisodeTitles}
    </button>
  );

  const episodesPanel = (
    <div className="text-white">
      {seasons.length > 0 && (
        <SeasonRow
          dark
          seasons={seasons}
          activeSeason={activeSeason}
          labelOf={(n) => `第${n}季`}
          getBind={(n) => bindTap({ kind: 'action', id: 'player.sheets.season.select' }, {
            onTrigger: () => openPlayback(
              episodeContentId,
              1,
              playback.durationSec,
              n,
              seasonSubTabsOf(content, n)[0],
            ),
          })}
        />
      )}
      {subTabs.length > 0 && (
        <PillChipRow
          dark
          solidActive
          chips={subTabs}
          activeChip={activeSubTab}
          getBind={(c) => bindTap({ kind: 'action', id: 'player.sheets.subtab.select' }, {
            onTrigger: () => openPlayback(episodeContentId, 1, playback.durationSec, activeSeason, c),
          })}
        />
      )}
      <PillChipRow
        dark
        chips={segments}
        activeChip={activeSegment}
        getBind={(seg) => bindTap({ kind: 'action', id: 'player.sheets.segment.select' }, {
          onTrigger: () => setUi(segmentUiKey, seg),
        })}
        right={titleModeToggle}
      />
      {isVariety || titleMode ? (
        <EpisodeCardRow
          dark
          compact
          items={episodeCards}
          currentEpisode={playback.episodeIndex}
          playingLabel={detail.playingLabel}
          getBind={(it) => actionThenClose('player.sheets.episode.select', () => selectEpisode(it.episode))}
        />
      ) : (
        <EpisodeNumberChips
          dark
          wrap
          episodes={segmentRange}
          currentEpisode={playback.episodeIndex}
          vipFrom={content?.vipFrom}
          getBind={(ep) => actionThenClose('player.sheets.episode.select', () => selectEpisode(ep))}
        />
      )}
    </div>
  );

  /* ============================ 分享海报(证据 852) ============================ */

  // 证据 852:海报组 = 当前截图(16:9)+ 官方竖版海报,横滑切换预览
  const posters = useMemo(
    () => [
      { id: stillOf(content ?? {}), label: s.sheetShotCurrent, wide: true },
      { id: content?.poster, label: content?.title ?? '', wide: false },
    ],
    [content, s.sheetShotCurrent],
  );
  const posterIndex = Number(ui[UI_POSTER] ?? 0);
  const shareSystemBind = bindTap({ kind: 'action', id: 'player.sheets.share.system' }, {
    onTrigger: () => {
      if (!content) return;
      const playbackLabel = playback.season !== null
        ? `第${playback.season}季·${playback.subTab ?? '正片'}·第${playback.episodeIndex}期`
        : `第${playback.episodeIndex}集`;
      const launched = shareWithSystem(
        `《${content.title}》 ${playbackLabel}`,
        (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
      );
      if (!launched) toast(s.shareCanceled);
    },
  });
  const shareWechatBind = bindTap({ kind: 'action', id: 'player.sheets.share.wechat' }, {
    onTrigger: () => {
      if (!content) return;
      const launched = shareEpisodeToWechat(
        {
          contentId: content.id,
          episode: playback.episodeIndex,
          season: playback.season ?? undefined,
          subTab: playback.subTab ?? undefined,
          title: content.title,
          subtitle: content.recommend,
          cover: content.poster,
        },
        (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
      );
      if (!launched) toast(s.shareCanceled);
    },
  });
  const savePosterBind = bindTap({ kind: 'action', id: 'player.sheets.saveToAlbum' }, {
    onTrigger: () => {
      if (!content) return;
      const selectedPoster = posters[Math.max(0, Math.min(posterIndex, posters.length - 1))];
      const source = imgSrc(selectedPoster?.id);
      if (!source) {
        toast(s.saveImageFailed);
        return;
      }
      const launched = saveImageToAlbumWithSystem(source, (result) => {
        toast(result.resultCode === 'OK' ? s.savedToAlbum : s.saveImageFailed);
      });
      if (!launched) toast(s.saveImageFailed);
    },
  });

  const sharePanel = (
    <>
      <div className="flex items-start gap-2 overflow-x-auto scrollbar-none pt-1">
        {posters.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            {...bindTap({ kind: 'action', id: 'player.sheets.poster.swipe' }, {
              onTrigger: () => setUi(UI_POSTER, i),
            })}
            className={`relative shrink-0 rounded-md overflow-hidden border-none p-0 ${p.wide ? 'w-[150px]' : 'w-[96px]'}`}
            style={{ opacity: i === posterIndex ? 1 : 0.55 }}
          >
            <TvImg
              id={p.id}
              alt={p.label}
              className={`w-full object-cover ${p.wide ? 'aspect-video' : 'aspect-[2/3]'}`}
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded px-1 text-[9px] bg-black/60 text-white">
                {s.sheetShotCurrent}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <ShareChannelRow
          channels={player.shareChannels}
          icons={SHARE_ICONS}
          getBind={(label) => {
            if (label === '保存本地') return savePosterBind;
            if (label === '微信') return shareWechatBind;
            return shareSystemBind;
          }}
        />
      </div>
    </>
  );

  /* ============================ 组装 ============================ */

  const panels: Record<
    string,
    { title: string; body: React.ReactNode; wide?: boolean; full?: boolean; darkInPortrait?: boolean }
  > = {
    // 竖屏证据(820/822)里更多/倍速/定时是白色半屏,其余三块只有横屏证据 ——
    // 复用同一套深色积木,竖屏下把抽屉换成深色半屏。
    more: { title: s.sheetMore, body: morePanel },
    timer: { title: s.sheetTimer, body: timerPanel },
    speed: { title: s.sheetSpeed, body: speedPanel },
    longpress: { title: s.sheetSpeed, body: speedPanel },
    quality: { title: qualitySummary, body: qualityPanel, wide: true, darkInPortrait: true },
    danmaku: { title: s.sheetDanmaku, body: danmakuPanel, wide: true, darkInPortrait: true },
    share: { title: s.sheetSharePoster, body: sharePanel, wide: true, darkInPortrait: true },
    episodes: { title: s.episodeSection, body: episodesPanel, full: true, darkInPortrait: true },
  };
  const active = panels[sheet] ?? panels.more;

  /**
   * 二级视图返回上一级(证据 822 的 ‹)。用「进来时那个 action」的同一个 id 往回走 ——
   * 面板互换是一次 state 切换,spec 只给了单向 id(更多⇄倍速 / 长按倍速档位)。
   */
  const upActionId =
    view === 'longpress'
      ? 'player.sheets.speed.longpress.set'
      : view === 'timer'
        ? 'player.sheets.timer.set'
        : 'player.sheets.more.toSpeed';
  const upButton = view ? (
    <button
      {...bindTap({ kind: 'action', id: upActionId }, {
        onTrigger: () => setUi(UI_VIEW, view === 'longpress' ? 'speed' : ''),
      })}
      className="bg-transparent border-none p-1"
      aria-label={s.back}
      style={{ color: landscape ? '#FFFFFF' : C.textSub }}
    >
      <IcNavBack size={20} />
    </button>
  ) : undefined;

  if (landscape) {
    return (
      <LandscapeStage>
        {/* 底衬:当前画面压暗 —— 真机面板是半透明的,画面隐约可见(证据 854) */}
        <TvImg
          id={stillOf(content ?? {})}
          alt={content?.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.45)' }}
        />
        {active.full ? (
          <LandscapeBottomPanel>{active.body}</LandscapeBottomPanel>
        ) : (
          <LandscapeDrawer
            title={active.title}
            widthClass={active.wide ? 'w-[46%]' : 'w-[38%]'}
            titleExtra={
              <>
                {upButton}
                {sheet === 'danmaku' && (
                  <span className="text-[11px] text-white/55">{dm.resetLabel}</span>
                )}
              </>
            }
          >
            {active.body}
          </LandscapeDrawer>
        )}
      </LandscapeStage>
    );
  }

  return (
    <div className="relative h-full overflow-hidden" style={{ background: C.pageBg }}>
      {/* 竖屏弹幕/更多面板是覆盖在播放页上，保留画面与底部操作的视觉上下文。 */}
      <div className="relative aspect-video" style={{ background: C.darkBg }}>
        <TvImg id={stillOf(content ?? {})} alt={content?.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="px-3 py-3">
        <div className="text-[17px] font-bold truncate" style={{ color: C.text }}>{content?.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: C.textSub }}>
          {detail.playingLabel}{' '}
          {playback.season !== null
            ? `第${playback.season}季 · ${playback.subTab ?? '正片'} · 第${playback.episodeIndex}期`
            : `第${playback.episodeIndex}集`}
        </div>
        <div className="flex items-center justify-around pt-3" style={{ color: C.textSub }}>
          <span className="flex flex-col items-center gap-1 text-[11px]"><IcStar size={19} />{s.detailRecommend}</span>
          <span className="flex flex-col items-center gap-1 text-[11px]"><IcDownload size={19} />{s.detailDownload}</span>
          <span className="flex flex-col items-center gap-1 text-[11px]"><IcTopDanmaku size={19} />{s.danmaku}</span>
          <span className="flex flex-col items-center gap-1 text-[11px]"><IcPip size={19} />{s.detailCast}</span>
        </div>
      </div>
      <Sheet
        title={active.title}
        left={upButton}
        heightClass={sheet === 'danmaku' ? 'max-h-[60%]' : 'max-h-[72%]'}
        dark={active.darkInPortrait}
      >
        {active.body}
      </Sheet>
    </div>
  );
}

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { CATALOG } from '../components/feedShared';
import { catalogItem } from '../components/player/playerLib';
import Img from '../components/Img';
import {
  IcZhui, IcZhuiDone, IcTimer, IcSpeed, IcReport, IcCopyLink,
} from '../components/player/playerIcons';
import PackageManagerService from '@/os/PackageManagerService';
import { AppIcon } from '@/os/components/AppIcon';
import { getAppManifest, getLocalizedAppName } from '@/os/data/appRegistry';
import { copyToClipboard } from '../utils/clipboard';

/** 与系统默认 ACTION_SEND「选择应用」使用同一匹配结果。 */
const SHARE_TARGETS = PackageManagerService.queryIntentActivities({ action: 'ACTION_SEND', type: 'text/plain' })
  .filter((match, index, all) => all.findIndex((other) => other.appId === match.appId) === index)
  .map((match) => ({ ...match, manifest: getAppManifest(match.appId) }))
  .filter((match): match is typeof match & { manifest: NonNullable<typeof match.manifest> } => Boolean(match.manifest));

/**
 * spec 节点 player.share.sheet(route /player/share,preserve videoId/showId/ep)—— 分享/功能面板(s260)。
 * URL 驱动,关闭=bindBack;定时/倍速面板从这里 replace 打开(声明层已定)。
 * +追 复用 player.follow.toggle(与播放页图标态同步,选中持久)。
 */
export default function ShareSheet() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const videoId = sp.get('videoId');
  const showId = sp.get('showId');
  const item = catalogItem(videoId ?? showId) ?? CATALOG[0];
  const ctype = videoId ? 'movie' : String(item.type);

  const zhui = useYoukuStore((s) => s.libFollowing.some((e) => e.id === item.id));
  const toggleZhui = useYoukuStore((s) => s.toggleZhui);
  const showToast = useYoukuStore((s) => s.showToast);

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 上方:压暗的播放页背景(点击空白处关闭) */}
      <div {...bindBack<HTMLDivElement>()} className="relative min-h-0 flex-1 cursor-pointer">
        <div className="aspect-video w-full overflow-hidden">
          <Img src={item.still} label={item.title} ratio="landscape" className="h-full w-full object-cover opacity-40" />
        </div>
        <div className="px-3 pt-4 opacity-40">
          <div className="text-[22px] font-bold">{item.title}</div>
          <div className="mt-2 truncate text-[13px] text-[#999999]">{item.recTitle}</div>
        </div>
      </div>

      {/* 面板 */}
      <div className="shrink-0 rounded-t-2xl bg-(--app-c-card-bg) pt-5">
        {/* 功能行:+追 / 定时关闭 / 倍速播放 / 举报 */}
        <div className="grid grid-cols-5 gap-y-4 px-3">
          <button
            {...action('player.follow.toggle', () => toggleZhui(item.id, ctype))}
            className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--app-c-chip-bg)">
              {zhui ? <IcZhuiDone size={22} className="text-[#0C7BFF]" /> : <IcZhui size={22} className="text-(--app-c-text-primary)" />}
            </span>
            <span className="text-[11px] text-[#BBBBBB]">{zhui ? t('share.zhui.done') : t('share.zhui')}</span>
          </button>
          <button {...bindTap('player.share.timer.open')} className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--app-c-chip-bg)">
              <IcTimer size={22} className="text-(--app-c-text-primary)" />
            </span>
            <span className="text-[11px] text-[#BBBBBB]">{t('share.timer')}</span>
          </button>
          <button {...bindTap('player.share.speed.open')} className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--app-c-chip-bg)">
              <IcSpeed size={22} className="text-(--app-c-text-primary)" />
            </span>
            <span className="text-[11px] text-[#BBBBBB]">{t('share.speed')}</span>
          </button>
          <button
            {...action('player.report.wontfixToast', () => showToast(WONTFIX_TOAST))}
            className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--app-c-chip-bg)">
              <IcReport size={22} className="text-(--app-c-text-primary)" />
            </span>
            <span className="text-[11px] text-[#BBBBBB]">{t('share.report')}</span>
          </button>
        </div>

        {/* 分享应用行:与系统默认「选择应用」的匹配列表保持一致 */}
        <div className="mt-5 grid max-h-44 grid-cols-5 gap-y-4 overflow-y-auto border-t border-[#242424] px-3 pt-5">
          {SHARE_TARGETS.map(({ appId, manifest }) => (
            <button
              key={appId}
              {...action('player.share.channel.copiedToast', () => {
                const link = `https://youku.mock/v/${item.id}`;
                const text = `优酷《${item.title}》 ${link}`;
                const launched = window.__OS__?.startActivityForResult(
                  appId,
                  { action: 'ACTION_SEND', type: 'text/plain', data: { text } },
                  (r) => { if (r.resultCode === 'OK') showToast('分享成功'); },
                ) ?? false;
                if (!launched) {
                  copyToClipboard(link);
                  showToast(t('share.copied'));
                }
              })}
              className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
            >
              <AppIcon manifest={manifest} size={48} radius={14} showShadow />
              <span className="max-w-full truncate text-[11px] text-[#BBBBBB]">{getLocalizedAppName(appId)}</span>
            </button>
          ))}
          <button
            {...action('player.share.channel.copiedToast', () => {
              copyToClipboard(`https://youku.mock/v/${item.id}`);
              showToast(t('share.copied'));
            })}
            className="flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#3A3A3A]">
              <IcCopyLink size={22} className="text-(--app-c-text-primary)" />
            </span>
            <span className="max-w-full truncate text-[11px] text-[#BBBBBB]">复制链接</span>
          </button>
        </div>

        {/* 底部:取消 */}
        <button
          {...bindBack()}
          className="mt-4 flex h-13 w-full cursor-pointer items-center justify-center border-x-0 border-b-0 border-t border-solid border-[#242424] bg-transparent text-[16px] text-(--app-c-text-primary)"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

import { saveImageToAlbum } from '@/os/albumBridge';
import { sharePlainText } from '@/os/shareBridge';
import type { ActivityResult } from '@/os/types/manifest';

export interface TvShareCard {
  contentId: string;
  episode: number;
  season?: number;
  subTab?: string;
  title: string;
  subtitle?: string;
  cover?: string;
  /** 覆盖默认「《片名》第N集」文案，讨论转发等场景用。 */
  text?: string;
}

/** 腾讯视频内普通分享：先走平台 SHARE，再回退到微信可接收的 ACTION_SEND。 */
export function shareWithSystem(
  text: string,
  onResult?: (result: ActivityResult) => void,
): boolean {
  const launched = window.__OS__?.startActivityForResult?.(
    {
      action: 'com.mobilegym.SHARE',
      type: 'text/plain',
      data: { text },
    },
    (result) => onResult?.(result),
  ) ?? false;
  return launched || sharePlainText(text, { onResult });
}

/** 单集分享到微信会话：生成可回跳腾讯视频的视频卡片。 */
export function shareEpisodeToWechat(
  card: TvShareCard,
  onResult?: (result: ActivityResult) => void,
): boolean {
  const playbackLabel = card.season !== undefined
    ? `第${card.season}季·${card.subTab ?? '正片'}·第${card.episode}期`
    : `第${card.episode}集`;
  const text = card.text ?? `《${card.title}》 ${playbackLabel}`;
  const intent = {
    action: 'ACTION_SEND' as const,
    type: 'text/plain',
    data: {
      text,
      videoCard: {
        appId: 'tencentvideo',
        contentId: card.contentId,
        episode: card.episode,
        season: card.season,
        subTab: card.subTab,
        title: card.title,
        subtitle: card.subtitle ?? playbackLabel,
        cover: card.cover,
      },
    },
  };
  const launched = window.__OS__?.startActivityForResult?.(
    'wechat',
    intent,
    (result) => onResult?.(result),
  ) ?? false;
  if (launched) return true;
  return window.__OS__?.startActivityForResult?.(
    intent,
    (result) => onResult?.(result),
  ) ?? false;
}

/** 保存海报/截图到系统相册：先走平台 PICK_IMAGE，再回退本地相册。 */
export function saveImageToAlbumWithSystem(
  uri: string,
  onResult?: (result: ActivityResult) => void,
): boolean {
  const launched = window.__OS__?.startActivityForResult?.(
    {
      action: 'com.mobilegym.PICK_IMAGE',
      type: 'image/*',
      data: { mode: 'save', uri },
    },
    (result) => onResult?.(result),
  ) ?? false;
  if (launched) return true;
  void saveImageToAlbum(uri, { album: 'Saved' }).then((saved) => {
    onResult?.({ resultCode: saved ? 'OK' : 'CANCELED' });
  });
  return true;
}

/** 腾讯视频收银台：先走平台 PAY，再回退到微信支付。 */
export function payWithSystem(
  input: { amount: number; orderId: string; subject: string },
  onResult: (result: ActivityResult) => void,
): boolean {
  const data = {
    ...input,
    merchantName: '腾讯视频',
    source: 'tencentvideo',
    method: '微信支付',
  };
  const launched = window.__OS__?.startActivityForResult?.(
    { action: 'com.mobilegym.PAY', data },
    onResult,
  ) ?? false;
  if (launched) return true;
  return window.__OS__?.startActivityForResult?.(
    'wechat',
    { action: 'ACTION_PAY', scheme: 'weixin', data },
    onResult,
  ) ?? false;
}

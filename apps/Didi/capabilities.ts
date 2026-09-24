import { pickImages } from '@/os/albumBridge';
import { sharePlainText } from '@/os/shareBridge';
import type { ActivityResult } from '@/os/types/manifest';

type PickedImage = { uri: string };

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

export function copyToClipboard(text: string): boolean {
  const os = window.__OS__ as (typeof window.__OS__ & {
    copyToClipboard?: (value: string) => void;
  }) | undefined;
  if (os?.copyToClipboard) {
    os.copyToClipboard(text);
    return true;
  }
  if (!os?.clipboard) return false;
  os.clipboard.copyText(text, 'didi');
  return true;
}

export function pickImagesFromAlbum(
  options: { multiple?: boolean; maxSelect?: number },
): Promise<{ selected: PickedImage[]; cancelled: boolean }> {
  return new Promise((resolve) => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'com.mobilegym.PICK_IMAGE',
        type: 'image/*',
        data: {
          multiple: options.multiple ?? false,
          maxSelect: options.maxSelect ?? 1,
        },
      },
      (result) => {
        const raw = result.data?.selected ?? result.data?.uris ?? result.data?.uri;
        const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const selected = values
          .map((item) => (typeof item === 'string' ? { uri: item } : item))
          .filter((item): item is PickedImage => !!item && typeof item.uri === 'string');
        resolve({ selected, cancelled: result.resultCode !== 'OK' || selected.length === 0 });
      },
    );
    if (!launched) void pickImages(options).then(resolve);
  });
}

export function payWithSystem(
  input: { amount: number; orderId: string; subject: string; method?: string },
  onResult?: (result: ActivityResult) => void,
): boolean {
  const data = { ...input, merchantName: '滴滴出行', source: 'didi' };
  const launched = window.__OS__?.startActivityForResult?.(
    { action: 'com.mobilegym.PAY', data },
    (result) => onResult?.(result),
  ) ?? false;
  if (launched) return true;
  return window.__OS__?.startActivityForResult?.(
    'wechat',
    { action: 'ACTION_PAY', scheme: 'weixin', data },
    (result) => onResult?.(result),
  ) ?? false;
}

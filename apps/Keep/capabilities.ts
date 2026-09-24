import { pickImages } from '@/os/albumBridge';
import { sharePlainText } from '@/os/shareBridge';
import type { ActivityResult } from '@/os/types/manifest';

type PickedImage = { uri: string };

export function shareWithSystem(
  text: string,
  resultHandler?: ((result: ActivityResult) => void) | { onResult?: (result: ActivityResult) => void },
): boolean {
  const onResult = typeof resultHandler === 'function' ? resultHandler : resultHandler?.onResult;
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
  os.clipboard.copyText(text, 'keep');
  return true;
}

export function pickImagesWithSystem(
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
  const data = { ...input, merchantName: 'Keep', source: 'keep' };
  const launched = window.__OS__?.startActivityForResult?.(
    { action: 'com.mobilegym.PAY', data },
    (result) => onResult?.(result),
  ) ?? false;
  if (launched) return true;

  const method = input.method ?? '支付宝支付';
  if (method.includes('微信')) {
    return window.__OS__?.startActivityForResult?.(
      'wechat',
      { action: 'ACTION_PAY', scheme: 'weixin', data },
      (result) => onResult?.(result),
    ) ?? false;
  }
  if (method.includes('Apple Pay')) {
    return window.__OS__?.startActivityForResult?.(
      { action: 'ACTION_PAY', scheme: 'applepay', data },
      (result) => onResult?.(result),
    ) ?? false;
  }
  return window.__OS__?.startActivityForResult?.(
    'alipay',
    { action: 'ACTION_PAY', scheme: 'alipays', data },
    (result) => onResult?.(result),
  ) ?? false;
}

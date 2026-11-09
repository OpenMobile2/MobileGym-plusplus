/**
 * Slack → OS 标准能力薄封装（剪切板 / 分享 / 选图 / 存图）。
 * 业务页直接调这里，避免假 toast 或私有逻辑。
 */
import { sharePlainText } from '@/os/shareBridge';
import { pickImages, saveImageToAlbum, makeTextPosterDataUrl } from '@/os/albumBridge';

export { pickImages, saveImageToAlbum, makeTextPosterDataUrl };

/** 写入系统剪切板（__OS__.clipboard.copyText）；不可用时返回 false */
export function copyToClipboard(text: string): boolean {
  const clipboard = window.__OS__?.clipboard;
  if (!clipboard?.copyText) return false;
  clipboard.copyText(text, 'slack');
  return true;
}

/**
 * 分享纯文本（ACTION_SEND text/plain）。
 * 优先 startActivity：微信等接收方声明了 launchMode=singleTask，会进自己的 Task，
 * 避免 ForResult 把微信叠在 Slack 上形成双实例（易触发「应用出现问题」）。
 * 微信 ShareForwardPage 在外部分享完成/取消时会 finishActivity，配合 launchedByTaskId 回到 Slack。
 * startActivity 不可用时再降级 ForResult。
 */
export function shareText(
  text: string,
  onResult?: (ok: boolean) => void,
): boolean {
  const os = window.__OS__;
  if (os?.startActivity) {
    const launched = os.startActivity({
      action: 'ACTION_SEND',
      type: 'text/plain',
      data: { text },
    });
    if (launched) return true;
  }
  return sharePlainText(text, {
    onResult: (result) => onResult?.(result.resultCode === 'OK'),
  });
}

export function channelUrl(workspaceUrl: string, convId: string): string {
  return `https://${workspaceUrl}/archives/${convId}`;
}

export function messageUrl(workspaceUrl: string, convId: string, messageId: string): string {
  return `https://${workspaceUrl}/archives/${convId}/p${messageId}`;
}

export function huddleUrl(workspaceUrl: string, convId: string): string {
  return `https://${workspaceUrl}/huddle/${convId}`;
}

export function inviteUrl(workspaceUrl: string): string {
  return `https://${workspaceUrl}/join/invite`;
}

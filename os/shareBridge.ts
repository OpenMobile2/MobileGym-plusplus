/**
 * App → 微信等分享桥接（ACTION_SEND + ForResult）。
 * 用 startActivityForResult，发完/取消能回调，调用方可 toast「分享成功」。
 * 业务侧优先用本模块，避免只 toast 假成功，或 fire-forget 回不来也没反馈。
 */
import type { ActivityResult } from './types/manifest';
import { ShareAuditService } from './ShareAuditService';

export type SharePlainTextOptions = {
  /** 默认 text/plain */
  type?: string;
  /** 指定接收 App 时跳过系统分享选择页。 */
  targetAppId?: string;
  onResult?: (result: ActivityResult) => void;
};

function launchShare(
  type: string,
  data: Record<string, unknown>,
  options?: SharePlainTextOptions,
): boolean {
  const os = window.__OS__;
  if (!os?.startActivityForResult) return false;
  const intent = { action: 'ACTION_SEND', type, data };
  const auditText = typeof data.text === 'string' ? data.text : String(data.stream ?? type);
  const auditId = ShareAuditService.recordLaunch(auditText, type, options?.targetAppId);
  const onResult = (result: ActivityResult) => {
    ShareAuditService.recordResult(auditId, result.resultCode);
    options?.onResult?.(result);
  };
  const launched = options?.targetAppId
    ? os.startActivityForResult(options.targetAppId, intent, onResult)
    : os.startActivityForResult(intent, onResult);
  if (!launched) ShareAuditService.discard(auditId);
  return launched;
}

/** 分享纯文本到可接收 ACTION_SEND 的 App（通常解析到微信） */
export function sharePlainText(text: string, options?: SharePlainTextOptions): boolean {
  const type = options?.type ?? 'text/plain';
  return launchShare(type, { text }, options);
}

/** 分享图片（可带一句说明）到可接收 ACTION_SEND image/* 的 App */
export function shareImage(uri: string, options?: SharePlainTextOptions & { text?: string }): boolean {
  if (!uri) return false;
  return launchShare(options?.type ?? 'image/*', {
    stream: [uri],
    ...(options?.text ? { text: options.text } : {}),
  }, options);
}

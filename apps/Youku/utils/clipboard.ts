/**
 * 写入系统剪贴板(OS ClipboardService)。
 * 「复制链接」类入口必须接系统接口而非仅弹 toast(阶段⑥能力接入走查)。
 */
export function copyToClipboard(text: string): void {
  window.__OS__?.clipboard?.copyText(text, 'youku');
}

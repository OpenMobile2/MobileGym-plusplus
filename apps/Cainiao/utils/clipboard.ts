/**
 * 写入系统剪贴板(OS ClipboardService)。
 * 「复制单号」类验收任务靠读系统剪贴板校验,必须接系统接口而非仅弹 toast(阶段⑥反馈#2)。
 */
export function copyToClipboard(text: string): void {
  window.__OS__?.clipboard?.copyText(text, 'cainiao');
}

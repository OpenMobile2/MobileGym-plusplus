// apps/Tencentvideo/hooks/playbackScrub.ts —— 拖进度期间冻结播放推进的开关。
//
// 为什么是模块级变量而不是 store 字段:拖动中任何一次 store 写入都会让播放页重渲染,
// 而竖屏播放器在 playing=false 时要插入贴片广告浮层(PausedAdOverlay)。浮层插入会
// 顶掉正在进行的 pointer capture,手指还按着但后续 pointermove 已经不落在进度条上
// —— 表现就是「刚进播放页第一次拖不动,先点一下暂停后反而能拖」。
// 这里用计数器(横屏/竖屏可能同时挂着进度条)只挡 ticker,不触发任何渲染。

let scrubDepth = 0;

export function beginPlaybackScrub(): void {
  scrubDepth += 1;
}

export function endPlaybackScrub(): void {
  scrubDepth = Math.max(0, scrubDepth - 1);
}

export function isPlaybackScrubbing(): boolean {
  return scrubDepth > 0;
}

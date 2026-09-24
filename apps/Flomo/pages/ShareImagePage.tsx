import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, MemoImages, renderContent } from '../components/ui';
import { fullTime } from '../utils/format';
import { IcClose, IcShare } from '../res/icons';

type Style = { id: string; name: string; bg: string; fg: string; sub: string; accent?: string };

const STYLES: Style[] = [
  { id: 'red', name: '红条', bg: '#FFFFFF', fg: '#1A1A1A', sub: '#9AA0A6', accent: '#E5484D' },
  { id: 'pink', name: '粉色', bg: '#FFF1F2', fg: '#4A1F24', sub: '#B98A90' },
  { id: 'yellow', name: '米黄', bg: '#FBF6E9', fg: '#3F3A2A', sub: '#A99F7E' },
  { id: 'white', name: '白色', bg: '#FFFFFF', fg: '#1A1A1A', sub: '#9AA0A6' },
];

export default function ShareImagePage() {
  const { bindTap } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const user = useFlomoStore((s) => s.user);
  const currentMemoId = useFlomoStore((s) => s.currentMemoId);
  const toast = useFlomoStore((s) => s.toast);

  const [selectedStyle, setSelectedStyle] = useState('red');
  const style = STYLES.find((x) => x.id === selectedStyle) ?? STYLES[0];

  const memo = memos.find((m) => m.id === currentMemoId) ?? memos[0];

  return (
    <div className="flex flex-col h-full" style={{ background: '#E9EBEE' }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindTap('share.image.close')}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>分享成图</div>
        <div className="w-9" />
      </div>

      {/* 成图预览 */}
      <div className="flex-1 overflow-y-auto px-5 py-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: style.bg, borderLeft: style.accent ? `4px solid ${style.accent}` : undefined }}
        >
          <div className="px-5 py-5">
            <div className="mb-3" style={{ color: style.sub, fontSize: 12 }}>
              {memo ? fullTime(memo.createdAt) : ''}
            </div>
            <div style={{ color: style.fg }}>
              {memo ? renderContent(memo.content, () => ({}), 15) : null}
            </div>
            {memo && <MemoImages images={memo.images} />}
            <div className="mt-5 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${style.sub}33` }}>
              <span style={{ color: style.fg, fontSize: 13 }}>{user.name}</span>
              <span style={{ color: style.sub, fontSize: 11 }}>{user.memoCount} MEMOS · {user.days} DAYS</span>
            </div>
          </div>
        </div>

        {/* 样式模板横向选择 */}
        <div className="flex gap-3 mt-5 overflow-x-auto">
          {STYLES.map((st) => (
            <button
              key={st.id}
              {...bindTap({ kind: 'action', id: 'share.image.style.select' }, { onTrigger: () => setSelectedStyle(st.id) })}
              className="shrink-0 w-14 h-14 rounded-xl border-none cursor-pointer flex items-end justify-center pb-1"
              style={{
                background: st.bg,
                outline: selectedStyle === st.id ? `2px solid ${C.green}` : `1px solid ${C.border}`,
                borderLeft: st.accent ? `4px solid ${st.accent}` : undefined,
              }}
            >
              <span style={{ color: st.sub, fontSize: 10 }}>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部操作条 */}
      <div className="shrink-0 px-4 py-3" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <button
          {...bindTap({ kind: 'action', id: 'share.image.save.do' }, { onTrigger: () => toast('已保存') })}
          className="w-full h-11 rounded-xl border-none cursor-pointer font-semibold mb-3"
          style={{ background: C.green, color: '#fff', fontSize: 15 }}
        >
          保存图片
        </button>
        <div className="flex">
          {['微信', '朋友圈', '更多'].map((label) => (
            <button
              key={label}
              {...bindTap({ kind: 'action', id: 'share.image.send.wechat' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              style={{ color: C.text, fontSize: 12 }}
            >
              <IcShare size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

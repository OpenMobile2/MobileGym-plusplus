import React from 'react';
import { TopBar, Screen, useToast, WY, NOT_OPEN } from '../components/ui';

export default function SheetMusicPage() {
  const [toast, showToast] = useToast();
  const [reading, setReading] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);
  if (reading !== null) {
    return (
      <Screen>
        <TopBar title="乐谱" onBack={() => setReading(null)} />
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <div className="text-[13px] mb-4" style={{ color: WY.textSecondary }}>F调 | 弹唱版 · 第 {page}/11 页</div>
          <div className="w-3/4 h-96 rounded-lg" style={{ background: '#F0F0F2' }} />
          <div className="flex gap-8 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>上一页</button>
            <button onClick={() => setPage((p) => Math.min(11, p + 1))} className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>下一页</button>
          </div>
        </div>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar title="乐谱 (2)" />
      <div className="flex-1 overflow-y-auto p-3">
        {[['分解和弦', 12], ['扫弦', 11]].map(([label, pages], i) => (
          <button key={i} onClick={() => { setReading(i); setPage(1); }} className="flex items-center gap-3 w-full bg-white rounded-xl p-3 mb-2 border-none cursor-pointer text-left">
            <div className="w-16 h-20 rounded" style={{ background: '#F0F0F2' }} />
            <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>F调 · 弹唱版 · {label}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>简单难度 · {pages}页</div></div>
          </button>
        ))}
        <button onClick={() => showToast(NOT_OPEN)} className="w-full py-3 text-[13px] bg-transparent border-none cursor-pointer" style={{ color: WY.textSecondary }}>上传乐谱</button>
        {toast}
      </div>
    </Screen>
  );
}

import React from 'react';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useToast } from '../components/ui';
import {
  IcClose, IcPackage, IcRefresh, IcService, IcRecycle, IcShop, IcArrowRight, IcCamera,
} from '../res/icons';

/** 自己卖 / 平台卖 入口卡定义 */
type Entry = {
  id: string;
  label: string;
  desc: string;
  Icon: typeof IcPackage;
  color: string;
  /** 有 tid 走 transition;否则 wontfix toast */
  tid?: 'publish.edit-open' | 'home.recycle-open';
};

const SELF: Entry[] = [
  { id: 'idle', label: '发闲置', desc: '拍照上传,快速出闲置', Icon: IcPackage, color: '#FF6A00', tid: 'publish.edit-open' },
  { id: 'resell', label: '一键转卖', desc: '淘宝已买到的一键转卖', Icon: IcRefresh, color: '#2A7FFF' },
  { id: 'service', label: '发服务', desc: '发布个人技能与服务', Icon: IcService, color: '#1CB854' },
];

const PLATFORM: Entry[] = [
  { id: 'recycle', label: '闲鱼回收', desc: '闲置换钱,官方回收', Icon: IcRecycle, color: '#1CB854', tid: 'home.recycle-open' },
  { id: 'luxury', label: '奢品寄卖', desc: '专业鉴定,省心寄卖', Icon: IcShop, color: '#8B5CF6' },
];

export default function PublishEntryPage() {
  const { bindTap, bindBack } = useXianyuGestures();
  const [toast, showToast] = useToast();

  const Row = ({ e }: { e: Entry }) => {
    const inner = (
      <>
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${e.color}1A` }}
        >
          <e.Icon size={22} style={{ color: e.color }} />
        </span>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[15px] font-medium text-[#111]">{e.label}</div>
          <div className="text-[12px] text-[#999] truncate">{e.desc}</div>
        </div>
        <IcArrowRight size={15} className="text-[#CCC] shrink-0" />
      </>
    );
    const cls = 'w-full flex items-center gap-3 py-3.5 bg-transparent border-none border-b border-[#F4F4F4] cursor-pointer last:border-b-0';
    if (e.tid) {
      return <button {...bindTap(e.tid)} className={cls}>{inner}</button>;
    }
    return <button onClick={() => showToast('该功能暂未开放')} className={cls}>{inner}</button>;
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" data-status-bar-foreground="dark">
      {/* 遮罩:点击关闭 */}
      <button
        {...bindBack()}
        aria-label="关闭"
        className="absolute inset-0 bg-black/50 border-none cursor-pointer"
      />

      {/* 半屏卖闲置面板(截图342) */}
      <div
        className="relative bg-white rounded-t-[18px] max-h-[78%] flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
        data-scroll-container="PublishEntryPage-main"
        data-scroll-direction="vertical"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
          <span className="text-[17px] font-semibold text-[#111]">卖闲置</span>
          <button {...bindBack()} aria-label="关闭" className="bg-transparent border-none cursor-pointer p-1">
            <IcClose size={22} className="text-[#111]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* 拍照卖闲置 banner */}
          <div className="rounded-xl bg-gradient-to-r from-[#FFF4A8] via-[#FFE411] to-[#FFD800] px-4 py-3.5 flex items-center gap-3 mb-1">
            <span className="w-11 h-11 rounded-full bg-white/80 flex items-center justify-center shrink-0">
              <IcCamera size={24} className="text-[#111]" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#111]">拍照卖闲置</div>
              <div className="text-[12px] text-[#666] mt-0.5">闲鱼相机 · 智能识别更好卖</div>
            </div>
          </div>

          <div className="mt-3 px-1">
            <div className="text-[13px] text-[#999] mb-1">自己卖</div>
            <div className="bg-[#FAFAFA] rounded-xl px-3">
              {SELF.map((e) => <Row key={e.id} e={e} />)}
            </div>
          </div>

          <div className="mt-4 px-1">
            <div className="text-[13px] text-[#999] mb-1">平台卖</div>
            <div className="bg-[#FAFAFA] rounded-xl px-3">
              {PLATFORM.map((e) => <Row key={e.id} e={e} />)}
            </div>
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}

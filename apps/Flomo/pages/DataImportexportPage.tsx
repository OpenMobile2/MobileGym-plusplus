import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcClose, IcArrowRight } from '../res/icons';

type Tab = 'export' | 'import';

const IMPORT_SOURCES = [
  { id: 'wereader', label: '微信读书', color: '#3B9EE8' },
  { id: 'dedao', label: '得到', color: '#E8622E' },
  { id: 'applenotes', label: 'Apple 备忘录（Beta）', color: '#F4C430' },
  { id: 'shouji', label: '手记', color: '#6B5BD2' },
  { id: 'dayone', label: 'Day One', color: '#2FA3F0' },
];

/** 导入/导出弹层 · 节点 data.importExport · 证据 IMG_0197 */
export default function DataImportexportPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const toast = useFlomoStore((s) => s.toast);
  const [tab, setTab] = useState<Tab>('import');

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 X */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={20} />
        </button>
        <div className="flex-1 text-center font-bold text-lg lowercase" style={{ color: C.text }}>flomo</div>
        <div className="w-10" />
      </div>

      {/* 导出/导入 分段控件 */}
      <div className="flex items-center justify-center gap-8 py-3 shrink-0">
        <SegBtn
          label="导出"
          active={tab === 'export'}
          bind={bindTap({ kind: 'action', id: 'data.importExport.tab.select' }, { onTrigger: () => { setTab('export'); toast('已切换到导出'); } })}
        />
        <SegBtn
          label="导入"
          active={tab === 'import'}
          bind={bindTap({ kind: 'action', id: 'data.importExport.tab.select' }, { onTrigger: () => { setTab('import'); toast('已切换到导入'); } })}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'import' ? (
          <>
            <div className="px-1 mb-2" style={{ color: C.sub, fontSize: 13 }}>查看如何从这些软件导入笔记到 flomo</div>
            <div className="flex flex-col gap-2.5">
              {IMPORT_SOURCES.map((src) => (
                <button
                  key={src.id}
                  {...bindTap({ kind: 'action', id: 'data.importExport.source.open' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="w-full flex items-center gap-3 px-3 h-14 rounded-2xl border-none cursor-pointer text-left"
                  style={{ background: C.surface }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 font-semibold"
                    style={{ background: src.color, fontSize: 14 }}
                  >
                    {src.label.slice(0, 1)}
                  </span>
                  <span className="flex-1" style={{ color: C.text, fontSize: 15 }}>{src.label}</span>
                  <IcArrowRight size={18} style={{ color: C.sub }} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="px-1 mb-2" style={{ color: C.sub, fontSize: 13 }}>将你在 flomo 的全部笔记导出备份</div>
            <div className="flex flex-col gap-2.5">
              <ExportRow label="导出为 Markdown" bind={bindTap({ kind: 'action', id: 'data.importExport.source.open' }, { onTrigger: () => toast('该功能暂未开放') })} />
              <ExportRow label="导出为 CSV" bind={bindTap({ kind: 'action', id: 'data.importExport.source.open' }, { onTrigger: () => toast('该功能暂未开放') })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SegBtn({ label, active, bind }: { label: string; active: boolean; bind: object }) {
  return (
    <button
      {...bind}
      className="px-6 h-9 rounded-full border-none cursor-pointer font-medium"
      style={{
        background: active ? C.text : 'transparent',
        color: active ? '#fff' : C.sub,
        fontSize: 15,
      }}
    >
      {label}
    </button>
  );
}

function ExportRow({ label, bind }: { label: string; bind: object }) {
  return (
    <button
      {...bind}
      className="w-full flex items-center gap-3 px-3 h-14 rounded-2xl border-none cursor-pointer text-left"
      style={{ background: C.surface }}
    >
      <span className="flex-1" style={{ color: C.text, fontSize: 15 }}>{label}</span>
      <IcArrowRight size={18} style={{ color: C.sub }} />
    </button>
  );
}

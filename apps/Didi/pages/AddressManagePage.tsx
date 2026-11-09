import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, SectionLabel, C } from '../components/ui';

/** 常用地址(家/公司)—— 常规样式,无直接证据。修改走本地底部选择列表→setAddress。 */
export default function AddressManagePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const addresses = useDidiStore((s) => s.addresses);
  const setAddress = useDidiStore((s) => s.setAddress);

  const [picking, setPicking] = React.useState<'家' | '公司' | null>(null);

  const home = addresses.find((a) => a.label === '家');
  const work = addresses.find((a) => a.label === '公司');
  const others = addresses.filter((a) => a.label !== '家' && a.label !== '公司');

  const setBind = (target: '家' | '公司') =>
    bindTap(
      { kind: 'action', id: 'address.manage.set' },
      { onTrigger: () => setPicking(target), params: { target } },
    );

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      <TopBar title="常用地址" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3 pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Card>
          <button
            {...setBind('家')}
            className="flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
          >
            <span className="text-[18px] mr-3">🏠</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] text-app-text">家</span>
              <span className="block text-[12px] text-app-text-muted truncate mt-0.5">
                {home?.name ?? '未设置'}
              </span>
            </span>
            <span className="text-[13px] shrink-0" style={{ color: C.orangeDeep }}>修改</span>
          </button>
          <button
            {...setBind('公司')}
            className="flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left"
          >
            <span className="text-[18px] mr-3">🏢</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] text-app-text">公司</span>
              <span className="block text-[12px] text-app-text-muted truncate mt-0.5">
                {work?.name ?? '未设置'}
              </span>
            </span>
            <span className="text-[13px] shrink-0" style={{ color: C.orangeDeep }}>修改</span>
          </button>
        </Card>

        <SectionLabel>常用地址</SectionLabel>
        <Card>
          {others.map((a, i) => (
            <div
              key={a.id}
              className={`px-4 py-3 ${i === others.length - 1 ? '' : 'border-b border-app-border'}`}
            >
              <div className="text-[14px] text-app-text truncate">{a.name}</div>
              <div className="text-[11px] text-app-text-muted truncate mt-0.5">{a.address}</div>
            </div>
          ))}
        </Card>

        <button
          onClick={() => toast('该功能暂未开放')}
          className="w-full mt-3 py-3 rounded-xl bg-app-surface border border-dashed border-app-border text-[14px]"
          style={{ color: C.orangeDeep }}
        >
          + 添加常用地址
        </button>
      </div>

      {/* 底部选择列表(本地 state) */}
      {picking && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/50">
          <div className="bg-app-surface rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center px-4 pt-4 pb-2 shrink-0">
              <span className="flex-1 text-center text-[16px] font-semibold text-app-text pl-6">
                选择{picking}的地址
              </span>
              <button
                onClick={() => setPicking(null)}
                className="bg-transparent border-none text-[18px] text-app-text-muted w-6"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              {others.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAddress(picking, a.name);
                    setPicking(null);
                  }}
                  className="flex flex-col w-full px-5 py-3 bg-transparent border-none text-left border-b border-app-border"
                >
                  <span className="text-[14px] text-app-text truncate">{a.name}</span>
                  <span className="text-[11px] text-app-text-muted truncate mt-0.5">{a.address}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

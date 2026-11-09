import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar, VipTag, showToast } from '../components/ui';
import { useXimalayaStore } from '../state';
import { IcCheck } from '../res/icons';

const SKIN_CATS = ['全部', '经典IP', '哈利波特', '影视原著', '玄幻奇幻'] as const;

export function SkinPage() {
  const { bindTap } = useXimalayaGestures();
  const skins = useXimalayaStore((st) => st.skins);
  const appliedSkinId = useXimalayaStore((st) => st.appliedSkinId);
  const applySkin = useXimalayaStore((st) => st.applySkin);

  const [cat, setCat] = useState<string>('全部');
  const [bag, setBag] = useState(false);          // 我的背包=只看已购
  const [previewId, setPreviewId] = useState<string | null>(null);

  const list = skins.filter((sk) => {
    if (bag) return sk.owned;
    return cat === '全部' || sk.category === cat;
  });

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar
        title={bag ? '我的背包' : '播放器皮肤'}
        right={
          <button
            {...bindTap({ kind: 'action', id: 'skin.bag.owned' }, { onTrigger: () => setBag((v) => !v) })}
            className="text-[13px] text-[#333] pr-1"
          >{bag ? '全部皮肤' : '我的背包'}</button>
        }
      />

      {/* 分类Tab(背包态隐藏) */}
      {!bag && (
        <div
          className="shrink-0 flex items-center gap-4 px-4 h-11 bg-white overflow-x-auto text-[14px]"
          data-scroll-container data-scroll-direction="horizontal"
        >
          {SKIN_CATS.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'skin.cat.select.opt' }, { params: { cat: c }, onTrigger: () => setCat(c) })}
                className={'shrink-0 pb-1 ' + (active ? 'text-[#FE4543] font-semibold border-b-2 border-[#FE4543]' : 'text-[#666]')}
              >{c}</button>
            );
          })}
        </div>
      )}

      {/* 皮肤卡网格 */}
      <div className="flex-1 overflow-y-auto p-3" data-scroll-container data-scroll-direction="vertical">
        <div className="grid grid-cols-2 gap-3">
          {list.map((sk) => {
            const applied = appliedSkinId === sk.id;
            const preview = previewId === sk.id;
            const lockVip = sk.isVip && !sk.owned;
            return (
              <div
                key={sk.id}
                {...bindTap({ kind: 'action', id: 'skin.preview.select.opt' }, { params: { skinId: sk.id }, onTrigger: () => { setPreviewId(sk.id); showToast(`预览:${sk.name}`); } })}
                className={'relative rounded-xl overflow-hidden bg-white ' + (preview ? 'ring-2 ring-[#FE4543]' : '')}
              >
                <div className="h-32 flex items-center justify-center" style={{ background: sk.themeColor }}>
                  <span className="text-white/85 text-[13px]">{sk.name}</span>
                </div>
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  {sk.isVip ? <VipTag label="VIP" /> : <span className="text-[10px] leading-[14px] px-1 rounded-sm bg-[#FE4543] text-white">限免</span>}
                </div>
                {applied && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#FE4543] text-white flex items-center justify-center">
                    <IcCheck size={13} />
                  </div>
                )}
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-[13px] text-[#333] truncate">{sk.name}</span>
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'skin.apply.select.opt' },
                      {
                        params: { skinId: sk.id },
                        stopPropagation: true,
                        onTrigger: () => {
                          if (lockVip) { showToast('开通会员后可使用该皮肤'); return; }
                          applySkin(sk.id);
                          showToast('已应用皮肤');
                        },
                      },
                    )}
                    className={'shrink-0 text-[12px] px-3 py-1 rounded-full ' + (applied ? 'bg-[#F2F2F2] text-[#999]' : 'bg-[#FE4543] text-white')}
                  >{applied ? '使用中' : '使用'}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

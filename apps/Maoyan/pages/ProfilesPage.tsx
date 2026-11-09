import React from 'react';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, TopBar, NOT_OPEN, MY, BottomSheet } from '../components/ui';
import { IcEdit, IcTrash, IcPlus } from '../res/icons';

/** 常用信息·实名观演人(r7;新增表单弹层 ?add=open) */
export default function ProfilesPage() {
  const { bindTap, back } = useMaoyanGestures();
  const [toast, showToast] = useToast();
  const { value: add } = usePanel('add');
  const [name, setName] = React.useState('');
  const [idNo, setIdNo] = React.useState('');

  const profiles = useMaoyanStore((st) => st.profiles);
  const addProfile = useMaoyanStore((st) => st.addProfile);
  const removeProfile = useMaoyanStore((st) => st.removeProfile);

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="light">
      {toast}
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar title="常用信息" variant="red" />
        <div className="flex bg-app-surface">
          <span className="flex-1 py-2.5 text-center text-[14px] text-[#DC4038] font-bold border-b-2 border-[#DC4038]">实名信息</span>
          <button
            {...bindTap({ kind: 'action', id: 'profiles.mail.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex-1 py-2.5 text-center text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer"
          >
            邮寄地址
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="profiles-list" data-scroll-direction="vertical">
        <button
          {...bindTap('profiles.add.open')}
          className="w-full mt-3 h-11 rounded-lg border border-dashed border-[#DC4038] text-[#DC4038] text-[14px] bg-app-surface cursor-pointer flex items-center justify-center gap-1"
        >
          <IcPlus size={16} /> 添加/修改实名信息
        </button>
        <div className="bg-app-surface rounded-xl mt-3">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center px-3 py-3 border-b border-app-border last:border-0">
              <span className="text-[15px] text-app-text w-16">{p.name}</span>
              <span className="text-[12px] text-(--app-c-text-3)">身份证 {p.idMasked}</span>
              <span className="ml-auto flex gap-3">
                <IcEdit size={16} className="text-(--app-c-text-3)" />
                <button
                  {...bindTap({ kind: 'action', id: 'profiles.remove.trigger' }, {
                    params: { id: p.id },
                    onTrigger: () => removeProfile(p.id),
                  })}
                  className="bg-transparent border-none cursor-pointer p-0"
                  aria-label="删除"
                >
                  <IcTrash size={16} className="text-(--app-c-text-3)" />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>

      {add === 'open' && (
        <BottomSheet title="添加实名信息" onClose={() => back()} heightClass="max-h-[55%]">
          <div className="px-4 py-2">
            <div className="text-[13px] text-app-text-muted mt-2">姓名</div>
            <input
              {...bindTap({ kind: 'action', id: 'profiles.name.input' }, { params: { value: 'name' }, onTrigger: () => { /* 受控输入 */ } }) as any}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入真实姓名"
              className="w-full text-[15px] border-b border-app-border outline-none py-2 bg-transparent"
            />
            <div className="text-[13px] text-app-text-muted mt-4">身份证号</div>
            <input
              {...bindTap({ kind: 'action', id: 'profiles.idno.input' }, { params: { value: 'idNo' }, onTrigger: () => { /* 受控输入 */ } }) as any}
              value={idNo}
              onChange={(e) => setIdNo(e.target.value.replace(/[^\dXx]/g, '').slice(0, 18))}
              placeholder="请输入18位身份证号"
              inputMode="numeric"
              className="w-full text-[15px] border-b border-app-border outline-none py-2 bg-transparent"
            />
            {name.trim() && idNo.length >= 15 ? (
              <button
                {...bindTap({ kind: 'action', id: 'profiles.save.submit' }, {
                  onTrigger: () => { addProfile(name.trim(), idNo); setName(''); setIdNo(''); back(); },
                })}
                className="mt-6 w-full h-11 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
                style={{ background: MY.ctaGradient }}
              >
                保存
              </button>
            ) : (
              <button
                onClick={() => showToast('请填写姓名和身份证号')}
                className="mt-6 w-full h-11 rounded-full text-white text-[15px] font-bold border-none cursor-pointer opacity-40"
                style={{ background: MY.ctaGradient }}
              >
                保存
              </button>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

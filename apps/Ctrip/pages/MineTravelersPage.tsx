import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, BottomSheet, usePanel, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 常用信息(spec mine.travelers)。出行人卡编辑/删除;手动新增→弹表单(Gate2 完整还原);扫描/邀请wontfix。 */
export default function MineTravelersPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const travelers = useCtripStore((s) => s.travelers);
  const addTraveler = useCtripStore((s) => s.addTraveler);
  const removeTraveler = useCtripStore((s) => s.removeTraveler);
  const [tab, setTab] = React.useState('traveler');
  const [name, setName] = React.useState('');
  const [idCard, setIdCard] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const submit = () => {
    if (!name.trim()) { showToast('请填写姓名'); return; }
    addTraveler(name, idCard, phone);
    setName(''); setIdCard(''); setPhone('');
    close();
    showToast('已保存出行人');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="常用信息" />
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {[{ id: 'traveler', label: '常用出行人' }, { id: 'contact', label: '常用联系人' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-20" data-scroll-container="main" data-scroll-direction="vertical">
        {travelers.map((t) => (
          <div key={t.id} className="bg-white mx-2 mt-2 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#222222]">{t.name} <span className="text-[11px] text-[#999999] font-normal">成人</span></div>
              <div className="flex gap-3">
                <button {...bindTap({ kind: 'action', id: 'travelers.item.edit' }, { params: { id: t.id }, onTrigger: () => showToast('编辑功能演示') })} className="text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer">编辑</button>
                <button onClick={() => removeTraveler(t.id)} className="text-[13px] text-[#FF3B5C] bg-transparent border-none cursor-pointer">删除</button>
              </div>
            </div>
            <div className="text-[12px] text-[#999999] mt-1">身份证 {t.idCard}</div>
            <div className="text-[12px] text-[#999999] mt-0.5">手机 {t.phone}</div>
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex gap-3 px-3 py-2.5">
        <button {...bindTap({ kind: 'action', id: 'travelers.scan.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="flex-1 py-2.5 rounded-full border border-[#DDDDDD] text-[14px] text-[#333333] bg-white cursor-pointer">扫描证件</button>
        <button {...bindTap({ kind: 'action', id: 'travelers.add.open' }, { onTrigger: () => open('add') })} className="flex-1 py-2.5 rounded-full bg-[#0086F6] text-white text-[14px] border-none cursor-pointer">手动新增</button>
      </div>

      {panel === 'add' && (
        <BottomSheet title="新增出行人" onClose={close}>
          <div className="p-4 space-y-3">
            <Field label="姓名"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入真实姓名" className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <Field label="证件号"><input value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder="身份证号" className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <Field label="手机号"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="选填" className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <button onClick={submit} className="w-full mt-3 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">保存</button>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F2F2F2]">
      <span className="text-[14px] text-[#333333] shrink-0 mr-3">{label}</span>
      {children}
    </div>
  );
}

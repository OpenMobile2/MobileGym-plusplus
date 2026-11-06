import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, BottomSheet, usePanel, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 常用信息：出行人 / 联系人分开展示；支持编辑出行人。 */
export default function MineTravelersPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const travelers = useCtripStore((st) => st.travelers);
  const contacts = useCtripStore((st) => st.contacts ?? []);
  const addTraveler = useCtripStore((st) => st.addTraveler);
  const updateTraveler = useCtripStore((st) => st.updateTraveler);
  const removeTraveler = useCtripStore((st) => st.removeTraveler);
  const [tab, setTab] = React.useState<'traveler' | 'contact'>('traveler');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [idCard, setIdCard] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const openAdd = () => {
    setEditId(null);
    setName(''); setIdCard(''); setPhone('');
    open('form');
  };
  const openEdit = (id: string) => {
    const t = travelers.find((x) => x.id === id);
    if (!t) return;
    setEditId(id);
    setName(t.name); setIdCard(t.idCard); setPhone(t.phone);
    open('form');
  };

  const submit = () => {
    if (!name.trim()) { showToast(s.t('请填写姓名')); return; }
    if (editId) updateTraveler(editId, name, idCard, phone);
    else addTraveler(name, idCard, phone);
    setName(''); setIdCard(''); setPhone(''); setEditId(null);
    close();
    showToast(editId ? s.t('已更新出行人') : s.t('已保存出行人'));
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('常用信息')} />
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {([{ id: 'traveler' as const, label: s.t('常用出行人') }, { id: 'contact' as const, label: s.t('常用联系人') }]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-20" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'traveler' ? travelers.map((t) => (
          <div key={t.id} className="bg-white mx-2 mt-2 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#222222]">{t.name} <span className="text-[11px] text-[#999999] font-normal">{s.t('成人')}</span></div>
              <div className="flex gap-3">
                <button {...bindTap({ kind: 'action', id: 'travelers.item.edit' }, { params: { id: t.id }, onTrigger: () => openEdit(t.id) })} className="text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer">编辑</button>
                <button onClick={() => removeTraveler(t.id)} className="text-[13px] text-[#FF3B5C] bg-transparent border-none cursor-pointer">删除</button>
              </div>
            </div>
            <div className="text-[12px] text-[#999999] mt-1">身份证 {t.idCard}</div>
            <div className="text-[12px] text-[#999999] mt-0.5">手机 {t.phone}</div>
          </div>
        )) : contacts.map((c) => (
          <div key={c.id} className="bg-white mx-2 mt-2 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#222222]">{c.name}</div>
              <span className="text-[11px] text-[#0086F6] bg-[#EAF4FF] rounded px-1.5 py-0.5">{c.relation}</span>
            </div>
            <div className="text-[12px] text-[#999999] mt-1">手机 {c.phone}</div>
            <div className="text-[12px] text-[#BBBBBB] mt-0.5">{s.t('仅用于订单联系，非出行人证件信息')}</div>
          </div>
        ))}
        {tab === 'contact' && contacts.length === 0 && (
          <div className="py-16 text-center text-[14px] text-[#999999]">{s.t('暂无常用联系人')}</div>
        )}
      </div>

      {tab === 'traveler' && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex gap-3 px-3 py-2.5">
          <button {...bindTap({ kind: 'action', id: 'travelers.scan.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="flex-1 py-2.5 rounded-full border border-[#DDDDDD] text-[14px] text-[#333333] bg-white cursor-pointer">扫描证件</button>
          <button {...bindTap({ kind: 'action', id: 'travelers.add.open' }, { onTrigger: openAdd })} className="flex-1 py-2.5 rounded-full bg-[#0086F6] text-white text-[14px] border-none cursor-pointer">手动新增</button>
        </div>
      )}

      {panel === 'form' && (
        <BottomSheet title={editId ? s.t('编辑出行人') : s.t('新增出行人')} onClose={close}>
          <div className="p-4 space-y-3">
            <Field label={s.t('姓名')}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={s.t('请输入真实姓名')} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <Field label={s.t('证件号')}><input value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder={s.t('身份证号')} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <Field label={s.t('手机号')}><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={s.t('选填')} className="text-right text-[14px] bg-transparent border-none outline-none flex-1" /></Field>
            <button onClick={submit} className="w-full mt-3 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('保存')}</button>
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

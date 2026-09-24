import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch } from '../components/ui';
import { toast } from '../components/toast';
import { ACCOUNT_TYPE_GROUPS } from '../constants';

function typeLabel(typeId: string): string {
  for (const g of ACCOUNT_TYPE_GROUPS) {
    const it = g.items.find((i) => i.id === typeId);
    if (it) return it.label;
  }
  return '账户';
}

export default function AssetAccountFormPage() {
  const [sp] = useSearchParams();
  const typeId = sp.get('type') ?? 'debit';
  const { bindBack, bindAction, back } = useKapiGestures();
  const addAccount = useKapiStore((s) => s.addAccount);
  const [bank, setBank] = useState('');
  const [balance, setBalance] = useState('');
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [note, setNote] = useState('');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [special, setSpecial] = useState(false);
  const [defaultPay, setDefaultPay] = useState(false);

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <div className="flex items-center min-h-[52px] px-4 border-b border-[#EDEFF4] last:border-0">
      <span className="text-[15px] text-[#1A1D26] w-24">{label}</span>
      <input
        data-action="accountForm.field.input.value"
        data-action-type="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[15px] text-right text-[#1A1D26] placeholder:text-[#B3B9C6]"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title={typeLabel(typeId)} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <Card className="mt-2">
          {field('账户名称', name, setName, `${typeLabel(typeId)}`)}
          {field('银行名称', bank, setBank, '选填')}
          {field('起始余额', balance, setBalance, '0.00')}
          {field('卡号后4位', last4, setLast4, '选填')}
          {field('备注', note, setNote, '选填')}
        </Card>

        <Card className="mt-3">
          <Row label="计入总资产" chevron={false} value={<Switch on={includeInTotal} bind={bindAction('accountForm.flag.toggle.option', () => setIncludeInTotal((v) => !v), { value: 'includeInTotal' })} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="特别关注" chevron={false} value={<Switch on={special} bind={bindAction('accountForm.flag.toggle.option', () => setSpecial((v) => !v), { value: 'special' })} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="默认收支账户" chevron={false} value={<Switch on={defaultPay} bind={bindAction('accountForm.flag.toggle.option', () => setDefaultPay((v) => !v), { value: 'defaultPay' })} />} />
        </Card>

        <button
          {...bindAction('accountForm.submit.confirm.save', () => {
            addAccount({
              type: typeId, typeLabel: typeLabel(typeId), name: name.trim() || typeLabel(typeId),
              balance: parseFloat(balance) || 0, bank: bank.trim(), last4: last4.trim(), note: note.trim(),
              includeInTotal, special, defaultPay,
            });
            toast('账户已保存');
            back();
          })}
          className="w-full mt-4 py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          保存
        </button>
      </div>
    </div>
  );
}

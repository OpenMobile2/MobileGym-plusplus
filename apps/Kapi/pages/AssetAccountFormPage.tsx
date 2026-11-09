import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch } from '../components/ui';
import { toast } from '../components/toast';
import { ACCOUNT_TYPE_GROUPS } from '../constants';
import { useStrings } from '../hooks/useStrings';
import type { strings } from '../res/strings';

function typeLabelKey(typeId: string): keyof typeof strings | null {
  for (const g of ACCOUNT_TYPE_GROUPS) {
    const it = g.items.find((i) => i.id === typeId);
    if (it) return it.labelKey;
  }
  return null;
}

export default function AssetAccountFormPage() {
  const [sp] = useSearchParams();
  const typeId = sp.get('type') ?? 'debit';
  const { bindBack, bindAction, back } = useKapiGestures();
  const s = useStrings();
  const typeKey = typeLabelKey(typeId);
  const typeLabel = typeKey ? s[typeKey] : s.defaultAccountTypeLabel;
  const addAccount = useKapiStore((st) => st.addAccount);
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
    <div className="flex items-center min-h-[52px] px-4 border-b border-app-border last:border-0">
      <span className="text-[15px] text-app-text w-24">{label}</span>
      <input
        data-action="accountForm.field.input.value"
        data-action-type="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[15px] text-right text-app-text placeholder:text-app-text-muted"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title={typeLabel} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <Card className="mt-2">
          {field(s.accountNameLabel, name, setName, typeLabel)}
          {field(s.bankNameLabel, bank, setBank, s.optionalPlaceholder)}
          {field(s.initialBalanceLabel, balance, setBalance, '0.00')}
          {field(s.last4Label, last4, setLast4, s.optionalPlaceholder)}
          {field(s.remarkLabel, note, setNote, s.optionalPlaceholder)}
        </Card>

        <Card className="mt-3">
          <Row label={s.includeInTotalLabel} chevron={false} value={<Switch on={includeInTotal} bind={bindAction('accountForm.flag.toggle.option', () => setIncludeInTotal((v) => !v), { value: 'includeInTotal' })} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.specialAttentionLabel} chevron={false} value={<Switch on={special} bind={bindAction('accountForm.flag.toggle.option', () => setSpecial((v) => !v), { value: 'special' })} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.defaultPayAccountLabel} chevron={false} value={<Switch on={defaultPay} bind={bindAction('accountForm.flag.toggle.option', () => setDefaultPay((v) => !v), { value: 'defaultPay' })} />} />
        </Card>

        <button
          {...bindAction('accountForm.submit.confirm.save', () => {
            addAccount({
              type: typeId, typeLabel, name: name.trim() || typeLabel,
              balance: parseFloat(balance) || 0, bank: bank.trim(), last4: last4.trim(), note: note.trim(),
              includeInTotal, special, defaultPay,
            });
            toast(s.accountSavedToast);
            back();
          })}
          className="w-full mt-4 py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.saveBtn}
        </button>
      </div>
    </div>
  );
}

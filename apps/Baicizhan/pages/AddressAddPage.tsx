import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, Toggle } from '../components/common';
import { IcChevronRight } from '../res/icons';

export default function AddressAddPage() {
  const s = useStrings();
  const { action, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const save = () => {
    if (!name || !phone || !detail) { st.showToast('请填写完整'); return; }
    st.addAddress({ name, phone, region: region || '四川省 成都市', detail, isDefault });
    back();
  };

  const Field = ({ label, value, onChange, placeholder, actionId }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; actionId: string }) => (
    <div className="flex items-center border-b border-[#F4F4F4] px-4 py-3.5">
      <span className="w-20 text-sm text-[#33405C]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} {...action(actionId, () => {}, { params: { value } })}
        placeholder={placeholder} className="flex-1 bg-transparent text-right text-sm outline-none placeholder:text-[#C9CDD3]" />
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.addAddress} close />
      <div className="mt-2 bg-white">
        <Field label="收货人" value={name} onChange={setName} placeholder="姓名" actionId="address.name.input" />
        <Field label="手机号码" value={phone} onChange={setPhone} placeholder="手机号" actionId="address.phone.input" />
        <button {...action('address.region.pick', () => { setRegion('四川省 成都市 武侯区'); st.showToast('已选地区'); })} className="flex w-full items-center border-b border-[#F4F4F4] px-4 py-3.5 text-left">
          <span className="w-20 text-sm text-[#33405C]">所在地区</span><span className="flex-1 text-right text-sm" style={{ color: region ? colors.ink : '#C9CDD3' }}>{region || '省市区县、乡镇等'}</span><IcChevronRight size={16} color="#C9CDD3" />
        </button>
        <Field label="详细地址" value={detail} onChange={setDetail} placeholder="街道、楼牌等号" actionId="address.detail.input" />
        <div className="flex items-center px-4 py-3.5"><span className="flex-1 text-sm text-[#33405C]">设为默认地址</span><Toggle on={isDefault} bind={action('address.default.toggle', () => setIsDefault((v) => !v))} /></div>
      </div>
      <div className="mt-auto p-3" data-keep-keyboard="true"><button data-keep-keyboard="true" {...action('address.form.save', save)} className="w-full rounded-full py-3.5 text-sm font-semibold text-white" style={{ background: colors.mallBuy }}>{s.saveAndUse}</button></div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, EmptyState } from '../components/ui';
import { Sheet } from '../components/Sheet';
import {
  REGIONS,
  maskPhone,
  patchDeleteAddress,
  patchSetDefaultAddress,
  patchUpdateAddress,
  patchMakeLastAddressDefault,
} from './marketShared';

// 节点: market.address —— 收货地址管理。
// 列表(整卡选中→设默认回填)+ 新建/编辑表单(省市区三级联动/必填校验/保存→默认联动 orderConfirm 运费)。

export default function MarketAddressPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const addresses = useDoubanStore((s) => s.addresses);
  const addAddress = useDoubanStore((s) => s.addAddress);

  const editing = searchParams.get('form'); // 'new' | 编辑地址 id
  const editAddr = editing && editing !== 'new' ? addresses.find((a) => a.id === editing) : null;

  // 表单本地态
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [prov, setProv] = useState('');
  const [city, setCity] = useState('');
  const [dist, setDist] = useState('');
  const [detail, setDetail] = useState('');
  const [regionPicker, setRegionPicker] = useState(false);

  const openForm = (id: string) => {
    if (id === 'new') {
      setName(''); setPhone(''); setProv(''); setCity(''); setDist(''); setDetail('');
    } else {
      const a = addresses.find((x) => x.id === id);
      if (a) {
        setName(a.name); setPhone(a.phone.replace(/\*/g, ''));
        const parts = a.region.split(' ');
        setProv(parts[0] ?? ''); setCity(parts[1] ?? ''); setDist(parts[2] ?? '');
        setDetail(a.detail);
      }
    }
    setSearchParams((p) => { p.set('form', id); return p; });
  };

  const closeForm = () => { setRegionPicker(false); back(); };

  const cities = useMemo(() => REGIONS.find((r) => r.name === prov)?.cities ?? [], [prov]);
  const districts = useMemo(() => cities.find((c) => c.name === city)?.districts ?? [], [cities, city]);
  const regionText = [prov, city, dist].filter(Boolean).join(' ');

  const save = () => {
    if (!name.trim() || !phone.trim() || !prov || !city || !dist || !detail.trim()) {
      toast('请填写完整的收货信息');
      return;
    }
    const region = `${prov} ${city} ${dist}`;
    if (editAddr) {
      patchUpdateAddress(editAddr.id, { name: name.trim(), phone: phone.trim(), region, detail: detail.trim() });
      toast('已保存');
    } else {
      addAddress({ name: name.trim(), phone: phone.trim(), region, detail: detail.trim() });
      patchMakeLastAddressDefault();
      toast('已保存');
    }
    closeForm();
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>收货地址管理</div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        {addresses.length === 0 ? (
          <EmptyState text="还没有收货地址" sub="新建一个收货地址吧" icon="box" />
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-3.5">
              <button
                {...bindTap(
                  { kind: 'action', id: 'market.address.item.pick' },
                  { onTrigger: () => { patchSetDefaultAddress(a.id); toast('已选择该地址'); back(); } },
                )}
                className="w-full text-left bg-transparent border-none p-0 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{a.name}</span>
                  <span className="text-xs" style={{ color: C.sub }}>{maskPhone(a.phone)}</span>
                  {a.isDefault && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[10px]" style={{ background: C.greenSoft, color: C.green }}>默认</span>
                  )}
                </div>
                <div className="text-[13px] mt-1.5" style={{ color: C.text }}>{a.region} {a.detail}</div>
              </button>

              {/* mod7 审计:「修改地址 / 删除」左、「设为默认」右,均红色文字链,平铺白底 */}
              <div className="flex items-center gap-5 pt-2.5 mt-2.5 border-t" style={{ borderColor: C.border }}>
                <button
                  {...bindTap({ kind: 'action', id: 'market.address.item.edit' }, { onTrigger: () => openForm(a.id) })}
                  className="bg-transparent border-none cursor-pointer text-xs"
                  style={{ color: C.danger }}
                >
                  修改地址
                </button>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'market.address.item.delete' },
                    { onTrigger: () => { patchDeleteAddress(a.id); toast('已删除'); } },
                  )}
                  className="bg-transparent border-none cursor-pointer text-xs"
                  style={{ color: C.danger }}
                >
                  删除
                </button>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'market.address.item.setDefault' },
                    { onTrigger: () => { patchSetDefaultAddress(a.id); toast('已设为默认'); } },
                  )}
                  className="ml-auto bg-transparent border-none cursor-pointer text-xs"
                  style={{ color: a.isDefault ? '#B9BEC6' : C.danger }}
                >
                  {a.isDefault ? '默认地址' : '设为默认'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新建地址(底部文字链) */}
      <div className="p-3 shrink-0 border-t bg-white" style={{ borderColor: C.border }}>
        <button
          {...bindTap({ kind: 'action', id: 'market.address.form.open' }, { onTrigger: () => openForm('new') })}
          className="w-full h-11 text-center text-sm font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: C.green }}
        >
          新建地址
        </button>
      </div>

      {/* 表单弹层 */}
      {editing && (
        <Sheet title={editAddr ? '修改收货地址' : '新建收货地址'} maxH="90%">
          <div className="px-4 pb-2 overflow-y-auto" data-scroll-container="form" data-scroll-direction="vertical">
            <Field label="收货人">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" className="flex-1 h-9 bg-transparent outline-none text-[14px]" style={{ color: C.text }} />
            </Field>
            <Field label="手机号">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号码" inputMode="numeric" className="flex-1 h-9 bg-transparent outline-none text-[14px]" style={{ color: C.text }} />
            </Field>
            <button
              {...bindTap({ kind: 'action', id: 'market.address.form.select.region' }, { onTrigger: () => setRegionPicker(true) })}
              className="w-full flex items-center py-2.5 border-b bg-transparent cursor-pointer text-left"
              style={{ borderColor: C.border }}
            >
              <span className="w-20 text-[13px]" style={{ color: C.sub }}>所在地区</span>
              <span className="flex-1 text-[14px]" style={{ color: regionText ? C.text : '#B9BEC6' }}>{regionText || '省 / 市 / 区'}</span>
              <span className="text-lg" style={{ color: C.sub }}>›</span>
            </button>
            <Field label="详细地址">
              <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="街道、楼牌号等" className="flex-1 h-9 bg-transparent outline-none text-[14px]" style={{ color: C.text }} />
            </Field>

            <button
              {...bindTap({ kind: 'action', id: 'market.address.form.save' }, { onTrigger: save })}
              className="w-full h-11 mt-4 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
              style={{ background: C.green }}
            >
              保存
            </button>
          </div>

          {/* 省市区三级选择 */}
          {regionPicker && (
            <div className="absolute inset-0 z-10 flex flex-col justify-end">
              <div className="flex-1" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setRegionPicker(false)} />
              <div className="rounded-t-2xl bg-white pb-4" style={{ maxHeight: '60%' }}>
                <div className="text-center py-2.5 text-sm font-semibold" style={{ color: C.text }}>选择所在地区</div>
                <div className="flex h-56">
                  <RegionCol
                    items={REGIONS.map((r) => r.name)}
                    active={prov}
                    onPick={(v) => { setProv(v); setCity(''); setDist(''); }}
                  />
                  <RegionCol items={cities.map((c) => c.name)} active={city} onPick={(v) => { setCity(v); setDist(''); }} />
                  <RegionCol
                    items={districts}
                    active={dist}
                    onPick={(v) => { setDist(v); setRegionPicker(false); }}
                  />
                </div>
              </div>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center py-2.5 border-b" style={{ borderColor: C.border }}>
      <span className="w-20 text-[13px]" style={{ color: C.sub }}>{label}</span>
      {children}
    </div>
  );
}

function RegionCol({ items, active, onPick }: { items: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto" data-scroll-container="region-col" data-scroll-direction="vertical">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onPick(it)}
          className="w-full h-9 text-[13px] border-none cursor-pointer bg-transparent px-1 truncate"
          style={{ color: it === active ? C.green : C.text, fontWeight: it === active ? 600 : 400 }}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

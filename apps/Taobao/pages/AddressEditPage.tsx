import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { ADDRESS_TAGS } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, BottomSheet, usePanel, useToast } from '../components/ui';

const MAP_SRC = '/@app-assets/Taobao/misc/map.svg';

const REGIONS: Record<string, Record<string, string[]>> = {
  江苏省: {
    无锡市: ['新吴区', '滨湖区', '梁溪区'],
    苏州市: ['姑苏区', '吴中区', '工业园区'],
  },
  上海市: {
    上海市: ['闵行区', '徐汇区', '浦东新区', '静安区'],
  },
  吉林省: {
    长春市: ['朝阳区', '南关区', '绿园区'],
  },
  浙江省: {
    杭州市: ['西湖区', '余杭区', '滨江区'],
  },
};

/**
 * 新增/编辑地址(spec: address.edit,IMG_8734)
 * 省市区选择器走 ?region=open(uiState);保存 → addresses 新增/更新。
 */
export default function AddressEditPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { open: openPanel, searchParams: sp } = usePanel('region');
  const regionOpen = sp.get('region') === 'open';
  const { bindTap, back, go } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const addresses = useTaobaoStore((s) => s.addresses);
  const saveAddress = useTaobaoStore((s) => s.saveAddress);
  const existing = addresses.find((a) => a.id === editId);

  const [region, setRegion] = useState(existing?.region ?? '');
  const [detail, setDetail] = useState(existing?.detail ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [tag, setTag] = useState<string | null>(existing?.tag ?? null);
  const [prov, setProv] = useState('江苏省');
  const [city, setCity] = useState('无锡市');

  const canSave = region && detail.trim() && name.trim() && /^1\d{10}$/.test(phone);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title={existing ? '编辑收货地址' : '新增收货地址'} />
      <div className="flex-1 overflow-y-auto">
        {/* 地图定位卡 */}
        <div className="relative">
          <Img src={MAP_SRC} className="w-full h-24 object-cover" />
          <div className="absolute left-3 right-3 bottom-2 bg-white rounded-lg px-3 py-2 flex items-center justify-between shadow">
            <div>
              <div className="text-[13px] font-medium">📍 新业园1号楼</div>
              <div className="text-[10px] text-[#999999]">15m | 上海市徐汇区虹梅路1801号新业园</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'address.locate.use' }, {
                onTrigger: () => { setRegion('上海市 上海市 徐汇区'); setDetail('虹梅路1801号新业园1号楼'); showToast('已使用定位地址'); },
              })}
              className="text-[12px] text-[#FF5000] border border-[#FF5000] rounded-full px-2.5 py-1 bg-white cursor-pointer"
            >
              使用
            </button>
          </div>
        </div>

        {/* 表单 */}
        <div className="bg-white mt-3 px-4">
          <FormRow label="所在地区" required>
            <button
              {...bindTap({ kind: 'action', id: 'address.region.open' }, {
                onTrigger: () => openPanel('open'),
              })}
              className={`flex-1 text-left text-[14px] bg-transparent border-none cursor-pointer ${region ? '' : 'text-[#BBBBBB]'}`}
            >
              {region || '省、市、区、街道'} ▾
            </button>
          </FormRow>
          <FormRow label="详细地址" required hint="导入已有地址">
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="小区楼栋/乡村名称、门牌号"
              className="flex-1 text-[14px] bg-transparent border-none outline-none"
              data-keep-keyboard="true"
            />
          </FormRow>
          <FormRow label="收件人名字" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名字"
              className="flex-1 text-[14px] bg-transparent border-none outline-none"
              data-keep-keyboard="true"
            />
          </FormRow>
          <FormRow label="+86" required>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="手机号"
              inputMode="numeric"
              className="flex-1 text-[14px] bg-transparent border-none outline-none"
              data-keep-keyboard="true"
            />
          </FormRow>
        </div>

        {/* 标签 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[13px] text-[#666666] mb-2">地址标签</div>
          <div className="flex gap-2 flex-wrap">
            {ADDRESS_TAGS.map((t) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'address.tag.select.option' }, {
                  params: { tag: t },
                  onTrigger: () => setTag((cur) => (cur === t ? null : t)),
                })}
                className={`text-[12px] rounded-full px-3.5 py-1.5 border cursor-pointer ${
                  tag === t ? 'bg-[#FFF1E8] text-[#FF5000] border-[#FF5000]' : 'bg-[#F8F8F8] text-[#333333] border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
            <button className="text-[12px] rounded-full px-3.5 py-1.5 border border-dashed border-[#CCCCCC] bg-white text-[#666666] cursor-pointer">
              自定义
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
        <button
          {...bindTap('address.save', {
            preventDefault: !canSave,
            beforeTrigger: () => {
              saveAddress({
                id: existing?.id, name: name.trim(), phone, region, detail: detail.trim(),
                tag, isDefault: existing?.isDefault ?? false,
              });
            },
          })}
          disabled={!canSave}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[15px] border-none cursor-pointer disabled:opacity-40"
        >
          保存地址
        </button>
      </div>

      {/* 省市区选择器 */}
      {regionOpen && (
        <BottomSheet onClose={() => back()} title="选择所在地区">
          <div className="flex px-2 pb-2 h-64">
            <Column
              options={Object.keys(REGIONS)}
              value={prov}
              onPick={(v) => { setProv(v); setCity(Object.keys(REGIONS[v])[0]); }}
            />
            <Column
              options={Object.keys(REGIONS[prov] ?? {})}
              value={city}
              onPick={setCity}
            />
            <Column
              options={(REGIONS[prov] ?? {})[city] ?? []}
              value=""
              onPick={(d) => {
                setRegion(`${prov} ${city} ${d}`);
                back();
              }}
            />
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

function FormRow({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-[#F5F5F5]">
      <span className="w-20 shrink-0 text-[13px] text-[#666666]">
        {required && <span className="text-[#FF0036]">* </span>}{label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-[#FF5000] bg-[#FFF1E8] rounded px-1.5 py-0.5 shrink-0">{hint}</span>}
    </div>
  );
}

function Column({
  options, value, onPick,
}: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={`block w-full text-left px-3 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${
            value === o ? 'text-[#FF5000] font-semibold' : 'text-[#333333]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

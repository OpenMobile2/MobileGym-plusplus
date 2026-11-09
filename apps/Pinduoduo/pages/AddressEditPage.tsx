import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, showToast } from '../components/ui';
import { IcChevronRight, IcClose } from '../res/icons';

const PRESET_REGIONS = [
  '江苏省 南京市 栖霞区',
  '浙江省 杭州市 西湖区',
  '广东省 深圳市 南山区',
  '上海市 上海市 浦东新区',
  '北京市 北京市 朝阳区',
];

export function AddressEditPage() {
  const [sp] = useSearchParams();
  const id = sp.get('id') || undefined;
  const { bindTap, back } = usePinduoduoGestures();
  const existing = usePinduoduoStore((st) => st.addresses.find((a) => a.id === id));
  const saveAddress = usePinduoduoStore((st) => st.saveAddress);

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [region, setRegion] = useState(existing?.region ?? '');
  const [detail, setDetail] = useState(existing?.detail ?? '');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title={id ? '编辑地址' : '新增地址'} className="bg-white" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          <div className="flex items-center px-3 py-3 border-b border-[#F5F5F5]">
            <span className="w-20 text-[14px] text-[#333]">收货人</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请填写收货人姓名"
              className="flex-1 text-[14px] text-[#333] outline-none"
            />
          </div>
          <div className="flex items-center px-3 py-3 border-b border-[#F5F5F5]">
            <span className="w-20 text-[14px] text-[#333]">手机号</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请填写手机号"
              inputMode="numeric"
              className="flex-1 text-[14px] text-[#333] outline-none"
            />
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'address.region.open' }, { onTrigger: () => setPickerOpen((v) => !v) })}
            className="w-full flex items-center px-3 py-3 border-b border-[#F5F5F5] text-left"
          >
            <span className="w-20 text-[14px] text-[#333]">所在地区</span>
            <span className={`flex-1 text-[14px] ${region ? 'text-[#333]' : 'text-[#BBB]'}`}>{region || '请选择所在地区'}</span>
            <IcChevronRight size={18} className="text-[#999]" />
          </button>
          <div className="flex items-start px-3 py-3">
            <span className="w-20 text-[14px] text-[#333] pt-0.5">详细地址</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="街道、楼牌号等"
              className="flex-1 h-16 text-[14px] text-[#333] outline-none resize-none"
            />
          </div>
        </div>

        {/* 设为默认 */}
        <div className="bg-white mt-2 flex items-center justify-between px-3 py-3">
          <span className="text-[14px] text-[#333]">设为默认地址</span>
          <button
            {...bindTap({ kind: 'action', id: 'address.default.toggle' }, { onTrigger: () => setIsDefault((v) => !v) })}
            aria-label="设为默认"
            className={`w-11 h-6 rounded-full relative transition-colors ${isDefault ? 'bg-[#E22E1F]' : 'bg-[#DDD]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isDefault ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* 底部保存 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] p-3" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'address.form.save' }, { onTrigger: () => { saveAddress({ id, name, phone, region, detail, tag: null, isDefault }); showToast('保存成功'); back(); } })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
        >
          保存
        </button>
      </div>

      {/* 简易省市区选择器 */}
      {pickerOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPickerOpen(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#F0F0F0]">
              <span className="font-medium text-[15px]">选择所在地区</span>
              <button onClick={() => setPickerOpen(false)} aria-label="关闭"><IcClose size={20} className="text-[#999]" /></button>
            </div>
            <div className="overflow-y-auto">
              {PRESET_REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRegion(r); setPickerOpen(false); }}
                  className={`w-full text-left px-3 py-3.5 border-b border-[#F5F5F5] text-[14px] ${region === r ? 'text-[#E22E1F]' : 'text-[#333]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

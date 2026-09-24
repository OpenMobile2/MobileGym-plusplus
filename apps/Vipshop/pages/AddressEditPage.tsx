import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, BottomSheet, usePanel, useToast, NOT_OPEN, VIP } from '../components/ui';
import { ADDRESS_TAGS, REGION_DATA } from '../constants';
import { IcLocation, IcSparkles, IcArrowRight } from '../res/icons';

export default function AddressEditPage() {
  const { bindTap, back } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const { value: regionPanel, open: openPanel } = usePanel('region');
  const [toast, showToast] = useToast();

  const editId = searchParams.get('id') ?? '';
  const existing = useVipshopStore((s) => s.addresses.find((a) => a.id === editId));
  const saveAddress = useVipshopStore((s) => s.saveAddress);

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [region, setRegion] = useState(existing?.region ?? '');
  const [detail, setDetail] = useState(existing?.detail ?? '');
  const [tag, setTag] = useState(existing?.tag ?? '家庭');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);

  // 省市区选择器逐级状态
  const [pickProvince, setPickProvince] = useState<string | null>(null);
  const [pickCity, setPickCity] = useState<string | null>(null);

  const doSmartFill = () => {
    setName('李雷');
    setPhone('13912345678');
    setRegion('广东省 广州市 天河区');
    setDetail('珠江新城华夏路10号富力中心32楼');
    showToast('已智能填写');
  };

  const selectArea = (nameSel: string) => {
    if (!pickProvince) {
      setPickProvince(nameSel);
      return;
    }
    if (!pickCity) {
      setPickCity(nameSel);
      return;
    }
    // 选中区 → 组合 region 字符串并关闭
    setRegion(`${pickProvince} ${pickCity} ${nameSel}`);
    setPickProvince(null);
    setPickCity(null);
    back();
  };

  const provinces = Object.keys(REGION_DATA);
  const cities = pickProvince ? Object.keys(REGION_DATA[pickProvince]) : [];
  const districts = pickProvince && pickCity ? REGION_DATA[pickProvince][pickCity] : [];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title={editId ? '编辑地址' : '新增地址'} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="address-edit" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          {/* 姓名 */}
          <div className="flex items-center px-3 h-12 border-b border-[#F5F5F5]">
            <span className="w-20 text-[14px] text-[#666666]">收货人</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              className="flex-1 text-[14px] outline-none bg-transparent text-[#222222]"
            />
          </div>
          {/* 手机 */}
          <div className="flex items-center px-3 h-12 border-b border-[#F5F5F5]">
            <span className="w-20 text-[14px] text-[#666666]">手机号码</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              inputMode="numeric"
              className="flex-1 text-[14px] outline-none bg-transparent text-[#222222]"
            />
          </div>
          {/* 所在地区(点击打开选择器) */}
          <button
            {...bindTap({ kind: 'action', id: 'addressEdit.region.open' }, { onTrigger: () => openPanel('open') })}
            className="w-full flex items-center px-3 h-12 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
          >
            <span className="w-20 text-[14px] text-[#666666]">所在地区</span>
            <span className={`flex-1 text-[14px] ${region ? 'text-[#222222]' : 'text-[#BBBBBB]'}`}>
              {region || '请选择省 / 市 / 区'}
            </span>
            <IcArrowRight size={16} className="text-[#BBBBBB]" />
          </button>
          {/* 详细地址 */}
          <div className="flex px-3 py-3">
            <span className="w-20 text-[14px] text-[#666666] pt-0.5">详细地址</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              {...(bindTap({ kind: 'action', id: 'addressEdit.detail.input' }, { onTrigger: () => {} }) as object)}
              placeholder="街道、楼牌号等"
              rows={2}
              className="flex-1 text-[14px] outline-none bg-transparent resize-none text-[#222222]"
            />
          </div>
        </div>

        {/* 智能填写 / 定位 */}
        <div className="bg-white mt-2 flex">
          <button
            {...bindTap({ kind: 'action', id: 'addressEdit.smartFill.submit' }, { onTrigger: doSmartFill })}
            className="flex-1 flex items-center justify-center gap-1 py-3 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: VIP.primary }}
          >
            <IcSparkles size={15} />智能填写
          </button>
          <span className="w-px my-2 bg-[#F0F0F0]" />
          <button
            {...bindTap({ kind: 'action', id: 'addressEdit.locate.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex-1 flex items-center justify-center gap-1 py-3 bg-transparent border-none cursor-pointer text-[13px] text-[#666666]"
          >
            <IcLocation size={15} />定位
          </button>
        </div>

        {/* 地址类型标签 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[14px] text-[#666666] mb-2">标签</div>
          <div className="flex gap-2">
            {ADDRESS_TAGS.map((t) => {
              const on = t === tag;
              return (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'addressEdit.tag.select.target' }, {
                    params: { target: t },
                    onTrigger: () => setTag(t),
                  })}
                  className="text-[13px] rounded-full px-4 py-1 border cursor-pointer"
                  style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#666', borderColor: '#DDDDDD', background: '#fff' }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 设为默认 */}
        <div className="bg-white mt-2 px-3 py-3 flex items-center justify-between">
          <span className="text-[14px] text-[#222222]">设为默认地址</span>
          <button
            {...bindTap({ kind: 'action', id: 'addressEdit.default.toggle' }, { onTrigger: () => setIsDefault((d) => !d) })}
            className="w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer"
            style={{ background: isDefault ? VIP.primary : '#DDDDDD' }}
            aria-label="设为默认"
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: isDefault ? '22px' : '2px' }}
            />
          </button>
        </div>

        <div className="h-3" />
      </div>

      {/* 底部确定 */}
      <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] p-3">
        <button
          {...bindTap('addressEdit.save-open', {
            beforeTrigger: () => saveAddress({ id: editId || undefined, name, phone, region, detail, tag, isDefault }),
          })}
          className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.primary }}
        >
          确定
        </button>
      </div>

      {/* 省市区选择器弹层 */}
      {regionPanel === 'open' && (
        <BottomSheet onClose={() => back()} title="选择地区" heightClass="max-h-[60%]">
          <div className="px-4 py-2">
            {/* 已选层级面包屑 */}
            <div className="flex gap-2 text-[13px] mb-2">
              <span style={{ color: VIP.primary }}>{pickProvince ?? '请选择'}</span>
              {pickProvince && <span className="text-[#CCC]">/</span>}
              {pickProvince && <span style={{ color: VIP.primary }}>{pickCity ?? '请选择'}</span>}
              {pickCity && <span className="text-[#CCC]">/</span>}
              {pickCity && <span className="text-[#BBB]">请选择</span>}
            </div>
            <div className="flex flex-col">
              {(!pickProvince ? provinces : !pickCity ? cities : districts).map((areaName) => (
                <button
                  key={areaName}
                  {...bindTap({ kind: 'action', id: 'regionPicker.area.select.target' }, {
                    params: { target: areaName },
                    onTrigger: () => selectArea(areaName),
                  })}
                  className="text-left py-3 border-b border-[#F5F5F5] text-[14px] text-[#222222] bg-transparent border-x-0 border-t-0 cursor-pointer"
                >
                  {areaName}
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

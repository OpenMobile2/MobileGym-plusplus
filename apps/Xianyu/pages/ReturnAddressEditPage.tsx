import React, { useState } from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';

const REGION_PRESETS = [
  '上海市 上海市 浦东新区',
  '北京市 北京市 朝阳区',
  '广东省 深圳市 南山区',
  '浙江省 杭州市 西湖区',
  '江苏省 南京市 玄武区',
];

export default function ReturnAddressEditPage() {
  const { bindTap, go } = useXianyuGestures();
  const saveReturnAddress = useXianyuStore((s) => s.saveReturnAddress);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="新增退货地址" />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="ReturnAddressEditPage-main"
        data-scroll-direction="vertical"
      >
        <div className="bg-white mt-3">
          {/* 姓名 */}
          <div className="flex items-center px-4 h-12 border-b border-[#F4F4F4]">
            <span className="w-20 text-[14px] text-[#666] shrink-0">退货人</span>
            <input
              {...bindTap({ kind: 'action', id: 'returnAddr.name.input' }, { onTrigger: () => {} })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请填写退货人姓名"
              className="flex-1 text-[14px] text-[#111] bg-transparent border-none outline-none"
            />
          </div>
          {/* 手机 */}
          <div className="flex items-center px-4 h-12 border-b border-[#F4F4F4]">
            <span className="w-20 text-[14px] text-[#666] shrink-0">手机号码</span>
            <input
              {...bindTap({ kind: 'action', id: 'returnAddr.phone.input' }, { onTrigger: () => {} })}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              placeholder="请填写手机号"
              className="flex-1 text-[14px] text-[#111] bg-transparent border-none outline-none"
            />
          </div>
          {/* 详细地址 */}
          <div className="flex items-center px-4 h-12">
            <span className="w-20 text-[14px] text-[#666] shrink-0">详细地址</span>
            <input
              {...bindTap({ kind: 'action', id: 'returnAddr.detail.input' }, { onTrigger: () => {} })}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="街道/楼牌号等"
              className="flex-1 text-[14px] text-[#111] bg-transparent border-none outline-none"
            />
          </div>
        </div>

        {/* 所在地区 */}
        <div className="bg-white mt-3 px-4 py-3">
          <div className="flex items-center">
            <span className="w-20 text-[14px] text-[#666] shrink-0">所在地区</span>
            <span className={`text-[14px] ${region ? 'text-[#111]' : 'text-[#999]'}`}>
              {region ? region : '请选择省市区'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {REGION_PRESETS.map((r) => (
              <button
                key={r}
                {...bindTap(
                  { kind: 'action', id: 'returnAddr.region.select.target' },
                  { params: { target: r }, onTrigger: () => setRegion(r) },
                )}
                className={`text-[12px] px-3 py-1.5 rounded-full border cursor-pointer ${
                  region === r ? 'border-[#FF3B30] text-[#FF3B30] bg-[#FFF3F0]' : 'border-[#EEE] text-[#666] bg-white'
                }`}
              >
                {r.replace(/ /g, '')}
              </button>
            ))}
          </div>
        </div>

        {/* 默认开关 */}
        <div className="bg-white mt-3 px-4 h-12 flex items-center justify-between">
          <span className="text-[14px] text-[#111]">设为默认退货地址</span>
          <button
            {...bindTap(
              { kind: 'action', id: 'returnAddr.default.toggle' },
              { onTrigger: () => setIsDefault((v) => !v) },
            )}
            aria-label="设为默认退货地址"
            className={`w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer ${isDefault ? 'bg-[#1CB854]' : 'bg-[#DDD]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isDefault ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* 保存 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-4 py-2">
        <button
          {...bindTap('returnAddr.save-commit', {
            onTrigger: () => {
              saveReturnAddress({ name, phone, region, detail, isDefault });
              go('returnAddr.save-commit');
            },
          })}
          className="w-full h-11 rounded-full bg-[#FFE411] text-[#111] text-[15px] font-semibold border-none cursor-pointer"
        >
          保存
        </button>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 标准寄运费报价表(spec ship.pricing,a164;用户拍板:长表简化为代表性 10 区) */
const ROWS: Array<[string, number, number, string]> = [
  ['1区', 7, 7.5, '南京市、杭州市、上海市'],
  ['2区', 7, 9, '江苏省、浙江省、安徽省'],
  ['3区', 7.5, 9.5, '上海、山东省'],
  ['4区', 8, 10, '北京、天津、河北省'],
  ['5区', 8.5, 10.5, '福建省、江西省、湖北省'],
  ['6区', 9, 11, '湖南省、河南省、广东省'],
  ['7区', 10, 12, '四川省、重庆、陕西省'],
  ['8区', 10.5, 13, '贵州省、云南省、广西壮族自治区'],
  ['9区', 11.5, 14, '辽宁省、吉林省、黑龙江省'],
  ['10区', 13.5, 16.5, '新疆、西藏、青海省等偏远地区'],
];

export default function PricingPage() {
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const showToast = useCainiaoStore((s) => s.showToast);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  useEffect(() => {
    setTemp({ pricingViewed: true });
  }, [setTemp]);

  return (
    <div className="flex h-full flex-col bg-[#1668DC]" data-status-bar-foreground="light">
      <TopBar title="标准寄运费报价表" dark transparent />
      <div className="min-h-0 flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 pb-4 pt-2 text-white">
          <div className="text-[22px] font-extrabold">寄越多, 省越多</div>
        </div>
        <div className="mx-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="flex items-center text-[13px]">
            <span className="text-(--app-c-text-secondary)">寄件地 江苏省南京市</span>
            <button
              {...action('ship.pricing.region.wontfixToast', () => showToast(t('common.notOpen')))}
              className="ml-auto cursor-pointer rounded-full border border-(--app-c-brand)/40 bg-(--app-c-brand-soft) px-3 py-1 text-[12px] text-(--app-c-brand)"
            >
              收件区域切换 ∨
            </button>
          </div>
          <div className="mt-3 text-[12px] leading-5 text-(--app-c-text-muted)">
            报价规则说明: 1.表内为预约上门标准寄价格,首重1kg;2.续重每kg加收2元,不足1kg按1kg计;
            3.取消预约不收费用;4.多单同寄享折扣(再下1单更优惠);5.最终以下单页实际报价为准。
          </div>
          <table className="mt-3 w-full border-collapse text-center text-[13px]">
            <thead>
              <tr className="bg-(--app-c-brand-soft) text-(--app-c-brand)">
                <th className="border border-[#E8EEF7] py-2 font-semibold">收件区域</th>
                <th className="border border-[#E8EEF7] py-2 font-semibold">0-1KG</th>
                <th className="border border-[#E8EEF7] py-2 font-semibold">2KG</th>
                <th className="border border-[#E8EEF7] py-2 font-semibold">3单以上</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([zone, p1, p2]) => (
                <tr key={zone} className="text-(--app-c-text-primary)">
                  <td className="border border-[#E8EEF7] py-2 text-(--app-c-brand)">{zone}</td>
                  <td className="border border-[#E8EEF7] py-2">{p1}元</td>
                  <td className="border border-[#E8EEF7] py-2">{p2}元</td>
                  <td className="border border-[#E8EEF7] py-2">{Math.round((p1 - 0.9) * 10) / 10}元/单</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-[13px] font-semibold text-(--app-c-text-primary)">区域对照(节选)</div>
          {ROWS.map(([zone, , , cities]) => (
            <div key={zone} className="mt-1.5 flex text-[12px] leading-5">
              <span className="w-10 shrink-0 text-(--app-c-brand)">{zone}</span>
              <span className="text-(--app-c-text-secondary)">{cities}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

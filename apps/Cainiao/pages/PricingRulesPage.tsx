import React, { useEffect } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { useCainiaoStore } from '../state';

/** 运费计费规则(spec ship.pricing.rules,a166):静态图文 */
export default function PricingRulesPage() {
  const { isDark } = useDarkMode();
  const setTemp = useCainiaoStore((s) => s.setTemp);
  useEffect(() => {
    setTemp({ pricingRulesViewed: true });
  }, [setTemp]);
  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="菜鸟裹裹快递运费计费规则" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-4 flex gap-2 rounded-xl bg-(--app-c-chip-bg) p-4 text-center">
          {[['又小又轻', '按重量计费'], ['又大又轻', '按体积计费'], ['又大又重', '重量体积取高计费']].map(([a, b]) => (
            <div key={a} className="flex-1">
              <div className="mx-auto mb-2 h-12 w-12 rounded-lg bg-gradient-to-br from-[#C9DEFB] to-(--app-c-header-to)" />
              <div className="text-[14px] font-semibold text-(--app-c-text-primary)">{a}</div>
              <div className="text-[11px] text-(--app-c-text-muted)">{b}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-5 text-[17px] font-bold text-(--app-c-text-primary)">一、重量计费方式:</h2>
        <p className="mt-2 text-[14px] leading-6 text-(--app-c-text-primary)">
          快递计费重量取实际称重重量和体积换算的重量两者的较大值来计算运费, 因此分为按体积计费或按重量计费。
        </p>
        <p className="mt-2 text-[14px] leading-6 text-(--app-c-text-primary)">
          1. 按体积计费<br />
          <span className="text-[#1668DC]">体积重量=长×宽×高(cm)÷计抛比</span>, 其中德邦、京东计抛比8000、壹米滴答70KG以内计抛比8000(壹米滴答70KG以上计抛比6000)。
        </p>
        <p className="mt-2 text-[14px] leading-6 text-(--app-c-text-primary)">
          2. 按重量计费<br />
          当实际重量大于体积换算重量时, 按照实际重量计费。
        </p>
        <p className="mt-2 text-[13px] leading-6 text-(--app-c-text-muted)">
          说明: 因体积较大或不规则包装的快递相对体积小的快递占用空间较多, 且需要额外投入人员及资源以保证包裹完整、安全,
          配送成本相对普通快递高, 因此结合以上情况及参考行业规则, 托寄物的计费重量取体积重量与实际重量较大值。
        </p>
        <h2 className="mt-5 text-[17px] font-bold text-(--app-c-text-primary)">二、运费说明</h2>
        <ol className="mt-2 list-decimal pl-5 text-[14px] leading-6 text-(--app-c-text-primary)">
          <li>
            线上「寄件」及「退货」服务, 即2小时上门服务, 按照寄-收线路的首重价(1kg内为首重)+续重
            (超过1kg的部分算续重, 超出部分不足1kg按照1kg算)费用计算, 不同城市首重/续重费用不同哦;
          </li>
          <li className="mt-1">
            线上「特惠大件」服务, 按照寄-收线路的首重价(3kg以内为首重)+续重(超过3kg部分算续重,
            超出部分不足1kg按照1kg算), 不同城市首重/续重费用不同哦;
          </li>
          <li className="mt-1">
            线上「批量寄件」服务, 根据不同收货地址, 分别计算寄-收路线的费用, 总费用为多个收件地址对应的快递运费加总。
          </li>
        </ol>
      </div>
    </div>
  );
}

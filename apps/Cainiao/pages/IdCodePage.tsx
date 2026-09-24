import React, { useState } from 'react';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import * as TimeService from '../../../os/TimeService';
import { useI18n } from '../i18n';

/** 身份码/出库码(spec me.idcode,s146):点击条形码仅刷新编码(Q18:B) */
export default function IdCodePage() {
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const user = useCainiaoStore((s) => s.user);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));
  const [code, setCode] = useState(user.idCode);

  const mask = `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-(--app-c-header-from) via-[#4EA3FA] to-[#8FD9A8]" data-status-bar-foreground="light">
      <TopBar
        title="身份码"
        dark
        transparent
        right={
          <button {...action('me.idcode.more.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent text-[18px] text-white">
            ⋯
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 条码卡 */}
        <button
          {...action('me.idcode.refresh', () => {
            // 刷新编码尾段(模拟)
            const tail = TimeService.now().toString(36).slice(-4).toUpperCase();
            setCode(`${user.idCode.slice(0, -4)}${tail}`);
            showToast('已刷新');
          })}
          className="mt-2 block w-full cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) px-4 pb-5 pt-6 text-center"
        >
          <div className="text-[24px] font-extrabold tracking-wide text-[#1A2A44]">{mask}</div>
          <div className="mt-2 inline-block rounded-full bg-(--app-c-page-bg) px-3 py-1 text-[12px] text-(--app-c-text-primary)">✅ 已认证</div>
          {/* 条形码(SVG 模拟,宽度序列由编码字符生成——确定性,非随机) */}
          <svg viewBox="0 0 232 72" className="mx-auto mt-4 h-20 w-full">
            {(() => {
              const bars: React.ReactNode[] = [];
              let x = 4;
              for (let i = 0; i < code.length * 3 && x < 226; i += 1) {
                const ch = code.charCodeAt(i % code.length);
                const w = 1 + ((ch + i * 7) % 4);
                if (i % 2 === 0) bars.push(<rect key={i} x={x} y={0} width={w} height={72} fill="#111" />);
                x += w + 1;
              }
              return bars;
            })()}
          </svg>
          <div className="mt-3 text-[15px] font-semibold tracking-wider text-(--app-c-text-primary)">{code}</div>
          <div className="mt-1 text-[13px] text-(--app-c-text-muted)">点击可放大刷新</div>
        </button>

        {/* 添加亲友 */}
        <div className="mt-4 rounded-2xl bg-(--app-c-card-bg) p-4">
          <div className="flex items-center">
            <span className="text-[15px] text-(--app-c-text-primary)">添加亲友, 相互代取更方便</span>
            <button
              {...action('me.idcode.family.wontfixToast', wontfix)}
              className="ml-auto cursor-pointer rounded-full border-none bg-(--app-c-brand) px-4 py-1.5 text-[13px] font-semibold text-white"
            >
              去添加
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-14 w-14 rounded-full bg-(--app-c-brand-soft) object-contain" />
            <span className="text-[18px] text-(--app-c-brand)">🔗</span>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8EDF4] text-[24px] text-[#B9C4D3]">👤</span>
          </div>
        </div>
      </div>
      <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="mx-auto mb-2 h-24 w-24 shrink-0 object-contain" />
    </div>
  );
}

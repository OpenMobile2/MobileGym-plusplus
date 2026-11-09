import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

/** 亲友代付 —— 证据 n29、n30、n31(hero+双tab+扫码开通/我的二维码)。 */
export default function FamilyPayPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const familyTab = useDidiStore((s) => s.familyTab);
  const setFamilyTab = useDidiStore((s) => s.setFamilyTab);

  const [qrOpen, setQrOpen] = React.useState(false);

  const tabBind = (tab: 'iPay' | 'payMe') =>
    bindTap(
      { kind: 'action', id: 'family.pay.tab' },
      {
        onTrigger: () => {
          setFamilyTab(tab);
          if (tab === 'iPay') setQrOpen(false);
        },
        params: { tab },
      },
    );

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg,#DCE8FB 0%,#EDF3FC 40%,#F5F6FA 100%)' }}
      data-status-bar-foreground="dark"
    >
      <TopBar title="亲友代付" transparent />
      <div
        className="flex-1 overflow-y-auto px-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ① hero */}
        <div className="pt-4 pb-5">
          <div className="text-[24px] font-black">
            <span style={{ color: '#2B3A67' }}>一份信任 </span>
            <span style={{ color: C.orangeDeep }}>十分安心</span>
          </div>
          <div className="text-[13px] mt-2 leading-relaxed" style={{ color: '#5B6B8C' }}>
            开通免密支付后,扫描亲友“TA为我代付”中的二维码,帮助亲友付车费
          </div>
        </div>

        {/* ② tabs 卡 */}
        <div className="rounded-2xl overflow-hidden bg-white/80">
          <div className="flex">
            <button
              {...tabBind('iPay')}
              className="flex-1 py-3.5 border-none text-[15px]"
              style={{
                background: familyTab === 'iPay' ? '#FFFFFF' : 'transparent',
                color: familyTab === 'iPay' ? '#1A1A1A' : '#7A869C',
                fontWeight: familyTab === 'iPay' ? 700 : 400,
              }}
            >
              我为TA代付 (0)
            </button>
            <button
              {...tabBind('payMe')}
              className="flex-1 py-3.5 border-none text-[15px]"
              style={{
                background: familyTab === 'payMe' ? '#FFFFFF' : 'transparent',
                color: familyTab === 'payMe' ? '#1A1A1A' : '#7A869C',
                fontWeight: familyTab === 'payMe' ? 700 : 400,
              }}
            >
              TA为我代付 (0)
            </button>
          </div>
          <div className="bg-white px-5 pt-6 pb-5">
            {familyTab === 'iPay' ? (
              <button
                onClick={() => toast('扫码暂未开放')}
                className="w-full py-3.5 rounded-full border-none text-white text-[17px] font-semibold"
                style={{ background: `linear-gradient(90deg,${C.orangeDeep},#FF9E6B)` }}
              >
                🔲 扫码为TA开通
              </button>
            ) : (
              <button
                {...bindTap(
                  { kind: 'action', id: 'family.pay.qr' },
                  { onTrigger: () => setQrOpen(true) },
                )}
                className="w-full py-3.5 rounded-full border-none text-white text-[17px] font-semibold"
                style={{ background: `linear-gradient(90deg,${C.orangeDeep},#FF9E6B)` }}
              >
                我的二维码
              </button>
            )}
            <button
          onClick={() => toast('亲友代付记录暂未开放')}
              className="w-full bg-transparent border-none text-center text-[13px] text-app-text-muted mt-4"
            >
              查看亲友代付记录 ›
            </button>
          </div>
        </div>

        {/* ③ 我的二维码卡(本地展开) */}
        {familyTab === 'payMe' && qrOpen && (
          <div className="mt-4 rounded-2xl bg-white px-5 py-5 relative">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-3 right-3 bg-transparent border-none text-[16px] text-app-text-muted"
              aria-label="收起"
            >
              ✕
            </button>
            <div className="text-[15px] font-bold text-app-text text-center">TA为我付二维码</div>
            <div className="flex justify-center my-4">
              <QrPlaceholder />
            </div>
            <div className="text-[12px] text-app-text-muted text-center leading-relaxed">
              如果亲友想为您垫付车费,请让 TA 使用滴滴扫一扫此二维码,开通后您打车 TA 付钱
            </div>
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}

/** SVG 方块阵二维码占位 */
function QrPlaceholder() {
  const cells: React.ReactNode[] = [];
  // 固定伪随机图案(确定性,不依赖时间/随机源)
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if ((x * 7 + y * 5 + ((x * y) % 4)) % 3 === 0) {
        cells.push(<rect key={`${x}-${y}`} x={x * 12} y={y * 12} width="10" height="10" fill="#1A1A1A" />);
      }
    }
  }
  return (
    <svg width="144" height="144" viewBox="0 0 144 144" className="rounded">
      <rect width="144" height="144" fill="#FFFFFF" />
      {cells}
      <rect x="0" y="0" width="34" height="34" fill="none" stroke="#1A1A1A" strokeWidth="6" />
      <rect x="110" y="0" width="34" height="34" fill="none" stroke="#1A1A1A" strokeWidth="6" />
      <rect x="0" y="110" width="34" height="34" fill="none" stroke="#1A1A1A" strokeWidth="6" />
    </svg>
  );
}

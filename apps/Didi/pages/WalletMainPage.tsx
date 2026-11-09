import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

/** 我的钱包 —— 证据 n13(顶部统计+资产概览+金融服务网格+借钱/车抵贷大卡+底部浮条)。 */

const SERVICES = ['借钱', '天天领现金', '车险', '信用卡', '滴滴支付', '开发票', '全部'];

export default function WalletMainPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const user = useDidiStore((s) => s.user);
  const setInvoiceSelected = useDidiStore((s) => s.setInvoiceSelected);

  const stub = (name: string) =>
    bindTap(
      { kind: 'action', id: 'wallet.main.stub' },
    { onTrigger: () => toast(`${name}暂未开放`), params: { name } },
    );

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title="我的钱包"
        right={
          <button
            {...bindTap('pay.settings.open')}
            className="bg-transparent border-none text-[13px] text-app-text whitespace-nowrap pr-2"
          >
            支付设置
          </button>
        }
      />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-3 pt-3 pb-4 flex flex-col gap-3">
          {/* ① 顶部三统计 */}
          <div
            className="rounded-xl px-4 py-4 flex text-white"
            style={{ background: `linear-gradient(135deg,${C.orangeDeep},${C.orange})` }}
          >
            <button
              {...bindTap('coupons.fromWallet')}
              className="flex-1 flex flex-col items-center bg-transparent border-none p-0 text-white"
            >
              <span className="text-[19px] font-bold">{user.couponCount}</span>
              <span className="text-[12px] opacity-90 mt-0.5">优惠券</span>
            </button>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[19px] font-bold">{user.tripCardCount}</span>
              <span className="text-[12px] opacity-90 mt-0.5">出行卡</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[19px] font-bold">{user.balance}</span>
              <span className="text-[12px] opacity-90 mt-0.5">余额(元)</span>
            </div>
          </div>

          {/* ② 资产概览 */}
          <div className="bg-app-surface rounded-xl px-4 py-3">
            <div className="text-[15px] font-semibold text-app-text mb-2.5">资产概览 👁</div>
            <div className="grid grid-cols-4">
              {[
                { v: '0.00', k: '余额(元)' },
                { v: '200,000', k: '借钱额度' },
                { v: '****', k: '银行卡' },
                { v: '100,000', k: '保障金' },
              ].map((c) => (
                <button
                  key={c.k}
                  {...stub(c.k)}
                  className="flex flex-col items-center bg-transparent border-none p-0"
                >
                  <span className="text-[15px] font-bold text-app-text">{c.v}</span>
                  <span className="text-[11px] text-app-text-muted mt-0.5">{c.k}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ③ 服务网格 */}
          <div className="bg-app-surface rounded-xl px-2 py-3 grid grid-cols-4 gap-y-4">
            {SERVICES.map((name) =>
              name === '开发票' ? (
                <button
                  key={name}
                  {...bindTap('invoice.fromWallet', { beforeTrigger: () => setInvoiceSelected([]) })}
                  className="flex flex-col items-center bg-transparent border-none p-0"
                >
                  <ServiceIcon ch="票" />
                  <span className="text-[12px] text-app-text mt-1">{name}</span>
                </button>
              ) : (
                <button
                  key={name}
                  {...stub(name)}
                  className="flex flex-col items-center bg-transparent border-none p-0"
                >
                  <ServiceIcon ch={name.slice(0, 1)} />
                  <span className="text-[12px] text-app-text mt-1">{name}</span>
                </button>
              ),
            )}
          </div>

          {/* ④ 借钱大卡 */}
          <div
            className="rounded-xl px-4 py-4"
            style={{ background: 'linear-gradient(135deg,#EAF3FF,#F7FAFF)' }}
          >
            <div className="text-[16px] font-bold text-app-text">借钱</div>
            <div className="flex items-end mt-1">
              <div className="flex-1">
                <div className="text-[12px] text-app-text-muted">预估可借(元)</div>
                <div className="text-[30px] font-black text-app-text leading-tight">200,000</div>
                <div className="text-[11px] text-app-text-muted mt-1">
                  ✓极速放款 ✓按日计息 ✓随借随还
                </div>
              </div>
              <button
                {...stub('借钱去使用')}
                className="border-none text-white text-[15px] font-medium rounded-full px-6 py-2"
                style={{ background: C.orange }}
              >
                去使用
              </button>
            </div>
          </div>

          {/* ⑤ 车抵贷卡 */}
          <div className="bg-app-surface rounded-xl px-4 py-4 flex items-center">
            <div className="flex-1">
              <div className="text-[16px] font-bold text-app-text">
                车抵贷 <span style={{ color: C.orangeDeep }}>最高100万</span>
              </div>
              <div className="text-[11px] text-app-text-muted mt-1">
                钱到账车照开 | 最快当日放款 | 最长分期4年
              </div>
            </div>
            <button
              {...stub('车抵贷去申请')}
              className="border-none text-white text-[14px] rounded-full px-5 py-2 shrink-0"
              style={{ background: C.orange }}
            >
              去申请
            </button>
          </div>

          {/* ⑥ 优惠专区(装饰) */}
          <div className="text-[15px] font-semibold text-app-text px-1">优惠专区</div>
          <button
            onClick={() => toast('该功能暂未开放')}
            className="rounded-xl px-4 py-4 text-white text-left border-none"
            style={{ background: 'linear-gradient(90deg,#4E6BF0,#7A8DF5)' }}
          >
            <span className="text-[14px] font-semibold">单单返现</span>
            <span className="text-[12px] opacity-90 ml-3">已获得: 0.00元 | 待领取: 85.08元 ›</span>
          </button>
        </div>
      </div>

      {/* 底部浮条(flex 布局,非 fixed) */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center rounded-full px-4 py-2.5 bg-black/85 text-white">
          <span className="flex-1 text-[13px]">预估可借额度 <b>66800</b> 元 · 新客专享</span>
          <button
            {...stub('去借钱')}
            className="border-none text-white text-[13px] rounded-full px-4 py-1.5"
            style={{ background: C.orange }}
          >
            去借钱
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceIcon({ ch }: { ch: string }) {
  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
      style={{ background: '#FFF3EA', color: C.orangeDeep }}
    >
      {ch}
    </span>
  );
}

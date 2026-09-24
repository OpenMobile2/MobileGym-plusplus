import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { Img, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 下单链之下最近的 Tab 根(Tab 之间是 replace,'/' 未必还在栈里) */
const TAB_ROOTS = ['/', '/movie', '/show', '/fun', '/me'] as const;

/** 出票中/支付成功过渡页(qa:Q5=A;inferred,视觉按 design-tokens 外推) */
export default function PaySuccessPage() {
  const statusFg = useStatusBarFg();
  const { bindTap, go } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const order = useMaoyanStore((st) => st.orders.find((o) => o.id === st.lastOrderId));
  const [issued, setIssued] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setIssued(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col h-full bg-app-surface items-center" data-status-bar-foreground={statusFg}>
      <div className="mt-16 w-16 h-16 rounded-full flex items-center justify-center text-white text-[32px]" style={{ background: '#34B96F' }}>
        ✓
      </div>
      <div className="mt-4 text-[18px] font-bold text-app-text">{issued ? s.paySuccess : `${s.ticketing}…`}</div>
      {order && (
        <div className="mt-6 mx-6 w-[80%] bg-app-bg rounded-xl p-3 flex gap-3">
          <Img src={order.poster} className="w-12 h-16 object-cover rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-app-text truncate">{order.title}</div>
            <div className="text-[11px] text-app-text-muted mt-1">{order.sessionDesc}</div>
            <div className="text-[11px] text-app-text-muted mt-0.5 truncate">{order.cinemaOrVenue}</div>
            {order.hallSeats && <div className="text-[11px] text-app-text-muted mt-0.5">{order.hallSeats}</div>}
            {order.tierDesc && <div className="text-[11px] text-app-text-muted mt-0.5">{order.tierDesc}</div>}
          </div>
        </div>
      )}
      {order ? (
        <button
          {...bindTap('paysuccess.order-open', {
            params: { id: order.id },
            // popTo Tab 根:收起「选座→确认订单→收银台」历史,返回时回到 Tab 页而非失效的下单页
            //(Tab 切换是 replace,'/' 可能已被覆盖,故按序给出全部 Tab 根候选)
            // mode 必须覆盖成 push:声明里是 replace,popTo 之后 replace 会把 Tab 根本身顶掉,
            // 栈里只剩订单页,左上角返回就没地方可回(走查抓获)。
            onTrigger: () => go('paysuccess.order-open', { id: order.id }, { popTo: TAB_ROOTS, mode: 'push' }),
          })}
          className="mt-8 h-11 px-10 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {issued ? s.viewOrder : `${s.ticketing}…`}
        </button>
      ) : (
        // 兜底:订单未生成(重复支付/草稿失效)也必须留出口,不能卡在出票中
        <button
          {...bindTap('paysuccess.orders-open')}
          className="mt-8 h-11 px-10 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.viewMyOrders}
        </button>
      )}
      <button
        {...bindTap('paysuccess.home-open', { onTrigger: () => go('paysuccess.home-open', {}, { popTo: TAB_ROOTS }) })}
        className="mt-3 h-9 px-8 rounded-full text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer"
      >
        {s.goHome}
      </button>
    </div>
  );
}

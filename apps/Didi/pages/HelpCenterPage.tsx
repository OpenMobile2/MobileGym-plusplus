import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

/** 滴滴客服 —— 证据 recG:智能客服会话(快捷入口+订单卡+chips+选择订单弹层) */

const QUICK = ['失物寻找', '查询订单', '我要叫车', '开发票', '修改手机号'];

type Bubble = { from: 'bot' | 'me'; text: string };

export default function HelpCenterPage() {
  const { bindTap } = useDidiGestures();
  const orders = useDidiStore((s) => s.orders);
  const helpFaqs = useDidiStore((s) => s.helpFaqs);
  const openFaq = useDidiStore((s) => s.openFaq);
  const currentOrderId = useDidiStore((s) => s.currentOrderId);
  const setCurrentOrderId = useDidiStore((s) => s.setCurrentOrderId);
  const [bubbles, setBubbles] = React.useState<Bubble[]>([
    { from: 'bot', text: '您好,智能客服为您服务' },
  ]);
  const [orderPicker, setOrderPicker] = React.useState(false);
  const [faqPicker, setFaqPicker] = React.useState(false);
  const [text, setText] = React.useState('');

  const order = orders.find((o) => o.id === currentOrderId) ?? orders[0];
  const bot = (t: string) => setBubbles((b) => [...b, { from: 'bot', text: t }]);
  const me = (t: string) => setBubbles((b) => [...b, { from: 'me', text: t }]);

  return (
    <div className="relative flex flex-col h-full" style={{ background: '#FFF7F2' }} data-status-bar-foreground="dark">
      <TopBar title="滴滴客服" transparent />

      {/* 顶部快捷入口 */}
      <div className="flex px-3 pt-1 pb-2 gap-3 shrink-0 overflow-x-auto">
        {QUICK.map((q) => (
          <button
            key={q}
            {...bindTap({ kind: 'action', id: 'help.center.quick' }, {
              onTrigger: () => { me(q); bot(q === '查询订单' ? '已为您找到最近订单,请在下方确认。' : `「${q}」服务已受理(演示),如需人工请留言。`); },
            })}
            className="flex flex-col items-center gap-1 shrink-0 bg-transparent border-none"
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[15px]" style={{ background: C.orangeDeep }}>
              {q.slice(0, 1)}
            </span>
            <span className="text-[11px] text-app-text">{q}</span>
          </button>
        ))}
      </div>

      {/* 会话流 */}
      <div className="flex-1 overflow-y-auto px-3 py-2" data-scroll-container="main" data-scroll-direction="vertical">
        {bubbles.map((b, i) => (
          <div key={i} className={`flex mb-2.5 ${b.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] rounded-xl px-3 py-2 text-[14px] leading-relaxed"
              style={b.from === 'me'
                ? { background: C.orange, color: '#fff' }
                : { background: '#fff', color: C.dark }}
            >
              {b.text}
            </div>
          </div>
        ))}

        {/* 智能客服订单确认卡 */}
        {order && (
          <div className="bg-app-surface rounded-xl p-3.5 mb-2.5">
            <div className="text-[14px] text-app-text mb-2">您是否要咨询这笔订单的问题?</div>
            <div className="rounded-lg p-2.5 mb-2.5" style={{ background: '#FFF7F2' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] px-1.5 py-0.5 rounded text-white" style={{ background: C.orange }}>{order.carType}</span>
                <span className="text-[11px] text-app-text-muted ml-auto">{order.status === 'completed' ? '已完成' : '已取消'}</span>
              </div>
              <div className="text-[12px] text-app-text">起点:{order.from}</div>
              <div className="text-[12px] text-app-text">终点:{order.to}</div>
            </div>
            <div className="flex gap-2">
              <button
                {...bindTap({ kind: 'action', id: 'help.center.pickOrder' }, { onTrigger: () => setOrderPicker(true) })}
                className="flex-1 py-1.5 rounded-full text-[13px] bg-transparent border"
                style={{ borderColor: C.orange, color: C.orangeDeep }}
              >
                咨询其他订单
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'help.center.confirm' }, {
                  onTrigger: () => { me('是的'); bot('好的,已为您定位该订单。请问遇到了什么问题?可输入「费用」「发票」「失物」等关键词。'); },
                })}
                className="flex-1 py-1.5 rounded-full text-[13px] border-none text-white"
                style={{ background: C.orange }}
              >
                是的
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部 chips + 输入条 */}
      <div className="shrink-0 bg-app-surface pt-2">
        <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
          <button
            {...bindTap({ kind: 'action', id: 'help.center.pickOrder' }, { onTrigger: () => setOrderPicker(true) })}
            className="shrink-0 text-[12px] px-2.5 py-1 rounded-full border border-app-border bg-transparent text-app-text"
          >
            切换订单|业务
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'help.center.pickFaq' }, { onTrigger: () => setFaqPicker(true) })}
            className="shrink-0 text-[12px] px-2.5 py-1 rounded-full border border-app-border bg-transparent text-app-text"
          >
            非订单相关问题
          </button>
          <button {...bindTap('pay.fromHelp')} className="shrink-0 text-[12px] px-2.5 py-1 rounded-full border border-app-border bg-transparent text-app-text">
            支付设置
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2" data-keep-keyboard="true">
          <input
            data-action="help.center.input"
            data-action-type="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请描述您遇到的问题…"
            className="flex-1 h-9 rounded-full px-4 text-[14px] text-app-text outline-none border border-app-border"
            style={{ background: '#F5F6FA' }}
            data-keep-keyboard="true"
          />
          <button
            {...bindTap({ kind: 'action', id: 'help.center.send' }, {
              onTrigger: () => {
                const t = text.trim();
                if (!t) return;
                me(t);
                bot(t.includes('费用') ? '费用问题可在订单详情-费用明细中核对,如不认可可提交「不认可车费」。'
                  : t.includes('发票') ? '开发票请到 行程-开发票,勾选行程后填写抬头提交即可。'
                  : t.includes('失物') ? '已为您登记失物寻找,客服将联系司机后回复您(演示)。'
                  : '已收到,智能客服正在为您处理(演示)。如需更多帮助可点击上方快捷入口。');
                setText('');
              },
            })}
            className="shrink-0 h-9 px-4 rounded-full text-white text-[14px] border-none"
            style={{ background: C.orange }}
            data-keep-keyboard="true"
          >
            发送
          </button>
        </div>
      </div>

      {/* 选择订单弹层(recG) */}
      {orderPicker && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-app-surface rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center px-4 py-3 border-b border-app-border shrink-0">
              <span className="flex-1 text-[15px] font-semibold text-app-text">选择订单</span>
              <span className="text-[13px] text-app-text-muted mr-3">选择业务类型</span>
              <button onClick={() => setOrderPicker(false)} className="bg-transparent border-none text-app-text-muted text-[15px]">✕</button>
            </div>
            <div className="overflow-y-auto p-3">
              {orders.slice(0, 5).map((o) => (
                <button
                  key={o.id}
                  {...bindTap(
                    { kind: 'action', id: 'help.center.pickOrder' },
                    {
                      params: { value: o.id },
                      onTrigger: () => { setCurrentOrderId(o.id); setOrderPicker(false); },
                    },
                  )}
                  className="w-full text-left rounded-xl border border-app-border p-3 mb-2 bg-transparent"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] px-1.5 py-0.5 rounded text-white" style={{ background: C.orange }}>{o.carType}</span>
                    <span className="text-[12px] text-app-text-muted ml-auto">¥{o.fare.toFixed(2)}</span>
                  </div>
                  <div className="text-[12px] text-app-text truncate">起点:{o.from}</div>
                  <div className="text-[12px] text-app-text truncate">终点:{o.to}</div>
                </button>
              ))}
              <div className="text-center text-[12px] text-app-text-muted py-2">没有要咨询的订单</div>
            </div>
          </div>
        </div>
      )}

      {faqPicker && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-app-surface rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center px-4 py-3 border-b border-app-border shrink-0">
              <span className="flex-1 text-[15px] font-semibold text-app-text">常见问题</span>
              <button
                {...bindTap({ kind: 'action', id: 'help.center.pickFaq' }, { onTrigger: () => setFaqPicker(false) })}
                className="bg-transparent border-none text-app-text-muted text-[15px]"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              {helpFaqs.map((faq) => (
                <button
                  key={faq.id}
                  {...bindTap('help.detail.open', {
                    params: { value: faq.id },
                    beforeTrigger: () => { openFaq(faq.id); setFaqPicker(false); },
                  })}
                  className="w-full text-left rounded-xl border border-app-border p-3 mb-2 bg-transparent"
                >
                  <div className="text-[14px] text-app-text">{faq.q}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

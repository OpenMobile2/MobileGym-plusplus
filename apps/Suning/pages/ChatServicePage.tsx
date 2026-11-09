import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcGear, IcRobot, IcSmile, IcPlus, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { chatTitleOf, productOf } from '../utils/detail';

/**
 * 客服会话页(spec chat.service,s280)。**会话按 shopId 隔离**:标题/消息记录逐店独立
 * (store.chatSessions[shopId]),禁止全局单会话;无 productId 时不显示置顶商品条。
 */
export default function ChatServicePage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shopId') ?? '';
  const productId = searchParams.get('productId') ?? '';
  const product = productOf(productId);

  const showToast = useSuningStore((s) => s.showToast);
  const chatSessions = useSuningStore((s) => s.chatSessions);
  const sendChatText = useSuningStore((s) => s.sendChatText);
  const sendChatProduct = useSuningStore((s) => s.sendChatProduct);
  const wontfix = () => showToast(S.toastNotOpen);

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const cfg = SUNING_CONFIG.chatConfig.common;
  const messages = chatSessions[shopId] ?? [];

  // 新消息滚动到底(StrictMode 下幂等)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendChatText(shopId, text);
    setDraft('');
  };

  // 热门问题:单卡展示前 4 条(走查 0729:删第二列)
  const faqQuestions = cfg.hotQuestions.slice(0, 4);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 标题(按店铺类型)+ 设置齿轮 */}
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-[var(--app-text)]">
          {chatTitleOf(shopId)}
        </div>
        <button {...action('chat.service.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text-muted)]">
          <IcGear size={20} />
        </button>
      </div>

      {/* 置顶商品条(仅带 productId 的入口) */}
      {product && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
            <Img src={product.image} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-[var(--app-text)]">{product.title}</div>
            <div className="text-[14px] font-bold text-[var(--app-c-danger)]">¥{product.price}</div>
          </div>
          <button
            {...bindTap('chat.service.detail.open', { params: { productId: product.id } })}
            className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[13px] font-bold text-white"
          >
            {S.buy}
          </button>
        </div>
      )}

      {/* 消息流:系统条 / 机器人气泡 / 热门问题卡 / 快捷宫格 / 商品卡 / 会话消息 */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mx-auto max-w-[86%] rounded-lg bg-[#E6E6E6] px-2 py-1.5 text-center text-[11px] leading-4 text-[#777]">
          {cfg.systemNotice}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDE8D5] text-[var(--app-primary)]">
            <IcRobot size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--app-c-text-muted)]">
              {cfg.robotName} · {S.chatRobotTip}
            </div>
            <div className="mt-1 inline-block rounded-xl rounded-tl-sm bg-[var(--app-surface)] px-3 py-2 text-[13px] leading-5 text-[var(--app-text)]">
              {cfg.robotWelcome}
            </div>
          </div>
        </div>

        {/* 热门问题(单卡) */}
        <div className="mt-2 pl-10">
          <div className="rounded-xl bg-[var(--app-surface)] p-3">
            <div className="text-[13px] font-bold text-[var(--app-text)]">{S.hotQuestions}</div>
            {faqQuestions.map((q) => (
              <button
                key={q}
                {...action('chat.service.faq.send', () => sendChatText(shopId, q), { params: { value: q } })}
                className="mt-2 flex w-full cursor-pointer items-center gap-1 border-none border-t border-[var(--app-border)] bg-transparent pt-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#2B6BD4]">{q}</span>
                <IcChevronRight size={13} className="shrink-0 text-[var(--app-c-text-muted)]" />
              </button>
            ))}
          </div>
        </div>

        {/* 商品卡 + 「发送商品」 */}
        {product && (
          <div className="ml-10 mt-2 rounded-xl bg-[var(--app-surface)] p-3">
            <div className="flex gap-2">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                <Img src={product.image} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{product.title}</div>
                <div className="mt-1 text-[14px] font-bold text-[var(--app-c-danger)]">¥{product.price}</div>
              </div>
            </div>
            <button
              {...action('chat.service.productCard.send', () => sendChatProduct(shopId, product.id), {
                params: { productId: product.id },
              })}
              className="mt-2 w-full cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] py-1.5 text-[13px] font-bold text-[var(--app-primary)]"
            >
              {S.sendProduct}
            </button>
          </div>
        )}

        {/* 会话消息:用户右侧橙泡 / 机器人左侧白泡 */}
        {messages.map((m) => {
          const mine = m.role === 'user';
          const card = productOf(m.productId ?? '');
          return (
            <div key={m.id} className={`mt-3 flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  mine ? 'bg-[var(--app-c-chip-bg)]' : 'bg-[#FDE8D5] text-[var(--app-primary)]'
                }`}
              >
                {mine ? null : <IcRobot size={18} />}
              </div>
              {m.kind === 'product' && card ? (
                <div className="max-w-[74%] rounded-xl bg-[var(--app-surface)] p-2">
                  <div className="flex gap-2">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                      <Img src={card.image} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{card.title}</div>
                      <div className="text-[13px] font-bold text-[var(--app-c-danger)]">¥{card.price}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[74%] rounded-xl px-3 py-2 text-[13px] leading-5 ${
                    mine ? 'rounded-tr-sm bg-[var(--app-primary)] text-white' : 'rounded-tl-sm bg-[var(--app-surface)] text-[var(--app-text)]'
                  }`}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 底部:快捷 chips + 输入框(自由文本)+ 表情/加号 */}
      <div className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2" data-scroll-container="chips" data-scroll-direction="horizontal">
          {cfg.bottomChips.map((c) => (
            <button
              key={c}
              {...action('chat.service.quickChip.send', () => sendChatText(shopId, c), { params: { value: c } })}
              className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text-muted)]"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            data-action="chat.service.message.send"
            data-action-type="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send(draft);
            }}
            placeholder={S.chatPlaceholder}
            data-keep-keyboard="true"
            className="h-9 min-w-0 flex-1 rounded-full border-none bg-[var(--app-c-chip-bg)] px-3 text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
          />
          <button
            {...action('chat.service.wontfix.toast', wontfix)}
            data-keep-keyboard="true"
            className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#666]"
          >
            <IcSmile size={22} />
          </button>
          <button
            {...action('chat.service.wontfix.toast', wontfix)}
            data-keep-keyboard="true"
            className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#666]"
          >
            <IcPlus size={22} />
          </button>
          <button
            {...action('chat.service.message.send', () => send(draft))}
            data-keep-keyboard="true"
            className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-3 py-1.5 text-[13px] font-bold text-white"
          >
            {S.chatSendBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 可滑动的列表行外壳 —— 把「左滑露出 More/Flag/Trash」「右滑露出 Unread/Remind Me」「长按弹菜单」
 * 「点击进入」这四种手势的共存逻辑集中在一处，普通邮件行、分类聚合行、草稿行都套它。
 *
 * 对照 IMG_2182（左滑）、2183（右滑）、2186（长按）。
 *
 * 三种手势的分层：
 *   外层  onClickCapture 在刚拖动过/刚长按过时吞掉 click（否则会误进详情页）
 *   中层  滑动与长按的 pointer 处理器（长按自己计时，见下方说明）
 *   内层  调用方传进来的 tapBinding（独占 onClick，不与其它绑定同元素）
 */
import React, { useEffect, useRef, useState } from 'react';
import { useMailGestures } from '../hooks/useMailGestures';
import { useMailStore } from '../state';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { LAYOUT } from '../constants';
import { IcFlag, IcMarkRead, IcMore, IcSendLater, IcTrash, IcUnread } from '../res/icons';
import type { Mail } from '../types';

type PointerProps = React.HTMLAttributes<HTMLDivElement>;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const SwipeableRow: React.FC<{
  mail: Mail;
  mailboxId: string;
  /** 由调用方决定点击后去哪：邮件行→详情，草稿行→继续编辑 */
  tapBinding: React.ComponentPropsWithoutRef<'div'>;
  children: React.ReactNode;
}> = ({ mail, mailboxId, tapBinding, children }) => {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, go } = useMailGestures();
  const trashMails = useMailStore((st) => st.trashMails);
  const toggleFlag = useMailStore((st) => st.toggleFlag);
  const setRead = useMailStore((st) => st.setRead);

  const [offset, setOffsetState] = useState(0);
  /**
   * offset 的 ref 镜像。手势回调里必须读 ref 而不是 state：
   * 连续快速操作时 state 可能还没重渲染，闭包里拿到的是上一帧的旧值，
   * 会把「本次滑动的起点」算错，吸附判定跟着错。
   */
  const offsetRef = useRef(0);
  const setOffset = (v: number) => {
    offsetRef.current = v;
    setOffsetState(v);
  };
  const startXRef = useRef<number | null>(null);
  /**
   * 最后一次收到的指针 X。收尾时一律用它算吸附目标 —— 因为 `lostpointercapture`
   * 有可能在 `pointerup` 之前触发，那条路径上拿不到事件坐标，
   * 若因此跳过吸附，行就会停在拖动结束的位置（gate4 轮5 的成因）。
   */
  const lastXRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  /** 拖动中用 state 而非 ref：transition 要靠它切换，必须保证渲染时取值一致 */
  const [dragging, setDragging] = useState(false);
  const capturedRef = useRef(false);
  /** window 级 pointerup 兜底监听（capture 丢失时元素自身收不到 pointerup） */
  const winUpRef = useRef<((e: PointerEvent) => void) | null>(null);
  /** 本次手势已经构成拖动 → 吞掉紧随其后的 click。带超时兜底，避免卡住下一次真实点击 */
  const justDraggedRef = useRef(false);
  const clearTimerRef = useRef<number | undefined>(undefined);
  /**
   * 本次手势里长按是否应被忽略。一旦判定为拖动就置位，直到下一次按下才清零。
   * 长按的 400ms 定时器有可能在松手之后才到点，所以不能只看"是否正在拖动"。
   */
  const suppressLongPressRef = useRef(false);

  useEffect(() => {
    setOffset(0);
  }, [mailboxId]);

  useEffect(() => () => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    if (winUpRef.current) {
      window.removeEventListener('pointerup', winUpRef.current);
      window.removeEventListener('pointercancel', winUpRef.current);
    }
  }, []);

  const markDragged = () => {
    justDraggedRef.current = true;
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    // 若这次拖动之后并没有 click 事件到来（例如指针在行外松手），600ms 后自行解除，
    // 否则标志会一直挂着，把用户下一次真实点击也吞掉。
    clearTimerRef.current = window.setTimeout(() => {
      justDraggedRef.current = false;
    }, 600);
  };

  /**
   * 松手时的吸附目标。拖动过程中位移是跟手的，松手后一定落到
   * 「全收 0 / 左侧全开 / 右侧全开」三者之一，绝不停在中间。
   *
   * 判定基于「本次手势的净位移 dx」而非绝对位置：从关闭态滑出 swipeOpenThreshold
   * 就整组展开，已展开时往回滑 swipeCloseThreshold 就整组收回。
   */
  const targetFor = (dx: number): number => {
    const base = baseRef.current;
    const openedLeft = base <= -LAYOUT.swipeLeftWidth + 1;
    const openedRight = base >= LAYOUT.swipeRightWidth - 1;

    if (openedLeft) return dx >= LAYOUT.swipeCloseThreshold ? 0 : -LAYOUT.swipeLeftWidth;
    if (openedRight) return dx <= -LAYOUT.swipeCloseThreshold ? 0 : LAYOUT.swipeRightWidth;
    if (dx <= -LAYOUT.swipeOpenThreshold) return -LAYOUT.swipeLeftWidth;
    if (dx >= LAYOUT.swipeOpenThreshold) return LAYOUT.swipeRightWidth;
    return 0;
  };

  /**
   * 长按打开操作菜单 —— 自己管理计时，不用 bindLongPress。
   *
   * 原因：`useTriggerGestures` 的长按状态（含 `triggered` 标志）是按 trigger id
   * 全局共享的，而且定时器到点时会先把 `triggered` 置位再调 onTrigger。
   * 于是"拖动中越过 400ms 阈值"这种误触即便被我们在 onTrigger 里拦掉，
   * 标志也已经置位，它自带的 onClickCapture 会吞掉之后的第一次点击
   * （表现为点邮件进不了详情页），而且会串扰到其它行。
   *
   * data-trigger / data-trigger-type 属性照常输出，静态分析与轨迹合成不受影响。
   */
  const longPressTimerRef = useRef<number | undefined>(undefined);
  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  };
  const longPressAttrs = {
    'data-trigger': 'list.context.open',
    'data-trigger-type': 'longPress',
    'data-trigger-params': JSON.stringify({ mailboxId, mid: mail.id }),
  } as const;

  const detachWindowUp = () => {
    if (winUpRef.current) {
      window.removeEventListener('pointerup', winUpRef.current);
      window.removeEventListener('pointercancel', winUpRef.current);
      winUpRef.current = null;
    }
  };

  /**
   * 结束一次拖动：吸附到离散位置并清掉拖动状态。
   * 幂等，可被 pointerup / window 兜底 / lostpointercapture / pointercancel 任意一条先触发。
   * 收尾坐标优先用传入值，拿不到就退回 lastXRef，保证吸附一定会执行。
   */
  const finishDrag = (clientX?: number | null) => {
    detachWindowUp();
    clearLongPress();
    if (startXRef.current === null) return;
    const endX = clientX ?? lastXRef.current;
    if (capturedRef.current && endX !== null) {
      setOffset(targetFor(endX - startXRef.current));
    }
    setDragging(false);
    capturedRef.current = false;
    startXRef.current = null;
    lastXRef.current = null;
  };

  const swipeHandlers: PointerProps = {
    onPointerDown: (e) => {
      setDragging(true);
      capturedRef.current = false;
      suppressLongPressRef.current = false;
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      baseRef.current = offsetRef.current;
      // window 级兜底：pointer capture 若在重渲染中失效，元素自身收不到 pointerup，
      // 靠这个监听把拖动收尾，避免行一直跟着指针跑（gate4 轮3 #4）。
      // 注意不能用「pointermove 时 buttons===0」来判断松手 —— 触控板拖动中
      // buttons 可能瞬时为 0，那样会提前收尾、把行卡在中间位置。
      detachWindowUp();
      const handler = (ev: PointerEvent) => finishDrag(ev.clientX);
      winUpRef.current = handler;
      window.addEventListener('pointerup', handler);
      window.addEventListener('pointercancel', handler);

      clearLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = undefined;
        if (suppressLongPressRef.current) return;
        markDragged(); // 借用同一个标志吞掉长按后紧随的 click，避免顺带进详情页
        go('list.context.open', { mailboxId, mid: mail.id });
      }, LAYOUT.longPressMs);
    },
    onPointerMove: (e) => {
      if (startXRef.current === null) return;
      lastXRef.current = e.clientX;
      const dx = e.clientX - startXRef.current;
      if (!capturedRef.current && Math.abs(dx) >= LAYOUT.dragThreshold) {
        capturedRef.current = true;
        // 一旦判定为拖动就立刻置标志，不等 pointerup —— 大幅滑动时指针可能在行外松手，
        // 那种情况 pointerup 未必落在本元素上（gate4 轮1 #2 的成因）
        markDragged();
        // 抑制本次手势的长按：阈值 400ms，按住慢慢滑很容易越过它（gate4 轮2 #1）
        suppressLongPressRef.current = true;
        clearLongPress();
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }
      if (capturedRef.current) {
        setOffset(clamp(baseRef.current + dx, -LAYOUT.swipeLeftWidth, LAYOUT.swipeRightWidth));
      }
    },
    onPointerUp: (e) => {
      finishDrag(e.clientX);
    },
    onPointerCancel: () => {
      const wasDragging = capturedRef.current;
      if (wasDragging) markDragged();
      // 手势被中断（不是正常松手）→ 直接收回，不做吸附判定
      startXRef.current = null;
      lastXRef.current = null;
      capturedRef.current = false;
      setDragging(false);
      detachWindowUp();
      setOffset(0);
    },
    // 刻意不监听 lostpointercapture：拖动中每帧 setOffset 都会重渲染，
    // 捕获可能因此被释放并触发该事件，若在那里收尾就会在手指还没松开时
    // 提前定格，之后的移动全部失效（行卡在半开状态）。
    // 捕获丢失导致收不到 pointerup 的情况，由 pointerdown 时注册的 window 监听兜底。
  };

  const contentGestures = { ...longPressAttrs, ...swipeHandlers };
  const close = () => setOffset(0);
  const actionBtn = 'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] text-white';

  return (
    <div
      className="relative overflow-hidden bg-white"
      onClickCapture={(e) => {
        if (justDraggedRef.current) {
          justDraggedRef.current = false;
          if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {/* 左滑露出的三个按钮（贴右边） */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: LAYOUT.swipeLeftWidth }}>
        <button
          {...bindTap('list.context.open', { params: { mailboxId, mid: mail.id } })}
          className={actionBtn}
          style={{ background: C.swipeMore }}
        >
          <IcMore size={20} />
          {s.more}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'mail.row.flag' }, {
            params: { mailId: mail.id },
            onTrigger: () => {
              toggleFlag(mail.id);
              close();
            },
          })}
          className={actionBtn}
          style={{ background: C.swipeFlag }}
        >
          <IcFlag size={20} />
          {mail.isFlagged ? s.unflag : s.flag}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'mail.row.trash' }, {
            params: { mailId: mail.id },
            onTrigger: () => {
              trashMails([mail.id]);
              close();
            },
          })}
          className={actionBtn}
          style={{ background: C.swipeTrash }}
        >
          <IcTrash size={20} />
          {s.trash}
        </button>
      </div>

      {/* 右滑露出的两个按钮（贴左边） */}
      <div className="absolute inset-y-0 left-0 flex" style={{ width: LAYOUT.swipeRightWidth }}>
        <button
          {...bindTap({ kind: 'action', id: 'mail.row.toggleUnread' }, {
            params: { mailId: mail.id },
            onTrigger: () => {
              setRead([mail.id], !mail.isRead);
              close();
            },
          })}
          className={actionBtn}
          style={{ background: C.swipeUnread }}
        >
          {mail.isRead ? <IcUnread size={20} /> : <IcMarkRead size={20} />}
          {mail.isRead ? s.mark_unread : s.mark_read}
        </button>
        <button
          {...bindTap('list.remind.open', { params: { mailboxId, mid: mail.id } })}
          className={actionBtn}
          style={{ background: C.swipeRemind }}
        >
          <IcSendLater size={20} />
          {s.remind_me}
        </button>
      </div>

      {/* 可滑动的内容层 */}
      <div
        {...contentGestures}
        className="relative bg-white"
        style={{
          transform: `translateX(${offset}px)`,
          // 拖动中不加过渡（要跟手），松手后用 ease-out 吸附到位
          transition: dragging ? 'none' : 'transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          touchAction: 'pan-y',
        }}
      >
        <div
          {...tapBinding}
          className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left active:bg-black/[0.04]"
          data-mail-row={mail.id}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** 未读蓝点占位（无论哪种行都占同样宽度，保证左边缘对齐） */
export const UnreadDot: React.FC<{ unread: boolean }> = ({ unread }) => (
  <span className="mt-[18px] w-2 flex-shrink-0">
    {unread && <span className="block h-2 w-2 rounded-full" style={{ background: C.unreadDot }} />}
  </span>
);

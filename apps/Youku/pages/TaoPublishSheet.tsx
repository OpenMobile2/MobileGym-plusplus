import React, { useState } from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { JIESHUO_IDS, taoDraft } from '../components/feedShared';
import { IcAt, IcChevronRight, IcImage, IcSmile, IcWand } from '../components/feedIcons';

/**
 * spec 节点 taohaopian.publish.sheet(route /taohaopian/jieshuo/publish)—— 发布讨论输入面板(s195)。
 * push 覆盖页(半屏面板形态),面板外区域/关闭一律 bindBack(AGENTS 弹层合同)。
 * 草稿经 feedShared.taoDraft 与解说页共享(『标时间』预填;返回不清空,发送后清空);
 * 发送 → publishComment 上屏至讨论区评论列表顶部,back 回 discussion 态。
 * 装扮贴纸 / 表情·图片·GIF·@ 同组 wontfix(spec 拍板)。
 */
export default function TaoPublishSheet() {
  const { action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const showToast = useYoukuStore((s) => s.showToast);
  const publishComment = useYoukuStore((s) => s.publishComment);

  // 目标解说条目:解说页打开时写入 taoDraft.shortId;深链兜底取 feed 首条
  const shortId = taoDraft.shortId ?? JIESHUO_IDS[0];
  const [text, setText] = useState(taoDraft.text);

  const canSend = text.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    publishComment(shortId, text, { contentId: shortId });
    taoDraft.text = '';
    taoDraft.shortId = null;
    back();
  };

  return (
    <div
      className="relative flex h-full w-full flex-col bg-black/60 pt-10"
    >
      {/* 面板外区域:关闭 = back */}
      <div {...bindBack<HTMLDivElement>()} className="min-h-0 flex-1" />

      <div className="shrink-0 rounded-t-2xl bg-(--app-c-card-bg) px-3 pb-3 pt-4">
        {/* 标题行:发布讨论 + 装扮贴纸 >(wontfix) */}
        <div className="flex items-center">
          <span className="flex-1 text-[17px] font-bold text-(--app-c-text-primary)">{t('tao.publish.title')}</span>
          <button
            {...action('taohaopian.publish.sticker.wontfixToast', () => showToast(WONTFIX_TOAST))}
            className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[13px] text-[#CCCCCC]"
          >
            <IcWand size={16} className="text-[#0C7BFF]" />
            {t('tao.publish.sticker')}
            <IcChevronRight size={14} />
          </button>
        </div>

        {/* 多行输入框(占位:你的声音,也是内容的一部分) */}
        <textarea
          autoFocus
          data-action="taohaopian.publish.comment.input"
          data-action-type="input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            taoDraft.text = e.target.value;
          }}
          placeholder={t('tao.jieshuo.inputPlaceholder')}
          className="mt-3 h-36 w-full resize-none rounded-xl border-none bg-(--app-c-chip-bg) p-3 text-[15px] leading-[22px] text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
        />

        {/* 工具行:表情/图片/GIF/@(同组 wontfix)+ 发送 */}
        <div data-keep-keyboard="true" className="mt-2.5 flex items-center gap-4">
          <button
            {...action('taohaopian.publish.tools.wontfixToast', () => showToast(WONTFIX_TOAST))}
            aria-label="表情"
            className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
          >
            <IcSmile size={22} />
          </button>
          <button
            {...action('taohaopian.publish.tools.wontfixToast', () => showToast(WONTFIX_TOAST))}
            aria-label="图片"
            className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
          >
            <IcImage size={22} />
          </button>
          <button
            {...action('taohaopian.publish.tools.wontfixToast', () => showToast(WONTFIX_TOAST))}
            aria-label="GIF"
            className="cursor-pointer rounded border border-(--app-c-text-primary) bg-transparent px-1 py-0.5 text-[10px] font-bold leading-3 text-(--app-c-text-primary)"
          >
            GIF
          </button>
          <button
            {...action('taohaopian.publish.tools.wontfixToast', () => showToast(WONTFIX_TOAST))}
            aria-label="@"
            className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
          >
            <IcAt size={22} />
          </button>
          <div className="flex-1" />
          <button
            {...action('taohaopian.publish.comment.submit', submit)}
            className={`h-9 shrink-0 rounded-lg border-none px-5 text-[14px] ${
              canSend ? 'cursor-pointer bg-[#0C7BFF] text-white' : 'bg-(--app-c-chip-bg) text-[#666666]'
            }`}
          >
            {t('tao.publish.send')}
          </button>
        </div>
      </div>
    </div>
  );
}

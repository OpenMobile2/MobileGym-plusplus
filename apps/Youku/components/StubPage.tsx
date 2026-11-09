import React from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';

/**
 * S1 骨架占位页 —— 页面代理会用真实实现整体替换所在 pages/ 文件。
 * 占位页刻意不绑定任何 spec transition/action(避免半吊子字面量污染 checker 绑定侧),
 * 仅二级页提供 bindBack 返回,保证骨架阶段可走通导航。
 */
export default function StubPage({
  title,
  nodeId,
  withBack = false,
}: {
  /** spec 节点中文标题 */
  title: string;
  /** spec 节点 id(如 player.main),便于对照 */
  nodeId: string;
  /** 二级页 = true,渲染返回按钮(bindBack) */
  withBack?: boolean;
}) {
  const { bindBack } = useYoukuGestures();
  const { t } = useI18n();
  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <div className="flex h-11 shrink-0 items-center px-3">
        {withBack && (
          <button
            {...bindBack()}
            className="mr-2 flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-[20px] text-(--app-c-text-primary)"
            aria-label={t('common.back')}
          >
            ‹
          </button>
        )}
        <span className="text-[17px] font-bold">{title}</span>
      </div>
      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-4"
      >
        <div className="mt-24 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0C7BFF]">
            <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#0C7BFF]" />
          </div>
          <div className="text-[14px] text-[#999999]">{t('common.stub')}</div>
          <div className="text-[12px] text-[#666666]">{nodeId}</div>
        </div>
      </div>
    </div>
  );
}

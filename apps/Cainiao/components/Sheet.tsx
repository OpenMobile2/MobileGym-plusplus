import React from 'react';
import { IcClose } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';

interface SheetProps {
  title: React.ReactNode;
  children: React.ReactNode;
  /** 标题右侧附加内容(如「什么不能寄?」链接) */
  titleExtra?: React.ReactNode;
}

/** 底部弹层容器:URL 驱动(searchParams),遮罩/×/系统返回均 bindBack 关闭 */
export default function Sheet({ title, children, titleExtra }: SheetProps) {
  const { bindBack } = useCainiaoGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/45" />
      <div className="relative max-h-[82%] overflow-y-auto rounded-t-2xl bg-(--app-c-card-bg) px-4 pb-5 pt-4" data-scroll-container="sheet" data-scroll-direction="vertical">
        <div className="mb-3 flex items-center">
          <span className="text-[19px] font-bold text-(--app-c-text-primary)">{title}</span>
          {titleExtra}
          <button {...bindBack()} className="ml-auto cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-primary)">
            <IcClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  text: string;
  subText?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmBinding: object;
}

/** 居中确认弹窗:URL 驱动,取消/遮罩 bindBack */
export function ConfirmDialog({ text, subText, cancelLabel = '取消', confirmLabel = '确认', confirmBinding }: ConfirmDialogProps) {
  const { bindBack } = useCainiaoGestures();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-10">
      <div {...bindBack()} className="absolute inset-0 bg-black/45" />
      <div className="relative w-full rounded-2xl bg-(--app-c-card-bg) px-5 pb-5 pt-6 text-center">
        <div className="text-[17px] font-bold text-(--app-c-text-primary)">{text}</div>
        {subText && <div className="mt-2 text-[13px] leading-5 text-(--app-c-text-secondary)">{subText}</div>}
        <div className="mt-5 flex gap-3">
          <button
            {...bindBack()}
            className="h-10 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
          >
            {cancelLabel}
          </button>
          <button
            {...confirmBinding}
            className="h-10 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

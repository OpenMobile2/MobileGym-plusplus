import React from 'react';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';

/** 底部弹层容器。遮罩点击 = system.back(URL 驱动弹层的统一关闭方式)。 */
export const Sheet: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const { bindBack } = useXiaorichangGestures();
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-app-surface pb-6 text-app-text">
        {title && <div className="pt-4 text-center text-sm font-semibold text-app-text">{title}</div>}
        {children}
      </div>
    </div>
  );
};

/** 居中对话框容器 */
export const Dialog: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bindBack } = useXiaorichangGestures();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full rounded-3xl bg-app-surface p-5 text-app-text">{children}</div>
    </div>
  );
};

/** 整页式菜单路由(多父页菜单被建为独立 pathname)的宿主:视觉仍是底部弹层 */
export const MenuPage: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div className="relative flex h-full flex-col justify-end bg-black/40">
    <MenuPageBackdrop />
    <div className="relative rounded-t-3xl bg-white pb-8">
      {title && <div className="pt-4 text-center text-sm font-semibold text-[#424242]">{title}</div>}
      {children}
    </div>
  </div>
);

const MenuPageBackdrop: React.FC = () => {
  const { bindBack } = useXiaorichangGestures();
  return <div {...bindBack()} className="absolute inset-0" />;
};

/**
 * App 内确认框。替代 window.confirm —— 浏览器原生弹窗在模拟器里既不像真机,
 * 也会阻塞 OS 层的手势与返回键。
 */
export const ConfirmDialog: React.FC<{
  title: string; desc?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}> = ({ title, desc, danger, onConfirm, onCancel }) => (
  <div className="absolute inset-0 z-[60] flex items-center justify-center px-8">
    <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative w-full rounded-3xl bg-white p-5 text-center">
      <div className="text-base font-bold text-[#212121]">{title}</div>
      {desc && <div className="mt-1.5 text-xs leading-relaxed text-[#9AA5B1]">{desc}</div>}
      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full bg-[#F2F3F5] py-2.5 text-sm text-[#424242]">取消</button>
        <button onClick={onConfirm} className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white"
          style={{ background: danger ? '#DE4A3F' : '#424242' }}>确定</button>
      </div>
    </div>
  </div>
);

/** App 内单行文本输入框。替代 window.prompt。 */
export const PromptDialog: React.FC<{
  title: string; placeholder?: string; initial?: string;
  onConfirm: (value: string) => void; onCancel: () => void;
}> = ({ title, placeholder, initial = '', onConfirm, onCancel }) => {
  const [value, setValue] = React.useState(initial);
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-8">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full rounded-3xl bg-white p-5">
        <div className="text-center text-base font-bold text-[#212121]">{title}</div>
        <input autoFocus value={value} placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 w-full rounded-xl bg-[#F5F6F7] px-3 py-2.5 text-sm outline-none" />
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-[#F2F3F5] py-2.5 text-sm text-[#424242]">取消</button>
          <button onClick={() => value.trim() && onConfirm(value.trim())}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-[#5B4718]"
            style={{ background: '#F7CE45' }}>确定</button>
        </div>
      </div>
    </div>
  );
};

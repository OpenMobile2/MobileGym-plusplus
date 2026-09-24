/** 登录成功/数据恢复过场页。spec: auth.restore */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, Img } from '../components/ui';

export default function RestorePage() {
  const { bindTap } = useMeiyouGestures();
  const login = useMeiyouStore((s) => s.login);
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(100, p + 20);
      });
    }, 240);
    return () => clearInterval(timer);
  }, []);

  const done = pct >= 100;

  return (
    <div className="flex flex-col h-full items-center justify-center px-8" style={{ background: '#FDEEF2' }}>
      <Img src="/@app-assets/Meiyou/gen/illu_restore.png" className="w-40 h-40 object-contain" />
      <div className="mt-6 text-[16px] font-semibold text-[#1A1A1A]">
        {done ? '恢复完成' : '正在恢复历史数据'}
      </div>
      {!done && (
        <>
          <div className="mt-4 w-56 h-2 rounded-full bg-white overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: MY.primary }} />
          </div>
          <div className="mt-2 text-[13px] text-[#999]">{pct}%</div>
        </>
      )}
      {done && (
        <button
          {...bindTap('meiyou.restore-done', { onTrigger: () => login() })}
          className="mt-6 px-10 h-11 rounded-full text-white text-[15px] font-semibold border-none cursor-pointer"
          style={{ background: MY.primary }}
        >
          开始使用
        </button>
      )}
    </div>
  );
}

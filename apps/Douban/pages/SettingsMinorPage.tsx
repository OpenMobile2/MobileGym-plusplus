// 节点: settings.minor —— 未成年人模式(evidence IMG_0291,静态样式页,未开启态)。
// 模式说明 3 条 + 底部「同意」勾选框(本地 toggle)+ 开启按钮(wontfix,勾选后可点)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

const INTRO: { title: string; desc: string }[] = [
  { title: '内容防护', desc: '开启后将只推荐适合未成年人浏览的内容,过滤不适宜信息。' },
  { title: '时间管理', desc: '每日使用时长与使用时段将受到限制,超时需监护人密码解锁。' },
  { title: '消费保护', desc: '关闭充值、打赏等消费入口,守护青少年健康使用。' },
];

export default function SettingsMinorPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const [agreed, setAgreed] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <TopBar title="未成年人模式" />
      <div className="flex-1 overflow-y-auto px-5 pt-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[18px] font-semibold" style={{ color: C.text }}>豆瓣未成年人模式</div>
        <p className="mt-2 text-sm leading-6" style={{ color: C.sub }}>
          我们致力于为未成年人营造清朗的网络环境。开启后,豆瓣将在内容、时长与消费方面提供保护。
        </p>

        <div className="mt-6 space-y-5">
          {INTRO.map((it, i) => (
            <div key={it.title} className="flex gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: C.greenSoft, color: C.green }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="text-[15px] font-medium" style={{ color: C.text }}>{it.title}</div>
                <div className="mt-1 text-sm leading-6" style={{ color: C.sub }}>{it.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-2 pb-8 border-t" style={{ borderColor: C.border }}>
        <button
          {...bindTap(
            { kind: 'action', id: 'settings.minor.agree.toggle' },
            { onTrigger: () => setAgreed((v) => !v) },
          )}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer py-2"
        >
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white"
            style={{ background: agreed ? C.green : '#fff', border: `1.5px solid ${agreed ? C.green : '#C7CCD4'}` }}
          >
            {agreed ? '✓' : ''}
          </span>
          <span className="text-xs" style={{ color: C.sub }}>我已阅读并同意《未成年人模式使用协议》</span>
        </button>
        <button
          {...bindTap(
            { kind: 'action', id: 'settings.minor.enable.wontfix' },
            { onTrigger: () => (agreed ? toast('该功能暂未开放') : toast('请先勾选同意协议')) },
          )}
          className="w-full h-12 rounded-full border-none cursor-pointer text-[16px] font-medium mt-2"
          style={{ background: agreed ? C.green : '#C8E6CD', color: '#fff' }}
        >
          开启未成年人模式
        </button>
      </div>
    </div>
  );
}

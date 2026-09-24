import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

// 安全工具(证据 n16)。节点: safety.center
const OTHER_TOOLS: { name: string; desc: string }[] = [
  { name: '安全提醒设置', desc: '全定制' },
  { name: '号码保护', desc: '已开启' },
  { name: '关怀宝', desc: '全天保障' },
  { name: '处理调查支持', desc: '' },
  { name: '隐私号码保护', desc: '' },
  { name: '驾驶行为反馈', desc: '' },
  { name: '车内录音保护', desc: '去升级' },
  { name: '录音录像保护', desc: '' },
  { name: '亲友守护工具', desc: '' },
];

export default function SafetyCenterPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const contacts = useDidiStore((s) => s.settings.emergencyContacts);
  return (
    <div className="flex flex-col h-full" style={{ background: '#EFF4FF' }} data-status-bar-foreground="dark">
      <TopBar title="安全工具" transparent />
      <div className="flex-1 overflow-y-auto p-3">
        {/* 待升级提示卡 */}
        <div className="rounded-xl p-4 text-white mb-3" style={{ background: C.blue }}>
          <div className="text-[16px] font-semibold">
            您还有{contacts.length === 0 ? 1 : 0}个安全工具待升级
          </div>
          <div className="text-[12px] opacity-80 mt-1">
            升级后可提升平台守护您的安全等级({contacts.length === 0 ? 2 : 3}/3)
          </div>
        </div>
        {/* 三大工具 */}
        <div className="bg-app-surface rounded-xl mb-3">
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="text-xl mr-3">🧑‍🤝‍🧑</span>
            <div className="flex-1">
              <div className="text-[15px] text-app-text">紧急联系人</div>
              <div className="text-[12px] text-app-text-muted">
                {contacts.length > 0 ? `已添加 ${contacts.length} 位` : '您还没有添加紧急联系人'}
              </div>
            </div>
            <button
              {...bindTap('safety.contacts.open')}
              className="px-3 py-1.5 rounded-full text-[13px] text-white border-none"
              style={{ background: C.blue }}
            >
              去设置
            </button>
          </div>
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="text-xl mr-3">📹</span>
            <div className="flex-1">
              <div className="text-[15px] text-app-text">车内录像设置</div>
              <div className="text-[12px] text-app-text-muted">保障纠纷取证</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'safety.center.tool' }, { onTrigger: () => toast('车内录像已开启') })}
              className="px-3 py-1.5 rounded-full text-[13px] border text-app-text-muted bg-transparent"
              style={{ borderColor: '#D9DBE0' }}
            >
              已开启
            </button>
          </div>
          <div className="flex items-center px-4 py-3.5">
            <span className="text-xl mr-3">🪪</span>
            <div className="flex-1">
              <div className="text-[15px] text-app-text">实名认证</div>
              <div className="text-[12px] text-app-text-muted">保障账号安全</div>
            </div>
            <span className="text-[13px]" style={{ color: C.green }}>已完成</span>
          </div>
        </div>
        {/* 其他工具项 */}
        <div className="text-[13px] text-app-text-muted px-1 pb-1.5">其他工具项</div>
        <div className="grid grid-cols-2 gap-2">
          {OTHER_TOOLS.map((t) => (
            <button
              key={t.name}
              {...bindTap({ kind: 'action', id: 'safety.center.tool' }, { onTrigger: () => toast('已开启该防护(演示)') })}
              className="flex items-center justify-between bg-app-surface rounded-xl px-3.5 py-3.5 border-none text-left"
            >
              <span className="text-[14px] text-app-text">{t.name}</span>
              <span className="text-[11px] text-app-text-muted">{t.desc || '›'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

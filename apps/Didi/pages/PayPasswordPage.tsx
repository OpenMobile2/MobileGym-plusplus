import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, Row } from '../components/ui';

/** 支付密码管理 —— 证据 n25、n26、n27(实名卡+修改/找回密码→数字键盘浮层)。 */

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function PayPasswordPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const user = useDidiStore((s) => s.user);
  const setPayPasswordConfigured = useDidiStore((s) => s.setPayPasswordConfigured);

  const [idTail, setIdTail] = React.useState('');
  const [padOpen, setPadOpen] = React.useState(false);
  const [pin, setPin] = React.useState('');

  const openPad = () => {
    setPin('');
    setPadOpen(true);
  };

  const pressKey = (k: string) => {
    if (k === '') return;
    if (k === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => {
      if (p.length >= 6) return p;
      const next = p + k;
      if (next.length === 6) {
        setPayPasswordConfigured(true);
        toast('支付密码已更新');
        setPadOpen(false);
        return '';
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      <TopBar title="支付密码管理" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ① 实名卡 */}
        <Card className="mb-3">
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="w-20 text-[15px] text-app-text">姓名</span>
            <span className="text-[15px] text-app-text">{user.realName}</span>
          </div>
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="w-20 text-[15px] text-app-text shrink-0">身份证号</span>
            <input
              value={idTail}
              onChange={(e) => setIdTail(e.target.value.slice(0, 4))}
              placeholder="请输入证件号后4位"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] text-app-text placeholder:text-app-text-muted"
            />
          </div>
          <div className="flex items-center px-4 py-3.5">
            <span className="w-20 text-[15px] text-app-text">手机号</span>
            <span className="text-[15px] text-app-text">{user.phone}</span>
          </div>
        </Card>

        {/* ② 修改/找回密码 */}
        <Card>
          <Row
            label="修改密码"
            bind={bindTap(
              { kind: 'action', id: 'pay.password.change' },
              { onTrigger: openPad, params: { mode: 'change' } },
            )}
          />
          <Row
            label="找回密码"
            bind={bindTap(
              { kind: 'action', id: 'pay.password.change' },
              { onTrigger: openPad, params: { mode: 'recover' } },
            )}
            last
          />
        </Card>
      </div>

      {/* 数字键盘浮层(本地 state) */}
      {padOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/50">
          <div className="bg-app-surface rounded-t-2xl">
            <div className="flex items-center px-4 pt-4 pb-2">
              <span className="flex-1 text-center text-[16px] font-semibold text-app-text pl-6">
                请输入支付密码
              </span>
              <button
                onClick={() => setPadOpen(false)}
                className="bg-transparent border-none text-[18px] text-app-text-muted w-6"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            {/* 6 格密码框 */}
            <div className="flex justify-center gap-2 px-6 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="w-11 h-11 rounded-lg border border-app-border flex items-center justify-center text-[20px] text-app-text bg-app-bg"
                >
                  {pin.length > i ? '●' : ''}
                </span>
              ))}
            </div>
            {/* 数字九宫格 */}
            <div className="grid grid-cols-3 gap-px bg-app-border pb-1">
              {KEYS.map((k, i) => (
                <button
                  key={i}
                  onClick={() => pressKey(k)}
                  disabled={k === ''}
                  className="h-13 bg-app-surface border-none text-[20px] font-medium text-app-text disabled:opacity-0"
                  style={{ height: 52 }}
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

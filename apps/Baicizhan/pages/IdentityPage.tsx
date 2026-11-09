import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcClose } from '../res/icons';

const GROUPS: { title: string; roles: string[] }[] = [
  { title: '小学', roles: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'] },
  { title: '初中', roles: ['初一', '初二', '初三'] },
  { title: '高中', roles: ['高一', '高二', '高三'] },
  { title: '大学', roles: ['大一', '大二', '大三', '大四', '硕士生', '博士生'] },
  { title: '成人', roles: ['工作党', '其他'] },
];

export default function IdentityPage() {
  const s = useStrings();
  const { action, bindBack, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const cur = st.settings.identity;
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="px-4 pt-12"><button {...bindBack()}><IcClose size={22} color="#33405C" /></button></div>
      <div className="px-5 pt-2">
        <div className="text-xl font-bold text-[#212121]">{s.identityTitle}</div>
        <div className="mt-1 text-sm text-[#9AA5B1]">我们将为你推荐适合的学习内容</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4" data-scroll-container="main" data-scroll-direction="vertical">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-4">
            <div className="text-sm font-semibold text-[#33405C]">{g.title}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.roles.map((r) => {
                const on = cur === r;
                return (
                  <button key={r} {...action('identity.pick.select.role', () => { st.setIdentity(r); st.showToast('已选择:' + r); back(); }, { params: { role: r } })}
                    className="rounded-xl px-5 py-2.5 text-sm"
                    style={{ background: on ? '#EAF0FF' : '#F4F5F7', color: on ? colors.primary : '#5B6B85', outline: on ? `1px solid ${colors.primary}` : 'none' }}>
                    {on ? '✓ ' : ''}{r}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

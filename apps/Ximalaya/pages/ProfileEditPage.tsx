import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { TopBar, Img, showToast } from '../components/ui';
import { IcChevronRight, IcMic, IcCheck } from '../res/icons';

type Field = '昵称' | '性别' | '生日' | '地区';

const GENDER_OPTIONS = ['男', '女', '保密'];
const REGION_OPTIONS = ['北京 北京', '江苏 南京', '江苏 苏州', '浙江 杭州', '广东 深圳', '广东 广州', '四川 成都', '湖北 武汉'];
const YEARS = Array.from({ length: 31 }, (_, i) => String(1980 + i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

export function ProfileEditPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const user = useXimalayaStore((st) => st.user);
  const [fields, setFields] = useState<Record<Field, string>>({
    昵称: user.name,
    性别: '男',
    生日: '1995-06',
    地区: '江苏 南京',
  });

  // —— 本地弹层态 ——
  const [editor, setEditor] = useState<Field | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [year, setYear] = useState('1995');
  const [month, setMonth] = useState('06');

  const openEditor = (field: Field) => {
    if (field === '昵称') setNameDraft(fields.昵称);
    if (field === '生日') {
      const [y, m] = fields.生日.split('-');
      setYear(y);
      setMonth(m);
    }
    setEditor(field);
  };
  const close = () => setEditor(null);
  const set = (field: Field, value: string) => {
    setFields((f) => ({ ...f, [field]: value }));
    showToast('已更新' + field);
  };

  const commitName = () => {
    const v = nameDraft.trim();
    if (v) set('昵称', v);
    close();
  };
  const commitBirth = () => {
    set('生日', `${year}-${month}`);
    close();
  };

  const ROWS: { field: Field; hint?: string }[] = [
    { field: '昵称' },
    { field: '性别', hint: '完善度 +20%' },
    { field: '生日', hint: '完善度 +10%' },
    { field: '地区', hint: '完善度 +10%' },
  ];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="编辑资料" />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 头像 + 编辑主页背景 */}
        <div className="bg-white mt-2 px-4 py-4 flex items-center justify-between">
          <span className="text-[15px] text-[#333]">头像</span>
          <div className="flex items-center gap-3">
            <button {...bindTap({ kind: 'action', id: 'pedit.avatar.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}>
              <Img src={user.avatar} className="w-14 h-14 rounded-full object-cover" />
            </button>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'pedit.avatar.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
          className="w-full bg-white mt-px px-4 py-3.5 flex items-center justify-between text-[15px] text-[#333]"
        >
          <span>编辑主页背景</span>
          <IcChevronRight size={18} className="text-[#CCC]" />
        </button>

        {/* 完善资料领券进度 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#333]">完善资料领 20 元券</span>
            <span className="text-[#FE4543]">已完善 30%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
            <div className="h-full bg-[#FE4543]" style={{ width: '30%' }} />
          </div>
        </div>

        {/* 昵称/性别/生日/地区 —— 同一 action,不同编辑器 */}
        <div className="bg-white mt-2">
          {ROWS.map(({ field, hint }) => (
            <button
              key={field}
              {...bindTap({ kind: 'action', id: 'pedit.field.input' }, { params: { field, value: fields[field] }, onTrigger: () => openEditor(field) })}
              className="w-full px-4 py-3.5 flex items-center justify-between border-b border-[#F5F5F5] last:border-0"
            >
              <span className="text-[15px] text-[#333]">{field}</span>
              <span className="flex items-center gap-2 text-[14px] text-[#999]">
                {hint && <span className="text-[12px] text-[#FE4543] bg-[#FFF0EF] px-2 py-0.5 rounded-full">{hint}</span>}
                {fields[field]}
                <IcChevronRight size={18} className="text-[#CCC]" />
              </span>
            </button>
          ))}
        </div>

        {/* 声音签名 */}
        <button
          {...bindTap({ kind: 'action', id: 'pedit.voice.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
          className="w-full bg-white mt-2 px-4 py-3.5 flex items-center justify-between text-[15px] text-[#333]"
        >
          <span>声音签名</span>
          <span className="flex items-center gap-1 text-[13px] text-[#FE4543]"><IcMic size={15} />立即录制</span>
        </button>

        {/* 认证/隐私/同步 */}
        <div className="bg-white mt-2">
          {[
            { label: '认证 / 隐私设置', id: 'pedit.misc.wontfix' as const },
            { label: '同步微信 / QQ 资料', id: 'pedit.sync.wontfix' as const },
          ].map((r) => (
            <button
              key={r.id}
              {...bindTap({ kind: 'action', id: r.id }, { onTrigger: () => showToast('该功能暂未开放') })}
              className="w-full px-4 py-3.5 flex items-center justify-between border-b border-[#F5F5F5] last:border-0 text-[15px] text-[#333]"
            >
              <span>{r.label}</span>
              <IcChevronRight size={18} className="text-[#CCC]" />
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>

      {/* —— 昵称:文字输入弹层 —— */}
      {editor === '昵称' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-white rounded-t-2xl" data-keep-keyboard="true">
            <div className="flex items-center justify-between h-12 px-4 border-b border-[#F2F2F2]">
              <button onClick={close} className="text-[14px] text-[#999]">{s.cancel}</button>
              <span className="text-[15px] font-medium text-[#333]">昵称</span>
              <button onClick={commitName} className="text-[14px] text-[#FE4543]">{s.confirm}</button>
            </div>
            <div className="p-4" data-keep-keyboard="true">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="请输入昵称"
                maxLength={20}
                data-keep-keyboard="true"
                className="w-full h-11 px-3 rounded-lg bg-[#F5F5F5] text-[15px] text-[#333] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* —— 性别:底部 Sheet 单选 —— */}
      {editor === '性别' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-white rounded-t-2xl">
            <div className="flex items-center justify-center h-12 border-b border-[#F2F2F2] text-[15px] font-medium text-[#333]">选择性别</div>
            {GENDER_OPTIONS.map((g) => {
              const active = fields.性别 === g;
              return (
                <button
                  key={g}
                  onClick={() => { set('性别', g); close(); }}
                  className="w-full h-12 px-4 flex items-center justify-between border-b border-[#F5F5F5] text-[15px] text-[#333]"
                >
                  <span className={active ? 'text-[#FE4543]' : ''}>{g}</span>
                  {active && <IcCheck size={18} className="text-[#FE4543]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* —— 地区:底部 Sheet 选省/市 —— */}
      {editor === '地区' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: '70%' }}>
            <div className="shrink-0 flex items-center justify-center h-12 border-b border-[#F2F2F2] text-[15px] font-medium text-[#333]">选择地区</div>
            <div className="overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
              {REGION_OPTIONS.map((r) => {
                const active = fields.地区 === r;
                return (
                  <button
                    key={r}
                    onClick={() => { set('地区', r); close(); }}
                    className="w-full h-12 px-4 flex items-center justify-between border-b border-[#F5F5F5] text-[15px] text-[#333]"
                  >
                    <span className={active ? 'text-[#FE4543]' : ''}>{r}</span>
                    {active && <IcCheck size={18} className="text-[#FE4543]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* —— 生日:年/月 选择(模拟滚动列) —— */}
      {editor === '生日' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: '60%' }}>
            <div className="shrink-0 flex items-center justify-between h-12 px-4 border-b border-[#F2F2F2]">
              <button onClick={close} className="text-[14px] text-[#999]">{s.cancel}</button>
              <span className="text-[15px] font-medium text-[#333]">选择生日</span>
              <button onClick={commitBirth} className="text-[14px] text-[#FE4543]">{s.confirm}</button>
            </div>
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={'w-full h-11 flex items-center justify-center text-[15px] ' + (y === year ? 'text-[#FE4543] font-semibold' : 'text-[#999]')}
                  >
                    {y}年
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
                {MONTHS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonth(m)}
                    className={'w-full h-11 flex items-center justify-center text-[15px] ' + (m === month ? 'text-[#FE4543] font-semibold' : 'text-[#999]')}
                  >
                    {m}月
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

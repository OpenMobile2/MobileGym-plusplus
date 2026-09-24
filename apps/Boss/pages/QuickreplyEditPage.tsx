import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar, MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcClose } from '../res/icons';

const C = BOSS_CONFIG;

/** 添加/编辑常用语(IMG_8506/8507):多行输入 + 完成 + 优质模板弹层(自我介绍范例) */
const QuickreplyEditPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const editId = searchParams.get('id') ?? undefined;
  const editing = store.quickReplies.find((q) => q.id === editId);
  const [text, setText] = useState(editing?.text ?? '');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateTab, setTemplateTab] = useState(C.greetSampleTabs[0]);

  if (editId && !editing) return <MissingContent text="常用语不存在或已被移除" />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title={editing ? '编辑常用语' : '添加常用语'}
        right={
          <button
            {...action('quickreply.save.commit', () => {
              if (!text.trim()) { store.showToast('请输入常用语'); return; }
              store.saveQuickReply(text.trim(), editId);
              store.showToast('已保存');
              back();
            }, { params: {} })}
            data-keep-keyboard="true"
            className="pr-1 text-[15px] font-medium"
            style={{ color: COLORS.accent }}
          >
            完成
          </button>
        }
      />
      <div className="min-h-0 flex-1 px-4">
        <textarea
          {...({ 'data-action': 'quickreply.text.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="输入您的常用回复,请不要填写QQ、微信等联系方式或广告信息,否则系统将封禁您的账号"
          className="h-48 w-full resize-none bg-transparent pt-2 text-[15px] leading-relaxed outline-none placeholder:text-gray-300"
        />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-4 py-3" data-keep-keyboard="true">
        <button
          {...action('quickreply.template.open', () => setTemplateOpen(true), { params: {} })}
          className="flex items-center gap-1.5 text-[14px] text-gray-700"
        >
          👁 常用语优质模板
        </button>
        <span className="text-[13px] text-gray-400"><span style={{ color: COLORS.accent }}>{text.length}</span>/200</span>
      </div>

      {/* 自我介绍范例弹层(IMG_8507) */}
      {templateOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="flex max-h-[85%] flex-col rounded-t-2xl bg-white pt-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-baseline gap-4">
                <span className="border-b-2 pb-1 text-[17px] font-bold text-gray-900" style={{ borderColor: COLORS.primary }}>自我介绍范例</span>
                <span className="text-[15px] text-gray-400">自我介绍模板</span>
              </div>
              <button onClick={() => setTemplateOpen(false)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto px-4" data-scroll-container="template-tabs" data-scroll-direction="horizontal">
              {C.greetSampleTabs.map((tab) => (
                <button
                  key={tab}
                  {...action('quickreply.select.template', () => setTemplateTab(tab), { params: { value: tab } })}
                  className="shrink-0 rounded-full border px-3.5 py-1.5 text-[13px]"
                  style={templateTab === tab
                    ? { borderColor: COLORS.primary, color: COLORS.primary, backgroundColor: '#E6F5F4' }
                    : { borderColor: '#E5E7EB', color: '#4B5563' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-3" data-scroll-container="template-list" data-scroll-direction="vertical">
              {C.greetSamples.filter((g) => g.category === templateTab).map((g) => (
                <button
                  key={g.id}
                  {...action('quickreply.template.apply', () => { setText(g.text); setTemplateOpen(false); }, { params: { id: g.id } })}
                  className="mt-3 block w-full rounded-2xl bg-[#F8F9FA] p-4 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar imgKey={g.avatar} name={g.role} size={36} />
                    <span className="text-[15px] font-semibold text-gray-900">{g.role}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{g.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickreplyEditPage;

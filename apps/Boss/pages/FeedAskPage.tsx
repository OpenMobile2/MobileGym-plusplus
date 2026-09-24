import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcAi, IcImage, IcClose } from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import AsyncFsImage from '@/os/components/AsyncFsImage';

const TOPICS = ['账号活跃度', '找工作啊找工作', '打工人上人', '转行', '应届求职'];

/** 提问(补拍 20_30):标题 + 补充说明 + 邀请回答 + 话题 + 工具 + 发布 → 问答卡帖入流 */
const FeedAskPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const store = useBossStore();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [invited, setInvited] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title="提问"
        right={
          <button
            {...action('ask.publish.commit', () => {
              if (!title.trim()) { store.showToast('请填写问题'); return; }
              store.publishAsk(title.trim(), desc.trim(), topics, images);
              store.showToast('提问已发布');
              back();
            }, { params: {} })}
            data-keep-keyboard="true"
            className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white"
            style={{ backgroundColor: title.trim() ? COLORS.primaryBtn : '#BFE8E6' }}
          >
            发布
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <input
          {...({ 'data-action': 'ask.title.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请用简练的文字描述问题,并以“?”结尾"
          className="mt-2 w-full bg-transparent text-[17px] outline-none placeholder:text-gray-300"
        />
        <button {...action('ask.ai.toast', () => store.showNotice('AI 辅助提问暂未开放，请点击“我知道了”返回。'), { params: {} })} className="mt-2 flex w-full items-center justify-between rounded-lg bg-[#F5F6F7] px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[14px] text-gray-700"><IcAi size={16} color="#5B8DEF" /> 直闪闪</span>
          <span className="text-[13px]" style={{ color: COLORS.accent }}>问 AI ›</span>
        </button>
        <textarea
          {...({ 'data-action': 'ask.desc.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={500}
          placeholder="(选填)对问题补充说明"
          className="mt-3 h-24 w-full resize-none border-b border-gray-100 bg-transparent pb-2 text-[15px] leading-relaxed outline-none placeholder:text-gray-300"
        />
        <div className="text-right text-[13px] text-gray-400"><span style={{ color: COLORS.accent }}>{desc.length}</span>/500</div>

        {invited && (
          <div className="mt-3 flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="flex items-center gap-2 text-[15px] text-gray-800">@ 邀请 <b className="font-semibold">算法工程师</b> 回答</span>
            <button onClick={() => setInvited(false)} className="p-1 text-gray-400" aria-label="移除邀请"><IcClose size={16} /></button>
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto" data-scroll-container="topics" data-scroll-direction="horizontal">
          <span className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}># 选择话题</span>
          {TOPICS.map((t) => (
            <button
              key={t}
              {...action('ask.select.topic', () => setTopics((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t])), { params: { value: t } })}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px]"
              style={topics.includes(t) ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#4B5563' }}
            >
              #{t}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-gray-400">*发布即表示您已阅读并同意<span style={{ color: COLORS.accent }}>《有了创作者平台用户协议》</span></p>
        {images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto" data-scroll-container="images" data-scroll-direction="horizontal">
            {images.map((src) => (
              src.startsWith('/sdcard/')
                ? <AsyncFsImage key={src} path={src} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                : <img key={src} src={src} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-5 border-t border-gray-100 px-4 py-3" data-keep-keyboard="true">
        <button {...action('ask.image.pick', () => {
          void pickImages({ multiple: true, maxSelect: 9 - images.length }).then((r) => {
            if (r.cancelled || !r.selected.length) return;
            setImages((prev) => [...prev, ...r.selected.map((x) => x.path || x.uri).filter(Boolean)].slice(0, 9));
          });
        }, { params: {} })} className="flex items-center gap-1 text-[14px] text-gray-600"><IcImage size={18} /> 图片</button>
        <button {...action('ask.tools.toast', () => store.showNotice('投票工具暂未开放，请点击“我知道了”返回。'), { params: {} })} className="flex items-center gap-1 text-[14px] text-gray-600">📊 投票</button>
        <button {...action('ask.tools.toast', () => store.showNotice('富文本格式暂未开放，请点击“我知道了”返回。'), { params: {} })} className="flex items-center gap-1 text-[14px] text-gray-400">Aa 格式</button>
      </div>
    </div>
  );
};

export default FeedAskPage;

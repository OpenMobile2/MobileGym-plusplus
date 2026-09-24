import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcPlus } from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import AsyncFsImage from '@/os/components/AsyncFsImage';

const TOPICS = ['账号活跃度', '找工作啊找工作', '打工人上人', '面试那些事', '第一份工资', '职场吐槽'];

/** 发图文动态(补拍 18_30):文本 + 加图占位 + 话题 + AI声明 + 发布 → 新帖入有了流顶部 */
const FeedComposePage: React.FC = () => {
  const { action, back } = useBossGestures();
  const store = useBossStore();
  const [text, setText] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [aiDeclared, setAiDeclared] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const toggleTopic = (t: string) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title="动态"
        right={
          <button
            {...action('compose.publish.commit', () => {
              if (!text.trim()) { store.showToast('说点什么再发布吧'); return; }
              store.publishPost(text.trim(), topics, images, aiDeclared);
              store.showToast('发布成功');
              back();
            }, { params: {} })}
            data-keep-keyboard="true"
            className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white"
            style={{ backgroundColor: text.trim() ? COLORS.primaryBtn : '#BFE8E6' }}
          >
            发布
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <textarea
          {...({ 'data-action': 'compose.text.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="说点什么,听说带图的内容在社区更受欢迎哦~"
          className="mt-2 h-40 w-full resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-gray-300"
        />
        <div className="text-right text-[13px] text-gray-400"><span style={{ color: COLORS.accent }}>{text.length}</span>/2000</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src) => (
            src.startsWith('/sdcard/')
              ? <AsyncFsImage key={src} path={src} alt="" className="h-28 w-28 rounded-xl object-cover" />
              : <img key={src} src={src} alt="" className="h-28 w-28 rounded-xl object-cover" />
          ))}
          {images.length < 9 && (
            <button
              {...action('compose.image.pick', () => {
                void pickImages({ multiple: true, maxSelect: 9 - images.length }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setImages((prev) => [...prev, ...r.selected.map((x) => x.path || x.uri).filter(Boolean)].slice(0, 9));
                });
              }, { params: {} })}
              className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#F5F6F7]"
              aria-label="添加图片"
            >
              <IcPlus size={28} className="text-gray-300" />
            </button>
          )}
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto" data-scroll-container="topics" data-scroll-direction="horizontal">
          <span className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}># 选择话题</span>
          {TOPICS.map((t) => (
            <button
              key={t}
              {...action('compose.select.topic', () => toggleTopic(t), { params: { value: t } })}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px]"
              style={topics.includes(t) ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#4B5563' }}
            >
              #{t}
            </button>
          ))}
        </div>

        <button
          {...action('compose.aideclare.toggle', () => setAiDeclared((v) => !v), { params: {} })}
          className="mt-5 flex w-full items-center justify-between border-t border-gray-100 pt-4"
        >
          <span className="text-[15px] text-gray-800">作者声明: 内容含AI合成</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full border" style={aiDeclared ? { backgroundColor: COLORS.primaryBtn, borderColor: COLORS.primaryBtn, color: 'white', fontSize: 11 } : { borderColor: '#D1D5DB' }}>
            {aiDeclared ? '✓' : ''}
          </span>
        </button>
        <p className="mt-4 text-[12px] text-gray-400">*发布即表示您已阅读并同意<span style={{ color: COLORS.accent }}>《有了创作者平台用户协议》</span></p>
      </div>
    </div>
  );
};

export default FeedComposePage;

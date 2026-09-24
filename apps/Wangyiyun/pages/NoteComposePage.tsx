import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Cover, useToast, WY } from '../components/ui';
import { MEDIA_SEEDS } from '../assets/covers';
import { IcBack } from '../res/icons';

const TOOLS = ['模板', '文字', '滤镜', '裁剪', '贴纸', '音乐'] as const;
const FILTERS = ['原图', '胶片', '暮色', '清透', '黑白'] as const;
const TITLE_CHIPS = ['被这首击中的举手🙋', '演唱会里藏着未说的眷恋', '深夜循环'];
const MEDIA = MEDIA_SEEDS.slice(0, 24);

export default function NoteComposePage() {
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [step, setStep] = React.useState<'pick' | 'edit' | 'publish'>('pick');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [tool, setTool] = React.useState<(typeof TOOLS)[number]>('文字');
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('原图');
  const [overlayText, setOverlayText] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [visibility, setVisibility] = React.useState<'public' | 'fans' | 'self'>('public');
  const publishNote = useWangyiyunStore((s) => s.publishNote);
  const currentSongId = useWangyiyunStore((s) => s.currentSongId);

  const doPublish = () => {
    const id = publishNote(title || TITLE_CHIPS[0], body || overlayText || '分享一首好歌', currentSongId || undefined, picked[0]);
    showToast('发布成功');
    go('compose.publish', { id });
  };

  const filterStyle = (seed: string): React.CSSProperties => {
    const base: React.CSSProperties = {};
    if (filter === '胶片') base.filter = 'contrast(1.1) saturate(0.85) sepia(0.15)';
    if (filter === '暮色') base.filter = 'saturate(1.2) hue-rotate(-10deg) brightness(0.95)';
    if (filter === '清透') base.filter = 'brightness(1.08) saturate(1.15)';
    if (filter === '黑白') base.filter = 'grayscale(1)';
    return base;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: WY.noteBg }} data-status-bar-foreground="light">
      {toast}
      <div className="h-10" />
      <div className="flex items-center h-11 px-2 text-white shrink-0">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="返回"><IcBack size={22} /></button>
        <div className="flex-1 text-center text-[15px]">{step === 'pick' ? '选择素材' : step === 'edit' ? '编辑' : '发布笔记'}</div>
        {step !== 'publish' && (
          <button {...bindTap({ kind: 'action', id: 'compose.step.next' }, {
            onTrigger: () => {
              if (step === 'pick' && !picked.length) { showToast('请先选择素材'); return; }
              setStep(step === 'pick' ? 'edit' : 'publish');
            },
          })} className="px-3 py-1 rounded-full text-[13px] border-none cursor-pointer text-white" style={{ background: (step === 'pick' && !picked.length) ? '#555' : WY.primary }}>
            下一步{picked.length ? `(${picked.length})` : ''}
          </button>
        )}
        {step === 'publish' && (
          <button onClick={doPublish} className="px-3 py-1 rounded-full text-[13px] border-none cursor-pointer text-white" style={{ background: WY.primary }}>发布笔记</button>
        )}
      </div>

      {step === 'pick' && (
        <div className="flex-1 overflow-y-auto p-1">
          <div className="grid grid-cols-4 gap-1">
            {MEDIA.map((seed, i) => {
              const on = picked.includes(seed);
              const order = picked.indexOf(seed) + 1;
              return (
                <button key={seed} {...bindTap({ kind: 'action', id: 'compose.media.pick' }, {
                  params: { index: i },
                  onTrigger: () => setPicked((p) => on ? p.filter((x) => x !== seed) : [...p, seed].slice(0, 9)),
                })} className="aspect-square relative border-none cursor-pointer p-0 overflow-hidden">
                  <Cover seed={seed} className="w-full h-full" rounded={0} />
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full text-[11px] flex items-center justify-center" style={{ background: on ? WY.primary : 'rgba(0,0,0,0.45)', color: '#fff' }}>{on ? order : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'edit' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center px-6 relative">
            <div className="w-full max-w-[280px] aspect-square rounded-lg overflow-hidden relative" style={filterStyle(picked[0] || MEDIA[0])}>
              <Cover seed={picked[0] || MEDIA[0]} className="w-full h-full" rounded={8} />
              {overlayText && (
                <div className="absolute inset-x-3 bottom-4 text-white text-[16px] font-semibold text-center drop-shadow">{overlayText}</div>
              )}
            </div>
          </div>
          {tool === '文字' && (
            <div className="px-4 pb-2">
              <input value={overlayText} onChange={(e) => setOverlayText(e.target.value.slice(0, 40))} placeholder="点这里输入封面文字"
                className="w-full h-10 rounded-lg px-3 text-[14px] border-none outline-none text-white" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>
          )}
          {tool === '滤镜' && (
            <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-[12px] border-none cursor-pointer shrink-0"
                  style={{ background: filter === f ? WY.primary : 'rgba(255,255,255,0.12)', color: '#fff' }}>{f}</button>
              ))}
            </div>
          )}
          {tool === '模板' && (
            <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
              {TITLE_CHIPS.map((c) => (
                <button key={c} onClick={() => { setOverlayText(c); showToast('已套用模板'); }} className="px-3 py-1.5 rounded-full text-[12px] border-none cursor-pointer shrink-0 text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>{c.slice(0, 8)}</button>
              ))}
            </div>
          )}
          {(tool === '裁剪' || tool === '贴纸' || tool === '音乐') && (
            <div className="px-4 pb-2 text-[12px] text-white/70 text-center">
              {tool === '裁剪' && '拖动四角可裁剪（示意已应用居中裁剪）'}
              {tool === '贴纸' && '已添加音符贴纸'}
              {tool === '音乐' && '已关联当前播放歌曲'}
            </div>
          )}
          <div className="flex justify-around py-4 text-white text-[13px] shrink-0">
            {TOOLS.map((t) => (
              <button key={t} {...bindTap({ kind: 'action', id: 'compose.tool.select.target' }, {
                params: { target: t },
                onTrigger: () => { setTool(t); if (t === '贴纸') showToast('已添加贴纸'); if (t === '音乐') showToast('已关联歌曲'); if (t === '裁剪') showToast('已居中裁剪'); },
              })} className="bg-transparent border-none cursor-pointer" style={{ color: tool === t ? '#fff' : 'rgba(255,255,255,0.55)' }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {step === 'publish' && (
        <div className="flex-1 overflow-y-auto p-4 text-white">
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {picked.map((seed) => (
              <div key={seed} className="w-16 h-16 rounded overflow-hidden shrink-0" style={filterStyle(seed)}>
                <Cover seed={seed} className="w-full h-full" rounded={6} />
              </div>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="添加标题（点这里输入）"
            className="w-full bg-transparent border-none outline-none text-[16px] py-2 text-white" />
          <div className="flex gap-2 flex-wrap mb-2">
            {TITLE_CHIPS.map((c) => (
              <button key={c} onClick={() => setTitle(c)} className="text-[12px] rounded-full px-2 py-1 border-none cursor-pointer" style={{ background: WY.noteCard, color: '#fff' }}>{c}</button>
            ))}
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="添加正文，说说你和这首歌的故事…"
            rows={5} className="w-full bg-transparent border-none outline-none text-[14px] text-white resize-none" />
          <div className="mt-4 text-[13px] text-white/80">谁可以看</div>
          <div className="flex gap-2 mt-2">
            {([['public', '公开'], ['fans', '粉丝'], ['self', '仅自己']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setVisibility(k)} className="px-3 py-1.5 rounded-full text-[12px] border-none cursor-pointer"
                style={{ background: visibility === k ? WY.primary : 'rgba(255,255,255,0.12)', color: '#fff' }}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

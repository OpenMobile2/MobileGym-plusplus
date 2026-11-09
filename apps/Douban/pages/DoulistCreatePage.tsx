// 创建豆列(doulist.create,/doulist/create,IMG_0242,frame:38a79c@t0060/t0063):
// 顶栏 取消/创建 + 上传封面「+」 + 名称输入 + 介绍多行 + 公开/私密开关。
// 创建:名称非空→createDoulist→toast「创建成功」→返回豆列tab(collect.mine);封面走系统相册选图。
import React, { useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img } from '../components/ui';
import { pickImagesFromAlbum } from '../capabilities';

export default function DoulistCreatePage() {
  const { bindTap, bindBack } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const createDoulist = useDoubanStore((s) => s.createDoulist);

  const [name, setName] = useState('');
  const [intro, setIntro] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [cover, setCover] = useState<string | null>(null);
  const canCreate = name.trim().length > 0;

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:取消 / 创建(无下边框) */}
      <div className="flex items-center h-11 px-3 bg-white shrink-0">
        <button
          {...bindBack()}
          className="text-[15px] bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
        >
          取消
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>创建豆列</div>
        <button
          {...bindTap('doulist.createSubmit-open', {
            beforeTrigger: () => {
              createDoulist(name.trim(), intro.trim(), !isPublic);
              toast('创建成功');
            },
          })}
          disabled={!canCreate}
          className="px-4 h-7 rounded-md text-sm font-semibold border-none cursor-pointer"
          style={{ background: canCreate ? C.green : '#BFE9C6', color: '#fff' }}
        >
          创建
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 上传封面:整行横幅 */}
        <button
          {...bindTap({ kind: 'action', id: 'doulist.form.cover.wontfix' }, { onTrigger: () => {
            void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((result) => {
              if (!result.cancelled && result.selected[0]) setCover(result.selected[0].uri);
            });
          } })}
          className="w-full flex items-center gap-3 border-none cursor-pointer bg-transparent px-0 py-1"
        >
          {cover ? (
            <Img src={cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          ) : (
            <span
              className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#F2F3F5', color: C.sub }}
            >
              <span className="text-2xl leading-none">+</span>
            </span>
          )}
          <span className="flex-1 text-left text-[15px]" style={{ color: C.text }}>上传封面</span>
          <span className="text-lg shrink-0" style={{ color: '#C4C9D0' }}>›</span>
        </button>

        {/* 封面行下整宽分隔线 */}
        <div className="mt-3 -mx-4 h-px" style={{ background: C.border }} />

        {/* 名称 */}
        <div className="mt-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="给豆列起个好名字吧"
            data-action="doulist.form.name.input"
            data-action-type="input"
            className="w-full text-[16px] font-medium py-2 outline-none border-none bg-transparent"
            style={{ color: C.text }}
          />
          <div className="-mx-4 h-px" style={{ background: C.border }} />
        </div>

        {/* 介绍 */}
        <div className="mt-3">
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value.slice(0, 200))}
            placeholder="介绍一下这个豆列"
            rows={4}
            data-action="doulist.form.name.input"
            data-action-type="input"
            className="w-full resize-none text-sm outline-none border-none bg-transparent leading-relaxed"
            style={{ color: C.text }}
          />
        </div>
      </div>

      {/* 可见性:悬浮胶囊(键盘上方,右下角) */}
      <div className="absolute right-4 bottom-3 flex justify-end pointer-events-none" data-keep-keyboard="true">
        <button
          {...bindTap({ kind: 'action', id: 'doulist.form.visibility.toggle' }, {
            params: { target: isPublic ? 'private' : 'public' },
            onTrigger: () => setIsPublic((v) => !v),
          })}
          className="pointer-events-auto flex items-center gap-1 rounded-full px-3 py-1.5 border-none cursor-pointer shadow-sm"
          style={{ background: '#F2F3F5', color: C.sub }}
        >
          <span className="text-[13px]">{isPublic ? '🌐 公开' : '🔒 仅自己'}</span>
        </button>
      </div>
    </div>
  );
}

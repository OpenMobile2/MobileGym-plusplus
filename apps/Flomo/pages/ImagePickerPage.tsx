import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet } from '../components/Sheet';
import { C } from '../components/ui';

const SAMPLES = ['memo_cat', 'memo_note', 'memo_book', 'memo_coffee', 'me'].map((s) =>
  s === 'me' ? `/@app-assets/Flomo/avatars/${s}.png` : `/@app-assets/Flomo/images/${s}.png`,
);

export default function ImagePickerPage() {
  const { bindTap, back } = useFlomoGestures();
  const addDraftImage = useFlomoStore((s) => s.addDraftImage);
  const draftImages = useFlomoStore((s) => s.composeDraftImages);
  const toast = useFlomoStore((s) => s.toast);

  return (
    <Sheet title="选择照片(可多选)">
      <div className="flex px-5 pb-2 gap-4 text-sm">
        <span style={{ color: C.green, fontWeight: 600 }}>相片</span>
        <button
          {...bindTap({ kind: 'action', id: 'image.picker.tab.select.album' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
        >
          选集
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 px-3 max-h-72 overflow-y-auto">
        {SAMPLES.map((src) => {
          const picked = draftImages.includes(src);
          return (
            <button
              key={src}
              {...bindTap({ kind: 'action', id: 'image.picker.select.photo' }, { onTrigger: () => { addDraftImage(src); toast('已选择'); } })}
              className="relative aspect-square rounded-lg overflow-hidden border-none cursor-pointer p-0"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {picked && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: C.green }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-5 pt-3">
        <button
          {...bindTap({ kind: 'action', id: 'image.picker.confirm.insert' }, { onTrigger: () => back() })}
          className="w-full h-10 rounded-full border-none cursor-pointer text-white font-medium"
          style={{ background: C.green }}
        >
          确认（{draftImages.length}）
        </button>
      </div>
    </Sheet>
  );
}

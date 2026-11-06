import React, { useEffect, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet } from '../components/Sheet';
import { C } from '../components/ui';
import * as MediaService from '@/os/MediaService';
import { pickImagesFromAlbum } from '../capabilities';

export default function ImagePickerPage() {
  const { bindTap, back } = useFlomoGestures();
  const addDraftImage = useFlomoStore((s) => s.addDraftImage);
  const draftImages = useFlomoStore((s) => s.composeDraftImages);
  const toast = useFlomoStore((s) => s.toast);
  const [items, setItems] = useState(() => MediaService.getMediaItems({ type: 'image' }));

  useEffect(() => {
    setItems(MediaService.getMediaItems({ type: 'image' }));
  }, []);

  const visibleItems = items.filter((item) => Boolean(item.uri));

  const openSystemPicker = async () => {
    const r = await pickImagesFromAlbum({ multiple: true, maxSelect: 9 });
    if (r.cancelled || !r.selected.length) return;
    r.selected.forEach((m) => addDraftImage(m.uri));
    setItems(MediaService.getMediaItems({ type: 'image' }));
    toast(`已选择 ${r.selected.length} 张`);
  };

  return (
    <Sheet title="选择照片(可多选)">
      <div className="flex px-5 pb-2 gap-4 text-sm">
        <span style={{ color: C.green, fontWeight: 600 }}>相片</span>
        <button
          {...bindTap({ kind: 'action', id: 'image.picker.tab.select.album' }, { onTrigger: () => { void openSystemPicker(); } })}
          className="bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
        >
          系统相册
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 px-3 max-h-72 overflow-y-auto">
        {visibleItems.length === 0 ? (
          <button
            {...bindTap({ kind: 'action', id: 'image.picker.tab.select.album' }, { onTrigger: () => { void openSystemPicker(); } })}
            className="col-span-3 py-8 text-sm border-none cursor-pointer bg-transparent"
            style={{ color: C.sub }}
          >
            暂无图片，点此从系统相册选择
          </button>
        ) : (
          visibleItems.map((item, index) => {
            const picked = draftImages.includes(item.uri);
            return (
              <button
                key={item.id || item.uri || `photo-${index}`}
                {...bindTap({ kind: 'action', id: 'image.picker.select.photo' }, {
                  onTrigger: () => { addDraftImage(item.uri); toast('已选择'); },
                })}
                aria-label={`照片 ${index + 1}${picked ? '，已选择' : ''}`}
                aria-pressed={picked}
                className="relative aspect-square rounded-lg overflow-hidden border-none cursor-pointer p-0"
              >
                <img src={item.uri} alt="" className="w-full h-full object-cover" />
                {picked && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: C.green }}>✓</span>
                )}
              </button>
            );
          })
        )}
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

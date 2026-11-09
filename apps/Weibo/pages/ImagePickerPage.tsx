import React, { useEffect, useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useComposeSession } from '../components/composeStore';
import { useStrings, useToast, Img } from '../components/ui';
import { IcClose, IcCamera } from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import * as MediaService from '@/os/MediaService';

export default function ImagePickerPage() {
  const s = useStrings();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const session = useComposeSession();
  const [gallery, setGallery] = useState(() => MediaService.getMediaItems({ type: 'image' }).map((m) => m.uri));
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setGallery(MediaService.getMediaItems({ type: 'image' }).map((m) => m.uri));
  }, []);

  const toggle = (img: string) => {
    setSelected((prev) => (prev.includes(img) ? prev.filter((x) => x !== img) : prev.length + session.images.length < 9 ? [...prev, img] : prev));
  };

  const openSystem = () => {
    void pickImages({ multiple: true, maxSelect: 9 - session.images.length }).then((r) => {
      if (r.cancelled || !r.selected.length) return;
      const uris = r.selected.map((x) => x.uri);
      setGallery((prev) => [...uris, ...prev.filter((u) => !uris.includes(u))]);
      setSelected((prev) => [...prev, ...uris].slice(0, 9 - session.images.length));
      toast(`已选 ${uris.length} 张`);
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcClose size={22} /></button>
        <div className="flex-1 text-center text-[15px] font-semibold">图片和视频 ▾</div>
        <button
          {...bindTap({ kind: 'action', id: 'imagePicker.system.open' }, { onTrigger: openSystem })}
          className="text-[12px] text-[#FF8200] bg-transparent border-none cursor-pointer"
        >
          系统相册
        </button>
      </div>
      <div className="flex gap-5 px-4 h-9 items-center shrink-0 text-[13px]">
        <span className="text-[#1A1A1A] font-semibold border-b-2 border-[#FF8200] pb-1">全部</span>
        <span className="text-[#7F7F7F]">图片</span>
        <span className="text-[#7F7F7F]">视频</span>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="image-grid" data-scroll-direction="vertical">
        <div className="grid grid-cols-4 gap-0.5">
          <button
            {...bindTap({ kind: 'action', id: 'imagePicker.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="aspect-square bg-[#F0F0F0] border-none cursor-pointer flex flex-col items-center justify-center text-[#7F7F7F] gap-1"
          >
            <IcCamera size={24} />
            <span className="text-[10px]">拍摄</span>
          </button>
          {gallery.length === 0 ? (
            <button
              {...bindTap({ kind: 'action', id: 'imagePicker.system.open' }, { onTrigger: openSystem })}
              className="col-span-3 aspect-square border-none cursor-pointer text-[12px] text-[#7F7F7F] bg-[#FAFAFA]"
            >
              从系统相册选择
            </button>
          ) : (
            gallery.map((img) => {
              const idx = selected.indexOf(img);
              return (
                <button
                  key={img}
                  {...bindTap({ kind: 'action', id: 'imagePicker.item.toggle' }, {
                    params: { imageId: img.split('/').pop() ?? img },
                    onTrigger: () => toggle(img),
                  })}
                  className="relative aspect-square border-none cursor-pointer p-0 bg-[#F5F5F5]"
                >
                  <Img src={img} label="图" className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-1 right-1 w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                      idx >= 0 ? 'bg-[#FF8200] text-white' : 'border-2 border-white bg-black/20'
                    }`}
                  >
                    {idx >= 0 ? idx + 1 : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center px-4 h-12 border-t border-[#F2F2F2] shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'imagePicker.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[13px] text-[#5B5B5B] bg-transparent border-none cursor-pointer"
        >
          ○ 原图
        </button>
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'imagePicker.select.confirm' }, {
            onTrigger: () => {
              if (!selected.length) return;
              session.set({ images: [...session.images, ...selected].slice(0, 9) });
              back();
            },
          })}
          disabled={!selected.length}
          className={`h-8 px-4 rounded-lg text-white text-[13px] border-none cursor-pointer ${selected.length ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
        >
          下一步{selected.length ? `(${selected.length})` : ''}
        </button>
      </div>
      {toastNode}
    </div>
  );
}

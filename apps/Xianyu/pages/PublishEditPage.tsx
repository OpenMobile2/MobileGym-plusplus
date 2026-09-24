import React, { useState } from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemImage } from '../components/ItemImage';
import { useToast } from '../components/ui';
import { CONDITIONS } from '../constants';
import { IcClose, IcPlus, IcSparkles, IcCheck } from '../res/icons';
import { pickImages } from '@/os/albumBridge';

/** 发布分类。 */
const CATEGORIES = ['数码', '手机', '图书', '家具', '潮流', '生活', '收藏', '其他'];

const AI_DESC =
  '自用闲置,九成新无磕碰,功能一切正常,配件齐全。因换新出闲置,诚心可小刀,支持验货,放心拍~';

export default function PublishEditPage() {
  const { bindTap, bindBack, go } = useXianyuGestures();
  const [toast, showToast] = useToast();

  const publishItem = useXianyuStore((s) => s.publishItem);
  const saveDraft = useXianyuStore((s) => s.saveDraft);

  const [hasImage, setHasImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<string>(CONDITIONS[2]); // 95新
  const [inspected, setInspected] = useState(false);

  const draftPayload = () => ({
    title: desc.trim().slice(0, 20) || '闲置好物',
    desc: desc.trim(),
    price: price ? Number(price) : null,
    condition,
    category,
    images: imageUri ? [imageUri] : hasImage ? ['placeholder'] : [],
    inspected,
  });

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部:关闭 + 标题 */}
      <div className="h-12 flex items-center px-2 shrink-0 bg-white border-b border-[#EEE]">
        <button {...bindBack()} aria-label="关闭" className="bg-transparent border-none cursor-pointer">
          <IcClose size={24} className="text-[#111]" />
        </button>
        <div className="flex-1 text-center font-semibold text-[17px] text-[#111]">发闲置</div>
        <div className="w-8" />
      </div>

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="PublishEditPage-main"
        data-scroll-direction="vertical"
      >
        {/* 添加首图(本地布尔) */}
        <div className="bg-white p-3">
          <button
            {...bindTap({ kind: 'action', id: 'publish.image.pick' }, {
              onTrigger: () => {
                void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setImageUri(r.selected[0].uri);
                  setHasImage(true);
                });
              },
            })}
            className="w-24 h-24 rounded-lg border border-dashed border-[#DDD] bg-[#FAFAFA] flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden p-0"
          >
            {imageUri ? (
              <img src={imageUri} alt="" className="w-full h-full object-cover" />
            ) : hasImage ? (
              <ItemImage seed="publish-cover" category={category} label={desc || '闲置'} className="w-full h-full" />
            ) : (
              <>
                <IcPlus size={26} className="text-[#BBB]" />
                <span className="text-[11px] text-[#999]">添加图片</span>
              </>
            )}
          </button>
          <div className="text-[11px] text-[#BBB] mt-1">上传第一张作为宝贝主图</div>
        </div>

        {/* 描述 + AI帮你写 */}
        <div className="bg-white mt-2 p-3">
          <textarea
            {...bindTap({ kind: 'action', id: 'publish.desc.input' }, { onTrigger: () => {} })}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述一下宝贝的品牌型号、新旧程度、入手渠道等~"
            className="w-full h-24 text-[14px] text-[#1A1A1A] border-none outline-none resize-none bg-transparent"
          />
          <div className="flex justify-end">
            <button
              {...bindTap(
                { kind: 'action', id: 'publish.aiWrite.fill' },
                { onTrigger: () => { setDesc(AI_DESC); showToast('已为你生成描述'); } },
              )}
              className="inline-flex items-center gap-1 text-[12px] text-[#FF6A00] bg-[#FFF3E0] px-3 py-1.5 rounded-full border-none cursor-pointer"
            >
              <IcSparkles size={14} /> AI帮你写
            </button>
          </div>
        </div>

        {/* 价格 */}
        <div className="bg-white mt-2 px-3 py-3 flex items-center">
          <span className="text-[14px] text-[#111] w-20">价格</span>
          <span className="text-[#FF3B30] text-[16px] font-bold mr-1">¥</span>
          <input
            {...bindTap({ kind: 'action', id: 'publish.price.input' }, { onTrigger: () => {} })}
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="decimal"
            placeholder="0.00"
            className="flex-1 text-[16px] text-[#FF3B30] font-bold border-none outline-none bg-transparent"
          />
        </div>

        {/* 分类 select */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[14px] text-[#111] mb-2">分类</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                {...bindTap(
                  { kind: 'action', id: 'publish.category.select.target' },
                  { params: { target: c }, onTrigger: () => setCategory(c) },
                )}
                className={`px-3 py-1.5 rounded-full text-[13px] border cursor-pointer ${
                  category === c ? 'border-[#FF3B30] text-[#FF3B30] bg-[#FFF3F0]' : 'border-[#EEE] text-[#666] bg-white'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* 成色 select */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[14px] text-[#111] mb-2">成色</div>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                {...bindTap(
                  { kind: 'action', id: 'publish.condition.select.target' },
                  { params: { target: c }, onTrigger: () => setCondition(c) },
                )}
                className={`px-3 py-1.5 rounded-full text-[13px] border cursor-pointer ${
                  condition === c ? 'border-[#FF3B30] text-[#FF3B30] bg-[#FFF3F0]' : 'border-[#EEE] text-[#666] bg-white'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* 验货宝开关 */}
        <button
          {...bindTap(
            { kind: 'action', id: 'publish.inspect.toggle' },
            { onTrigger: () => setInspected((v) => !v) },
          )}
          className="bg-white mt-2 px-3 py-3 flex items-center gap-2 w-full border-none cursor-pointer text-left"
        >
          <div className="flex-1">
            <div className="text-[14px] text-[#111]">开启验货宝</div>
            <div className="text-[12px] text-[#999]">平台质检后再发货,买家更放心</div>
          </div>
          <span className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${inspected ? 'bg-[#1CB854] justify-end' : 'bg-[#DDD] justify-start'}`}>
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              {inspected && <IcCheck size={13} className="text-[#1CB854]" />}
            </span>
          </span>
        </button>
      </div>

      {/* 底部:存草稿 / 发布 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center gap-2 px-3 py-2" data-hide-on-keyboard>
        <button
          {...bindTap(
            { kind: 'action', id: 'publish.draft.save' },
            { onTrigger: () => { saveDraft(draftPayload()); showToast('已存入草稿箱'); } },
          )}
          className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[#333] text-[15px] font-semibold border-none cursor-pointer"
        >存草稿</button>
        <button
          {...bindTap(
            { kind: 'action', id: 'publish.submit.commit' },
            {
              onTrigger: () => {
                if (!hasImage) { showToast('还需要图片才能发布'); return; }
                publishItem(draftPayload());
                go('mine.published-open');
              },
            },
          )}
          className="flex-[2] h-10 rounded-full text-white text-[15px] font-semibold border-none cursor-pointer"
          style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
        >发布</button>
      </div>
      {toast}
    </div>
  );
}

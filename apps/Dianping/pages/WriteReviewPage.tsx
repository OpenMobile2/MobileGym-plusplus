import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcStar } from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import { getFileUriAsync } from '@/os/FileSystemService';

export default function WriteReviewPage() {
  const { shopId = '' } = useParams();
  const [sp] = useSearchParams();
  const sheet = sp.get('sheet');
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, back } = useDianpingGestures();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const draft = useDianpingStore((st) => st.draftReview);
  const setDraftReview = useDianpingStore((st) => st.setDraftReview);
  const publishReview = useDianpingStore((st) => st.publishReview);
  const saveReviewDraft = useDianpingStore((st) => st.saveReviewDraft);
  const showToast = useDianpingStore((st) => st.showToast);
  const [score, setScore] = useState(draft?.shopId === shopId ? draft.score : 0);
  const [taste, setTaste] = useState(draft?.taste || 0);
  const [env, setEnv] = useState(draft?.env || 0);
  const [service, setService] = useState(draft?.service || 0);
  const [body, setBody] = useState(draft?.body || '');
  const [avgPrice, setAvgPrice] = useState(draft?.avgPrice || '');
  const [dishIds, setDishIds] = useState<string[]>(draft?.dishIds || []);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (shopId) {
      setDraftReview({
        shopId,
        score,
        taste,
        env,
        service,
        body,
        avgPrice,
        dishIds,
        photos,
      });
    }
  }, [shopId, score, taste, env, service, body, avgPrice, dishIds, photos, setDraftReview]);

  if (!shop) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  const StarRow = ({
    value,
    onPick,
    label,
  }: {
    value: number;
    onPick: (n: number) => void;
    label: string;
  }) => (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-10 text-[12px] text-[#666]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="cursor-pointer border-none bg-transparent p-0"
            {...action('write.score.select.target', () => onPick(n), { params: { score: n } })}
          >
            <IcStar size={22} className={n <= value ? 'text-[#FF6633]' : 'text-[#E0E0E0]'} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col bg-[#FFF5F0]" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 bg-white/80 px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">{s.writeReview}</div>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 pb-20 pt-2"
        data-scroll-container="write-review"
        data-scroll-direction="vertical"
      >
        <div className="rounded-[12px] bg-white p-3">
          <div className="truncate text-[14px] font-medium text-[#222]">{shop.name}</div>
          <StarRow value={score} onPick={setScore} label={s.overall} />
          {score > 0 ? (
            <>
              <StarRow value={taste} onPick={setTaste} label={s.taste} />
              <StarRow value={env} onPick={setEnv} label={s.env} />
              <StarRow value={service} onPick={setService} label={s.service} />
            </>
          ) : null}
        </div>
        <div className="mt-2 rounded-[12px] bg-white p-3">
          <textarea
            className="min-h-[120px] w-full resize-none border-none text-[14px] outline-none"
            placeholder={s.reviewPlaceholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((uri) => (
              <img key={uri} src={uri} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-dashed border-[#DDD] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#999]"
              {...action('write.media.pick', () => {
                void pickImages({ multiple: true, maxSelect: 9 - photos.length }).then(async (r) => {
                  if (r.cancelled || !r.selected.length) return;
                  // IndexedDB 相册图的同步 uri 为空,需异步取 Blob URL,否则评价里显示不出图
                  const uris = await Promise.all(
                    r.selected.map(async (x) => {
                      if (x.uri) return x.uri;
                      try {
                        return (await getFileUriAsync(x.path)) ?? '';
                      } catch {
                        return '';
                      }
                    }),
                  );
                  setPhotos((prev) => [...prev, ...uris.filter(Boolean)].slice(0, 9));
                });
              })}
            >
              + {s.addPhoto}
            </button>
          </div>
        </div>
        <div className="mt-2 rounded-[12px] bg-white px-3 py-2">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-2 text-left text-[13px]"
            {...bindTap('write.dish-open', { params: { shopId: shop.id } })}
          >
            <span>{s.pickDishes}</span>
            <span className="text-[#999]">
              {dishIds.length ? `${dishIds.length}` : s.pleaseSelect} ›
            </span>
          </button>
          <div className="flex items-center gap-2 border-t border-[#F5F5F5] py-2">
            <span className="text-[13px] text-[#666]">{s.avgPriceInput}</span>
            <input
              className="flex-1 border-none bg-transparent text-[13px] outline-none"
              placeholder="例如 94"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex gap-2 border-t border-[#EEE] bg-white p-3">
        <button
          type="button"
          className="cursor-pointer rounded-full border border-[#DDD] bg-white px-4 py-2.5 text-[14px] text-[#666]"
          {...action('write.draft.save.action', () => {
            saveReviewDraft({ shopId: shop.id, shopName: shop.name, score, body });
            showToast(s.draftSaved);
          })}
        >
          {s.saveDraft}
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border-none bg-[#FF6600] py-2.5 text-[15px] font-semibold text-white"
          {...action('write.publish.commit', () => {
            if (score < 1) {
              showToast(s.pleaseRate);
              return;
            }
            publishReview();
            showToast(s.publishOk);
            back();
          })}
        >
          {s.publish}
        </button>
      </div>

      {sheet === 'dishes' ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40">
          <div className="max-h-[60%] overflow-y-auto rounded-t-2xl bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold">{s.pickDishes}</span>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent text-[13px] text-[#FF6633]"
                {...bindTap('write.dish-close', { params: { shopId: shop.id } })}
              >
                {s.done}
              </button>
            </div>
            {shop.dishes.map((d) => {
              const on = dishIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between border-none border-b border-[#F5F5F5] bg-transparent px-4 py-3 text-left"
                  {...action(
                    'write.dish.toggle',
                    () =>
                      setDishIds((prev) =>
                        on ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                      ),
                    { params: { id: d.id } },
                  )}
                >
                  <span className="text-[14px]">{d.name}</span>
                  <span className={on ? 'text-[#FF6633]' : 'text-[#CCC]'}>{on ? '✓' : '○'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

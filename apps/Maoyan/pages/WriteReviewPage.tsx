import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

const SCORE_WORDS = ['很差,想吐槽', '较差,不满意', '一般,还行吧', '较好,值得看', '棒极了,力力推荐'];
const TAGS = ['推荐', '演技', '画面', '剧情', '音乐', '氛围感强'];
const MIN_LEN = 5;

/** 写短评页(r2:星级+标签+字数门槛+发布) */
export default function WriteReviewPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap, bindBack } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();

  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === id));
  const watched = useMaoyanStore((st) => st.watched);
  const publishReview = useMaoyanStore((st) => st.publishReview);

  const prev = id ? watched[id] : undefined;
  const [stars, setStars] = React.useState(prev?.stars ?? 0); // 1~10
  const [text, setText] = React.useState(prev?.text ?? '');
  const [tags, setTags] = React.useState<string[]>([]);

  if (!movie) return <RecoverPage title={s.writeReview} text={s.movieNotFound} />;
  const editing = !!prev && prev.stars > 0;

  const canPublish = stars > 0 && tags.length > 0 && text.trim().length >= MIN_LEN;
  const hint = text.trim().length === 0
    ? '大家都在问:剧情怎么样,画面好吗,演技如何?'
    : text.trim().length < MIN_LEN
      ? `再写${MIN_LEN - text.trim().length}个字,就能发布啦`
      : text.trim().length < 20
        ? `再写${20 - text.trim().length}字,有机会被推荐`
        : '很棒!有机会被推荐到热评';

  return (
    <div className="flex flex-col h-full bg-app-surface relative" data-status-bar-foreground={statusFg}>
      {toast}
      <div className="flex items-center h-11 px-3 shrink-0 border-b border-app-border">
        <button {...bindBack()} className="text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer">取消</button>
        <div className="flex-1 text-center">
          <div className="text-[15px] font-semibold text-app-text">{editing ? s.editReview : s.writeReview}</div>
          <div className="text-[10px] text-(--app-c-text-3)">{movie.title}</div>
        </div>
        {canPublish ? (
          <button
            {...bindTap('writereview.publish-submit', {
              params: { id: movie.id },
              beforeTrigger: () => publishReview(movie.id, stars, text.trim(), tags),
            })}
            className="text-[14px] text-white rounded-full px-4 py-1 border-none cursor-pointer"
            style={{ background: MY.cta }}
          >
            发布
          </button>
        ) : (
          <button
            onClick={() => showToast(stars === 0 ? '先拉动星星评分吧' : tags.length === 0 ? '请至少选择一个标签' : `满${MIN_LEN}字才能发布哦`)}
            className="text-[14px] text-white rounded-full px-4 py-1 border-none cursor-pointer opacity-40"
            style={{ background: MY.cta }}
          >
            发布
          </button>
        )}
      </div>

      <div className="px-5 pt-5">
        <div className="text-[12px] text-(--app-c-text-3)">审核通过后,有机会获得成长值 <span className="text-(--app-c-gold-text)">在猫眼标记了{Object.keys(watched).length}部作品</span></div>
        {/* 星级:5星,每星=2分 */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[13px] text-app-text-muted">评分</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              {...bindTap({ kind: 'action', id: 'writereview.stars.input' }, {
                params: { value: String(i * 2) },
                onTrigger: () => setStars(i * 2),
              })}
              className="bg-transparent border-none cursor-pointer text-[26px] p-0 leading-none"
              style={{ color: stars >= i * 2 ? MY.scoreOrange : 'var(--app-c-border-strong)' }}
              aria-label={`${i * 2}分`}
            >
              ★
            </button>
          ))}
          {stars > 0 && <span className="text-[13px]" style={{ color: MY.scoreOrange }}>{SCORE_WORDS[Math.ceil(stars / 2) - 1]}</span>}
        </div>

        <textarea
          {...bindTap({ kind: 'action', id: 'writereview.text.input' }, { params: { value: 'text' }, onTrigger: () => { /* 受控输入 */ } }) as any}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="大家都在问:剧情怎么样,画面好吗,演技如何?"
          className="mt-4 w-full h-40 text-[15px] leading-relaxed border-none outline-none resize-none bg-transparent"
        />
        <div className="text-[11px] text-(--app-c-text-4)">{hint}</div>

        {/* 小标签 */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'writereview.tag.toggle' }, {
                  params: { id: t },
                  onTrigger: () => {
                    setTags((prev2) => on ? prev2.filter((x) => x !== t) : [...prev2, t]);
                  },
                })}
                className={`text-[12px] rounded-full px-3 py-1 border cursor-pointer ${on ? 'border-[#DC4038] text-[#DC4038] bg-(--app-c-brand-tint)' : 'border-(--app-c-border-strong) text-app-text-muted bg-app-surface'}`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

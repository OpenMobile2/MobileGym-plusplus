import React, { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img } from '../components/ui';
import { MarkStatusTabs, StarPicker, TagChips } from '../components/MarkSheetCore';
import type { MarkStatus } from '../types';
import { shareWithSystem } from '../capabilities';

// 节点: subject.markSheet —— 标记/评分全屏弹层(书影音共用)。
// 来源条目约定取 history[0](路由无参);初始 tab 经 location.state.status 传入。
// evidence: IMG_F8b7ecc_t0045/t0047/t0068, IMG_Ff60ef9_t0063/t0069

export default function SubjectMarksheetPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const history = useDoubanStore((s) => s.history);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const markSubject = useDoubanStore((s) => s.markSubject);

  const subject = useMemo(() => {
    const h = history.find((x) => x.kind === 'subject');
    return subjects.find((s) => s.id === h?.refId) ?? subjects.find((s) => s.id === 'bk2') ?? subjects[0];
  }, [history, subjects]);
  const mark = useMemo(() => marks.find((m) => m.subjectId === subject.id), [marks, subject.id]);

  const navState = (location.state ?? {}) as { status?: MarkStatus };
  const [status, setStatus] = useState<MarkStatus>(navState.status ?? mark?.status ?? 'wish');
  const [stars, setStars] = useState<number>(mark?.rating ?? 0);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [customTags, setCustomTags] = useState<string[]>(
    (mark?.tags ?? []).filter((t) => !(subject.presetTags ?? []).includes(t)),
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(mark?.tags ?? []);
  const [comment, setComment] = useState(mark?.comment ?? '');
  const [shareChecked, setShareChecked] = useState(false);
  const [syncFeed, setSyncFeed] = useState(mark?.syncToFeed ?? true);
  const [newTagText, setNewTagText] = useState('');

  const newTagOpen = searchParams.get('newTag') === 'open';
  const achievementOpen = searchParams.get('ach') === '1';

  const bookDoneCount = useMemo(
    () =>
      marks.filter(
        (m) => m.status === 'done' && subjects.some((s) => s.id === m.subjectId && s.type === 'book'),
      ).length,
    [marks, subjects],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const submitNewTag = () => {
    const t = newTagText.trim().slice(0, 24);
    if (!t) {
      toast('请输入标签内容');
      return;
    }
    toast('添加中');
    if (!customTags.includes(t) && !(subject.presetTags ?? []).includes(t)) {
      setCustomTags((prev) => [...prev, t]);
    }
    setSelectedTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setNewTagText('');
    back(); // 关闭弹窗(?newTag=open 出栈)
  };

  const confirmSubmit = () => {
    toast('评分中');
    markSubject(subject.id, status, {
      rating: status === 'wish' ? null : stars > 0 ? stars : null,
      tags: selectedTags,
      comment,
      syncToFeed: syncFeed,
    });
    if (shareChecked) {
      const launched = shareWithSystem(`【豆瓣】我${status === 'done' ? '看过' : status === 'doing' ? '在看' : '想看'}《${subject.title}》`, (r) => {
        if (r.resultCode === 'OK') toast('分享成功');
      });
      if (!launched) toast('无法打开系统分享');
    }
    if (subject.type === 'book' && status === 'done') {
      // 图书读过 → 成就弹层(replace,使弹层「取消」一步返回条目页)
      setSearchParams(
        (p) => {
          p.set('ach', '1');
          return p;
        },
        { replace: true },
      );
      return;
    }
    back();
  };

  return (
    <div className="flex flex-col h-full relative bg-white" data-status-bar-foreground="dark">
      {/* 顶栏:取消 / 确定(金色) */}
      <div className="flex items-center justify-between h-12 px-4 shrink-0">
        <button
          {...bindBack()}
          className="text-[15px] bg-transparent border-none cursor-pointer p-0"
          style={{ color: C.text }}
        >
          取消
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'subject.markSheet.confirm.submit' }, { onTrigger: confirmSubmit })}
          className="text-[15px] font-semibold bg-transparent border-none cursor-pointer p-0"
          style={{ color: C.gold }}
        >
          确定
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 顶栏下方直接是状态 tab / 星区(真机无条目缩略行,evidence t0040/t0045/t0060) */}

        {/* 状态三tab(电影两tab,书/音乐三tab) */}
        <MarkStatusTabs
          type={subject.type}
          active={status}
          bindTab={(st) =>
            bindTap(
              { kind: 'action', id: 'subject.markSheet.tab.select.status' },
              { params: { status: st }, onTrigger: () => setStatus(st) },
            )
          }
        />

        {/* 五星评分 + 实时文案(想读/想听 tab 隐藏) */}
        {status !== 'wish' && (
          <StarPicker
            value={stars}
            bindStar={(n) =>
              bindTap(
                { kind: 'action', id: 'subject.markSheet.star.set' },
                { params: { value: n }, onTrigger: () => setStars(n) },
              )
            }
          />
        )}

        {/* 选择标签折叠区 */}
        <div className="mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'subject.markSheet.tags.toggle' }, { onTrigger: () => setTagsOpen((v) => !v) })}
            className="w-full flex items-center justify-center gap-1 py-1.5 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: C.sub }}
          >
            选择标签 {tagsOpen ? '⌃' : '⌄'}
          </button>
          {tagsOpen && (
            <div className="flex justify-center">
              <TagChips
                presetTags={subject.presetTags ?? []}
                customTags={customTags}
                selected={selectedTags}
                bindTag={(tag) =>
                  bindTap(
                    { kind: 'action', id: 'subject.markSheet.tag.toggle' },
                    { params: { tag }, onTrigger: () => toggleTag(tag) },
                  )
                }
                bindNewTag={bindTap(
                  { kind: 'action', id: 'subject.markSheet.newTag.open' },
                  {
                    onTrigger: () =>
                      setSearchParams((p) => {
                        p.set('newTag', 'open');
                        return p;
                      }),
                  },
                )}
              />
            </div>
          )}
        </div>

        {/* 短评输入框 */}
        <div className="px-4 mt-3">
          <textarea
            {...bindTap({ kind: 'action', id: 'subject.markSheet.comment.input' }, { params: { value: comment }, onTrigger: () => {} })}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写几句评价吧…"
            rows={5}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${C.border}`, color: C.text, background: '#fff' }}
          />
        </div>

        {/* 分享 checkbox(装饰) */}
        <button
          {...bindTap({ kind: 'action', id: 'subject.markSheet.shareCheck.toggle' }, { onTrigger: () => setShareChecked((v) => !v) })}
          className="mx-auto mt-3 flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-xs"
          style={{ color: shareChecked ? C.green : '#B9BEC6' }}
        >
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ border: shareChecked ? 'none' : '1.5px solid #C3C9D1', background: shareChecked ? C.green : 'transparent' }}
          >
            {shareChecked && (
              <svg width="9" height="9" viewBox="0 0 10 10">
                <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </span>
          发布后分享到微信、微博
        </button>
      </div>

      {/* 底部:同步到 —— 居中堆叠,无分隔线(evidence t0040/t0060) */}
      <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col items-center gap-1.5" data-hide-on-keyboard="true">
        <span className="text-xs" style={{ color: C.sub }}>同步到</span>
        <button
          {...bindTap({ kind: 'action', id: 'subject.markSheet.syncFeed.toggle' }, { onTrigger: () => setSyncFeed((v) => !v) })}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-sm"
          style={{ color: syncFeed ? C.green : C.sub }}
        >
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ border: syncFeed ? 'none' : `1.5px solid ${C.border}`, background: syncFeed ? C.green : 'transparent' }}
          >
            {syncFeed && (
              <svg width="9" height="9" viewBox="0 0 10 10">
                <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </span>
          我的动态
        </button>
      </div>

      {/* ---------------- 添加标签弹窗(?newTag=open) ---------------- */}
      {newTagOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-9">
          <div {...bindBack()} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div className="relative w-full rounded-2xl overflow-hidden bg-white">
            <div className="px-5 pt-5 text-center text-base font-semibold" style={{ color: C.text }}>添加标签</div>
            {/* 副标题在输入框上方居中(evidence t0068) */}
            <div className="px-5 pt-1.5 text-center text-[12px] leading-snug" style={{ color: C.sub }}>
              请输入你想添加的标签<br />最多24个字符
            </div>
            <div className="px-5 py-3">
              <input
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value.slice(0, 24))}
                placeholder="输入标签"
                maxLength={24}
                autoFocus
                className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                style={{ background: '#fff', color: C.text, border: `1px solid ${C.border}` }}
              />
            </div>
            <div className="flex border-t" style={{ borderColor: C.border }}>
              <button
                {...bindTap({ kind: 'action', id: 'subject.markSheet.newTag.cancel' }, { onTrigger: () => back() })}
                className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px]"
                style={{ color: '#007AFF', borderRight: `1px solid ${C.border}` }}
              >
                取消
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'subject.markSheet.newTag.submit' }, { params: { value: newTagText }, onTrigger: submitNewTag })}
                className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px] font-semibold"
                style={{ color: '#007AFF' }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 图书读过成就弹层(?ach=1) ----------------
          真机:顶部仍露出条目页(非全屏);橙色面板从底部升起,内含白色手机样机,
          Lv.1 进度条在样机内部;底部为横排「取消 | 补充我的读书记录」(evidence t0048)。 */}
      {achievementOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" data-status-bar-foreground="light">
          <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.35)' }} />
          <div
            className="shrink-0 rounded-t-2xl px-6 pt-6 pb-4 flex flex-col items-center"
            style={{ background: 'linear-gradient(180deg,#F5871F 0%,#E96C12 100%)' }}
          >
            <div className="text-base font-bold text-white">标记读过的图书</div>
            {/* 白色手机样机:标记 UI 缩略 + Lv 进度条在内部 */}
            <div className="mt-4 w-44 rounded-2xl bg-white px-3 pt-4 pb-3 flex flex-col items-center shadow-xl">
              <Img src={subject.cover} className="w-16 h-[88px] rounded object-cover" />
              <div className="mt-2 text-xs font-semibold text-center" style={{ color: C.text }}>{subject.title}</div>
              <div className="mt-0.5 text-[10px]" style={{ color: C.sub }}>{currentUser.name} 的读书记录</div>
              <div className="mt-2.5 w-full flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0" style={{ background: '#E96C12' }}>Lv.1</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0E3D6' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(((bookDoneCount + 6) / 10) * 100, 100)}%`, background: '#E96C12' }} />
                </div>
                <span className="text-[9px] font-semibold shrink-0" style={{ color: '#E96C12' }}>{Math.min(bookDoneCount + 6, 10)}/10</span>
              </div>
            </div>
            {/* 底部横排两钮 */}
            <div className="mt-5 w-full flex gap-3">
              <button
                {...bindTap({ kind: 'action', id: 'subject.markSheet.achievement.close' }, { onTrigger: () => back() })}
                className="flex-1 h-11 rounded-full text-[15px] cursor-pointer border-none text-white"
                style={{ background: 'rgba(0,0,0,0.28)' }}
              >
                取消
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'subject.markSheet.achievement.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="flex-1 h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer"
                style={{ background: '#7A3B0E', color: '#F5C97A' }}
              >
                补充我的读书记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

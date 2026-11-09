// 统一发布编辑器(compose.editor,frame:944a47@t0003/t0006/t0008/t0035/t0046,qa:Q9=A):
// 草稿恢复弹窗(重新写/继续写)、标题+正文、《》条目绿链、#话题联想 chips(浏览量)、
// T 排版(B/无序/有序)、图片+版式弹层(画廊/图文混排)、投递到小组、发布→toast→落 feed 顶部。
import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, fmtCount } from '../components/ui';
import { CenterDialog, Sheet, SheetRow } from '../components/Sheet';
import { pickImagesFromAlbum } from '../capabilities';

type ImgLayout = 'gallery' | 'mixed';

export default function ComposeEditorPage() {
  const { bindTap, back } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const composeTitle = useDoubanStore((s) => s.composeTitle);
  const composeDraft = useDoubanStore((s) => s.composeDraft);
  const setComposeTitle = useDoubanStore((s) => s.setComposeTitle);
  const setComposeDraft = useDoubanStore((s) => s.setComposeDraft);
  const clearCompose = useDoubanStore((s) => s.clearCompose);
  const drafts = useDoubanStore((s) => s.drafts);
  const saveDraft = useDoubanStore((s) => s.saveDraft);
  const groups = useDoubanStore((s) => s.groups);
  const topics = useDoubanStore((s) => s.topics);
  const subjects = useDoubanStore((s) => s.subjects);
  const publishBroadcast = useDoubanStore((s) => s.publishBroadcast);
  const publishGroupPost = useDoubanStore((s) => s.publishGroupPost);
  const publishSubjectContent = useDoubanStore((s) => s.publishSubjectContent);
  const composeCtx = useDoubanStore((s) => s.composeCtx);
  const setComposeCtx = useDoubanStore((s) => s.setComposeCtx);

  // 发布器形态(由入口 setComposeCtx 决定):短评/影评/剧评/讨论/动态。挂载时快照并消费(避免泄漏到下次)。
  const [kind] = useState(() => composeCtx?.kind ?? 'broadcast');
  const noTitle = kind === 'comment'; // 短评无标题
  const CT_TEXT: Record<typeof kind, { title: string; body: string }> = {
    comment: { title: '', body: '写条短评,分享你的感受(140字内)' },
    review: { title: '影评标题', body: '写下你对这部作品的评价…' },
    discussion: { title: '讨论标题', body: '发起讨论,聊聊你的想法…' },
    broadcast: { title: '标题', body: '此刻你想要分享…' },
  };
  const ctText = CT_TEXT[kind];

  // 易失编辑态(标题/正文走 store,其余本地)
  const [images, setImages] = useState<string[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(() => composeCtx?.subjectId ?? null);
  React.useEffect(() => {
    // 消费启动意图,避免下次从别处打开时残留上一次的条目/形态
    if (composeCtx?.subjectId || (composeCtx && composeCtx.kind !== 'broadcast')) setComposeCtx({ kind: 'broadcast', subjectId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [imgLayout, setImgLayout] = useState<ImgLayout>('gallery');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // URL 驱动的弹层/条
  const draftResolved = searchParams.get('draft') === 'done';
  const subjectOpen = searchParams.get('subject') === 'open';
  const topicBarOpen = searchParams.get('topics') === '1';
  const fmtBarOpen = searchParams.get('fmt') === '1';
  const layoutOpen = searchParams.get('layout') === 'open';
  const groupOpen = searchParams.get('group') === 'open';
  const showDraftDialog = drafts.length > 0 && !draftResolved;

  const joinedGroups = useMemo(() => groups.filter((g) => g.joined), [groups]);
  const selectedGroup = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
  const selectedTopic = useMemo(() => topics.find((t) => t.id === topicId), [topics, topicId]);
  const subjectPool = useMemo(() => subjects.slice(0, 8), [subjects]);

  const canPublish = composeTitle.trim().length > 0 || composeDraft.trim().length > 0;

  const setParamReplace = (key: string, value: string | null) =>
    setSearchParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true },
    );
  const pushParam = (key: string, value: string) =>
    setSearchParams((p) => {
      p.set(key, value);
      return p;
    });

  const resolveDraft = (mode: 'continue' | 'rewrite') => {
    const d = drafts[0];
    if (mode === 'continue' && d) {
      setComposeTitle(d.title);
      setComposeDraft(d.text);
      setGroupId(d.groupId);
    } else {
      clearCompose();
    }
    setParamReplace('draft', 'done');
  };

  const doPublish = () => {
    const title = composeTitle.trim();
    const body = composeDraft.trim();
    if (groupId) {
      publishGroupPost(groupId, title || body.slice(0, 20), body, { images });
      toast(images.length > 0 ? '上传中…发布成功' : '发布成功');
      return;
    }
    // 条目内容形态:短评/影评·剧评/讨论 → 落到对应列表(而非动态)
    if (kind !== 'broadcast' && subjectId) {
      publishSubjectContent(kind, subjectId, title, body);
      const isTv = subjects.find((sb) => sb.id === subjectId)?.type === 'tv';
      const word = kind === 'comment' ? '短评' : kind === 'review' ? (isTv ? '剧评' : '影评') : '讨论';
      toast(`${word}已发布`);
      return;
    }
    publishBroadcast(title ? `${title}\n${body}` : body, {
      images,
      topicId,
      subjectCard: subjectId,
    });
    toast(images.length > 0 ? '上传中…发布成功' : '发布成功');
  };

  const exitAndSave = () => {
    if (composeTitle.trim() || composeDraft.trim()) {
      saveDraft(composeTitle, composeDraft, groupId);
      toast('已存入草稿箱(本地保存)');
    }
    clearCompose();
    back();
  };

  /** T 排版:对正文当前行首插入/切换前缀(所见即所得的轻量近似) */
  const applyFormat = (kind: 'bold' | 'ul' | 'ol') => {
    const el = bodyRef.current;
    const pos = el ? el.selectionStart : composeDraft.length;
    const lineStart = composeDraft.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
    if (kind === 'bold') {
      setComposeDraft(`${composeDraft.slice(0, pos)}**加粗文字**${composeDraft.slice(pos)}`);
      return;
    }
    const prefix = kind === 'ul' ? '• ' : '1. ';
    const line = composeDraft.slice(lineStart);
    if (line.startsWith(prefix)) {
      setComposeDraft(composeDraft.slice(0, lineStart) + line.slice(prefix.length));
    } else {
      setComposeDraft(composeDraft.slice(0, lineStart) + prefix + line);
    }
  };

  const toolbarBtn = 'w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer';

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      {/* 顶栏:X / +投递到小组 / 发布 */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'compose.exit.saveDraft' }, { onTrigger: exitAndSave })}
          className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          ×
        </button>
        {/* 灰底小方块仅「+」,文案在方块右侧白底灰字 */}
        <button
          {...bindTap({ kind: 'action', id: 'compose.groupDeliver.select' }, { onTrigger: () => pushParam('group', 'open') })}
          className="ml-1 flex items-center gap-1.5 border-none cursor-pointer text-sm bg-transparent p-0"
          style={{ color: selectedGroup ? C.text : C.sub }}
        >
          <span
            className="w-6 h-6 flex items-center justify-center rounded text-base leading-none"
            style={{ background: '#F2F3F5', color: C.sub }}
          >
            +
          </span>
          {selectedGroup ? selectedGroup.name : '投递到小组'}
        </button>
        <div className="flex-1" />
        {canPublish ? (
          <button
            {...bindTap('compose.publish-done', { beforeTrigger: doPublish })}
            className="px-4 h-8 rounded-lg text-sm font-semibold text-white border-none cursor-pointer"
            style={{ background: C.green }}
          >
            发布
          </button>
        ) : (
          <button
            {...bindTap('compose.publish-done', { onTrigger: () => toast('先写点内容吧') })}
            className="px-4 h-8 rounded-lg text-sm font-semibold text-white border-none cursor-pointer"
            style={{ background: '#B7E5BE' }}
          >
            发布
          </button>
        )}
      </div>

      {/* 编辑区 */}
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {!noTitle && (
          <>
            <input
              {...bindTap<HTMLInputElement>({ kind: 'action', id: 'compose.content.input' }, { onTrigger: () => undefined })}
              value={composeTitle}
              onChange={(e) => setComposeTitle(e.target.value)}
              placeholder={ctText.title}
              className="w-full h-12 text-lg font-semibold outline-none border-none bg-transparent"
              style={{ color: C.text }}
            />
            {/* 标题下细线仅空态显示,填入标题后隐藏 */}
            {composeTitle.trim().length === 0 && <div className="h-px" style={{ background: C.border }} />}
          </>
        )}
        {/* 已插内容 chips:条目绿链 / #话题# */}
        {(subjectId || topicId) && (
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            {subjectId && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[13px]"
                style={{ background: C.greenSoft, color: C.link }}
              >
                《{subjects.find((sb) => sb.id === subjectId)?.title ?? '条目'}》
                <button
                  onClick={() => setSubjectId(null)}
                  className="bg-transparent border-none cursor-pointer p-0 text-xs"
                  style={{ color: C.link }}
                  aria-label="移除条目"
                >
                  ×
                </button>
              </span>
            )}
            {topicId && selectedTopic && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[13px]"
                style={{ background: C.greenSoft, color: C.link }}
              >
                #{selectedTopic.name}#
                <button
                  onClick={() => setTopicId(null)}
                  className="bg-transparent border-none cursor-pointer p-0 text-xs"
                  style={{ color: C.link }}
                  aria-label="移除话题"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
        <textarea
          ref={bodyRef}
          value={composeDraft}
          onChange={(e) => setComposeDraft(e.target.value)}
          placeholder={ctText.body}
          rows={8}
          className="w-full resize-none outline-none border-none bg-transparent pt-3 text-[15px] leading-relaxed"
          style={{ color: C.text }}
        />
        {/* 已选图片(tap 缩略图 = 版式入口) */}
        {images.length > 0 && (
          <div className={imgLayout === 'gallery' ? 'flex gap-2 flex-wrap pb-3' : 'flex flex-col gap-2 pb-3'}>
            {images.map((src, i) => (
              <button
                key={`${src}_${i}`}
                {...bindTap({ kind: 'action', id: 'compose.imageLayout.select.target' }, {
                  params: { target: 'open' },
                  onTrigger: () => pushParam('layout', 'open'),
                })}
                className="relative p-0 border-none bg-transparent cursor-pointer"
              >
                <Img
                  src={src}
                  className={imgLayout === 'gallery' ? 'w-24 h-24 rounded object-cover' : 'w-full h-36 rounded object-cover'}
                />
                <span
                  className="absolute top-1 left-1 w-4 h-4 rounded text-[10px] text-white flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 话题联想 chips 条(键盘上方) */}
      {topicBarOpen && (
        <div
          className="shrink-0 flex gap-2 px-3 py-2 overflow-x-auto border-t"
          style={{ borderColor: C.border }}
          data-scroll-container="topic-suggest"
          data-scroll-direction="horizontal"
          data-keep-keyboard="true"
        >
          {topics.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'compose.topic.insert' }, {
                params: { topicId: t.id },
                onTrigger: () => {
                  setTopicId(t.id);
                  setParamReplace('topics', null);
                },
              })}
              className="shrink-0 px-3 py-1.5 rounded-full border-none cursor-pointer text-xs"
              style={{ background: '#F2F3F5', color: C.text }}
            >
              #{t.name}# <span style={{ color: C.sub }}>{fmtCount(t.views)}次浏览</span>
            </button>
          ))}
        </div>
      )}

      {/* T 排版条 */}
      {fmtBarOpen && (
        <div className="shrink-0 flex gap-2 px-3 py-2 border-t" style={{ borderColor: C.border }} data-keep-keyboard="true">
          {([
            ['bold', 'B 加粗'],
            ['ul', '• 无序列表'],
            ['ol', '1. 有序列表'],
          ] as ['bold' | 'ul' | 'ol', string][]).map(([kind, label]) => (
            <button
              key={kind}
              {...bindTap({ kind: 'action', id: 'compose.format.toggle' }, {
                params: { target: kind },
                onTrigger: () => applyFormat(kind),
              })}
              className="px-3 py-1.5 rounded-lg border-none cursor-pointer text-xs font-semibold"
              style={{ background: '#F2F3F5', color: C.text }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 底部工具栏:图片/《》/#/T/⊕/水印相机 */}
      <div className="shrink-0 flex items-center px-2 py-1 border-t" style={{ borderColor: C.border }} data-keep-keyboard="true">
        <button
          {...bindTap({ kind: 'action', id: 'compose.image.pick' }, {
            onTrigger: () => {
              if (images.length >= 9) {
                toast('最多添加 9 张图片');
                return;
              }
              void pickImagesFromAlbum({ multiple: true, maxSelect: 9 - images.length }).then((r) => {
                if (r.cancelled || !r.selected.length) return;
                setImages((arr) => [...arr, ...r.selected.map((x) => x.uri)].slice(0, 9));
              });
            },
          })}
          className={toolbarBtn}
          style={{ color: C.text }}
          aria-label="图片"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.subjectLink.insert' }, { onTrigger: () => pushParam('subject', 'open') })}
          className={toolbarBtn}
          style={{ color: C.text, fontSize: 17, fontWeight: 600 }}
          aria-label="条目"
        >
          《》
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.topic.insert' }, {
            onTrigger: () => setParamReplace('topics', topicBarOpen ? null : '1'),
          })}
          className={toolbarBtn}
          style={{ color: topicBarOpen ? C.green : C.text, fontSize: 19, fontWeight: 600 }}
          aria-label="话题"
        >
          #
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.format.toggle' }, {
            params: { target: 'bar' },
            onTrigger: () => setParamReplace('fmt', fmtBarOpen ? null : '1'),
          })}
          className={toolbarBtn}
          style={{ color: fmtBarOpen ? C.green : C.text, fontSize: 18, fontWeight: 700 }}
          aria-label="排版"
        >
          T
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className={toolbarBtn}
          style={{ color: C.text, fontSize: 21 }}
          aria-label="更多插入"
        >
          ⊕
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className={toolbarBtn}
          style={{ color: C.text }}
          aria-label="水印相机"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>

      {/* 草稿恢复弹窗 */}
      {showDraftDialog && (
        <CenterDialog title="恢复上次草稿?" dismissable={false}>
          <div className="text-sm text-center truncate" style={{ color: C.sub }}>
            {drafts[0].title || drafts[0].text}
          </div>
          <div className="flex gap-3 pt-4 pb-1">
            <button
              {...bindTap({ kind: 'action', id: 'compose.draftDialog.select.target' }, {
                params: { target: 'rewrite' },
                onTrigger: () => resolveDraft('rewrite'),
              })}
              className="flex-1 h-10 rounded-full text-sm cursor-pointer"
              style={{ background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }}
            >
              重新写
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'compose.draftDialog.select.target' }, {
                params: { target: 'continue' },
                onTrigger: () => resolveDraft('continue'),
              })}
              className="flex-1 h-10 rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: C.green }}
            >
              继续写
            </button>
          </div>
        </CenterDialog>
      )}

      {/* 《》条目选择弹层 */}
      {subjectOpen && (
        <Sheet title="添加条目">
          <div className="overflow-y-auto min-h-0" data-scroll-container="subject-sheet" data-scroll-direction="vertical">
            {subjectPool.map((sb) => (
              <SheetRow
                key={sb.id}
                label={`《${sb.title}》`}
                sub={sb.info ?? sb.year}
                bind={bindTap({ kind: 'action', id: 'compose.subjectLink.insert' }, {
                  params: { subjectId: sb.id },
                  onTrigger: () => {
                    setSubjectId(sb.id);
                    setComposeDraft(`${composeDraft}《${sb.title}》`);
                    back();
                  },
                })}
                icon={<Img src={sb.cover} className="w-7 h-9 rounded object-cover" />}
              />
            ))}
          </div>
        </Sheet>
      )}

      {/* 图片版式弹层:画廊 / 图文混排 */}
      {layoutOpen && (
        <Sheet title="图片版式">
          <div className="flex gap-3 px-5 pb-3">
            {([
              ['gallery', '画廊'],
              ['mixed', '图文混排'],
            ] as [ImgLayout, string][]).map(([v, label]) => (
              <button
                key={v}
                {...bindTap({ kind: 'action', id: 'compose.imageLayout.select.target' }, {
                  params: { target: v },
                  onTrigger: () => {
                    setImgLayout(v);
                    back();
                  },
                })}
                className="flex-1 rounded-xl p-3 cursor-pointer flex flex-col items-center gap-2"
                style={{
                  background: '#F7F7F7',
                  border: imgLayout === v ? `2px solid ${C.green}` : '2px solid transparent',
                }}
              >
                {v === 'gallery' ? (
                  <span className="flex gap-1">
                    <span className="w-8 h-8 rounded" style={{ background: '#D8DCE1' }} />
                    <span className="w-8 h-8 rounded" style={{ background: '#D8DCE1' }} />
                  </span>
                ) : (
                  <span className="flex flex-col gap-1 items-stretch w-16">
                    <span className="h-5 rounded" style={{ background: '#D8DCE1' }} />
                    <span className="h-1.5 rounded" style={{ background: '#EDEDED' }} />
                    <span className="h-1.5 rounded" style={{ background: '#EDEDED' }} />
                  </span>
                )}
                <span className="text-xs" style={{ color: imgLayout === v ? C.green : C.text }}>{label}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 投递到小组弹层 */}
      {groupOpen && (
        <Sheet title="投递到小组">
          <div className="overflow-y-auto min-h-0" data-scroll-container="group-sheet" data-scroll-direction="vertical">
            <SheetRow
              label="不投递,发布为个人动态"
              bind={bindTap({ kind: 'action', id: 'compose.groupDeliver.select' }, {
                params: { groupId: 'none' },
                onTrigger: () => {
                  setGroupId(null);
                  back();
                },
              })}
            />
            {joinedGroups.map((g) => (
              <SheetRow
                key={g.id}
                label={g.name}
                sub={`${fmtCount(g.members)}人`}
                bind={bindTap({ kind: 'action', id: 'compose.groupDeliver.select' }, {
                  params: { groupId: g.id },
                  onTrigger: () => {
                    setGroupId(g.id);
                    back();
                  },
                })}
                icon={<Img src={g.icon} className="w-8 h-8 rounded object-cover" />}
                right={
                  groupId === g.id ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : undefined
                }
              />
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

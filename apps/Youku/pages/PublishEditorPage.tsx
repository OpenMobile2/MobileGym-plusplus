import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { YOUKU_CONFIG } from '../data';
import type { PublishDraft } from '../types';
import Img from '../components/Img';
import {
  IcBack, IcHash, IcPlayRing, IcDeclare, IcChevron, IcImage, IcVideo, IcKeyboard,
  IcPlus, IcClose, IcCheck, IcSmile,
} from '../components/msgpub/icons';
import { pickImages } from '@/os/albumBridge';
import { getFileUriAsync } from '@/os/FileSystemService';

const MAX_LEN = 2000;

const EMPTY_DRAFT: PublishDraft = {
  text: '', images: [], topicName: null, showId: null, showTitle: null, aiDeclared: false,
};

const MAX_IMAGES = 9;

/** 表情面板:插入正文的 [名称] 文本 + 展示 glyph(格式见 s254『好耶[哈哈]』) */
const EMOJIS: ReadonlyArray<{ name: string; glyph: string }> = [
  { name: '哈哈', glyph: '😄' }, { name: '色', glyph: '😍' }, { name: '亲亲', glyph: '😘' },
  { name: '呲牙', glyph: '😁' }, { name: '偷笑', glyph: '🤭' }, { name: '酷', glyph: '😎' },
  { name: '疑问', glyph: '🤔' }, { name: '流泪', glyph: '😭' }, { name: '吃瓜', glyph: '🍉' },
  { name: '柠檬', glyph: '🍋' }, { name: '裂开', glyph: '💔' }, { name: '惊讶', glyph: '😲' },
  { name: '晕', glyph: '😵' }, { name: '口罩', glyph: '😷' }, { name: '生气', glyph: '😠' },
  { name: '大笑', glyph: '🤣' }, { name: '点赞', glyph: '👍' }, { name: '爱心', glyph: '❤️' },
  { name: '拍手', glyph: '👏' }, { name: '狗头', glyph: '🐶' }, { name: '猫咪', glyph: '🐱' },
];
const GLYPH_BY_NAME = new Map(EMOJIS.map((e) => [e.name, e.glyph]));

/** 加图占位图集(轻做:固定 4 张片库剧照) */
const PLACEHOLDER_IMAGES: ReadonlyArray<{ id: string; still: string; title: string }> =
  (YOUKU_CONFIG.catalog as Array<{ id: string; still: string; title: string }>).slice(0, 4);

/** spec 节点 publish.editor(route /publish)—— 发布动态编辑页(s200/s206/s207/s208) */
export default function PublishEditorPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const [sp, setSearchParams] = useSearchParams();
  const draft = useYoukuStore((s) => s._temp.publishDraft);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const publishMoment = useYoukuStore((s) => s.publishMoment);
  const showToast = useYoukuStore((s) => s.showToast);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selRef = useRef<number | null>(null);
  const [emojiSeen, setEmojiSeen] = useState(false);
  const [recent, setRecent] = useState<string[]>(['哈哈']);

  const declareOpen = sp.get('declare') === '1';
  const emojiOpen = sp.get('emoji') === '1';
  const imgpickOpen = sp.get('imgpick') === '1';
  // 弹层均由 URL search 驱动(每开一层 push 一条历史),发布时需一并弹出
  const overlayDepth = [declareOpen, emojiOpen, imgpickOpen].filter(Boolean).length;

  const patchDraft = (patch: Partial<PublishDraft>) =>
    setTemp({ publishDraft: { ...draft, ...patch } });

  const canPublish = draft.text.trim().length > 0 || draft.images.length > 0;

  const openOverlay = (key: 'declare' | 'emoji' | 'imgpick') => {
    textareaRef.current?.blur();
    setSearchParams((p) => {
      p.set(key, '1');
      return p;
    });
  };

  const pickFromAlbum = () => {
    textareaRef.current?.blur();
    const remaining = MAX_IMAGES - draft.images.length;
    if (remaining <= 0) {
      showToast(`最多添加${MAX_IMAGES}张图片`);
      return;
    }
    // 多选相册,追加到已选(不再覆盖)
    void pickImages({ multiple: true, maxSelect: remaining }).then(async (r) => {
      if (r.cancelled || !r.selected.length) return;
      const selectedUris = (
        await Promise.all(r.selected.map(async (x) => x.uri || (await getFileUriAsync(x.path)) || ''))
      ).filter(Boolean);
      if (!selectedUris.length) return;
      const currentDraft = useYoukuStore.getState()._temp.publishDraft;
      setTemp({
        publishDraft: {
          ...currentDraft,
          images: [...currentDraft.images, ...selectedUris].slice(0, MAX_IMAGES),
        },
      });
    });
  };

  const insertEmoji = (name: string) => {
    // 直接插入 emoji 字形(而非 [名称] 文本占位),正文与动态里正常显示表情
    const glyph = GLYPH_BY_NAME.get(name) ?? name;
    const base = draft.text;
    const pos = Math.min(selRef.current ?? base.length, base.length);
    const next = (base.slice(0, pos) + glyph + base.slice(pos)).slice(0, MAX_LEN);
    patchDraft({ text: next });
    selRef.current = Math.min(pos + glyph.length, next.length);
    setRecent((prev) => [name, ...prev.filter((x) => x !== name)].slice(0, 7));
  };

  const rowCls = 'flex h-14 cursor-pointer items-center gap-3 px-1';

  return (
    <div
      className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶栏:返回 + 标题 + 发布按钮 */}
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <button
          {...bindBack({ onTrigger: () => setTemp({ publishDraft: { ...EMPTY_DRAFT } }) })}
          aria-label={t('common.back')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.5} />
        </button>
        <span className="text-[17px] font-bold">{t('publish.editor.title')}</span>
        <button
          {...action('publish.editor.submit', () => {
            if (!canPublish) return;
            setTemp({ profileTabHint: 'moments' });
            publishMoment();
            back(1 + overlayDepth);
          })}
          className={`h-[34px] cursor-pointer rounded-full border-none px-5 text-[14px] ${
            canPublish ? 'bg-[#0C7BFF] text-(--app-c-text-primary)' : 'bg-(--app-c-chip-bg) text-[#666666]'
          }`}
        >
          {t('publish.editor.submit')}
        </button>
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-3"
      >
        {/* 正文输入区 */}
        <textarea
          ref={textareaRef}
          data-action="publish.editor.body.input"
          data-action-type="input"
          value={draft.text}
          onChange={(e) => patchDraft({ text: e.target.value.slice(0, MAX_LEN) })}
          onSelect={(e) => {
            selRef.current = e.currentTarget.selectionStart;
          }}
          placeholder={t('publish.editor.placeholder')}
          className="mt-2 h-44 w-full resize-none border-none bg-transparent text-[17px] leading-[26px] text-(--app-c-text-primary) outline-none placeholder:text-[#555555]"
        />
        <div className="pb-2 text-right text-[15px] text-[#666666]">
          {draft.text.length}/{MAX_LEN}
        </div>

        {/* 加图区:多张缩略图(可逐张删除)+ 加图块(满9张隐藏) */}
        <div className="flex flex-wrap items-center gap-2.5 pb-5">
          {draft.images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative">
              <Img
                src={src}
                label=""
                ratio="landscape"
                className="h-[104px] w-[104px] rounded-xl object-cover"
              />
              <button
                {...action('publish.editor.image.add', () => patchDraft({ images: draft.images.filter((_, j) => j !== i) }), {
                  params: { value: 'remove' },
                })}
                aria-label="删除图片"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-black/80 p-0 text-white"
              >
                <IcClose size={12} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {draft.images.length < MAX_IMAGES && (
            <div
              {...action('publish.editor.image.add', pickFromAlbum)}
              className="flex h-[104px] w-[104px] cursor-pointer items-center justify-center rounded-xl bg-(--app-c-chip-bg)"
            >
              <IcPlus size={36} strokeWidth={1.5} className="text-[#8A8A8A]" />
            </div>
          )}
        </div>

        <div className="h-px bg-(--app-c-chip-bg)" />

        {/* 入口三行:选择话题 / 选择节目 / 内容声明 */}
        <div {...bindTap('publish.editor.topic.open')} className={rowCls}>
          <IcHash size={20} strokeWidth={2} className="text-[#CCCCCC]" />
          <span className="flex-1 text-[16px]">
            {draft.topicName ? `#${draft.topicName}` : t('publish.editor.topicRow')}
          </span>
          <IcChevron size={18} className="text-[#666666]" />
        </div>
        <div {...bindTap('publish.editor.show.open')} className={rowCls}>
          <IcPlayRing size={20} strokeWidth={2} className="text-[#CCCCCC]" />
          <span className="flex-1 text-[16px]">{draft.showTitle ?? t('publish.editor.showRow')}</span>
          <IcChevron size={18} className="text-[#666666]" />
        </div>
        <div
          {...action('publish.editor.declare.open', () => openOverlay('declare'))}
          className={rowCls}
        >
          <IcDeclare size={20} strokeWidth={2} className="text-[#CCCCCC]" />
          <span className="flex-1 text-[16px]">{t('publish.editor.declareRow')}</span>
          {draft.aiDeclared && <span className="text-[14px] text-[#999999]">{t('publish.editor.declareAdded')}</span>}
          <IcChevron size={18} className="text-[#666666]" />
        </div>
      </div>

      {/* 底部:工具栏 或 表情面板(与软键盘互斥) */}
      {!emojiOpen ? (
        <div className="flex h-14 shrink-0 items-center gap-8 border-t border-(--app-c-border) px-5">
          <button
            {...action('publish.editor.image.add', pickFromAlbum)}
            className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
            aria-label="图片"
          >
            <IcImage size={24} strokeWidth={1.8} />
          </button>
          <button
            {...action('publish.editor.video.wontfixToast', () => showToast(WONTFIX_TOAST))}
            className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
            aria-label="视频"
          >
            <IcVideo size={24} strokeWidth={1.8} />
          </button>
          <button
            {...action('publish.editor.emojiPanel.toggle', () => {
              setEmojiSeen(true);
              openOverlay('emoji');
            })}
            className="relative cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
            aria-label="表情"
          >
            <IcSmile size={24} strokeWidth={1.8} />
            {!emojiSeen && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#F5265C]" />
            )}
          </button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-(--app-c-border) bg-(--app-c-page-bg)">
          {/* 面板顶行:图片 / 视频 / 键盘 */}
          <div className="flex h-12 items-center gap-8 bg-(--app-c-card-bg) px-5">
            <button
              {...action('publish.editor.image.add', pickFromAlbum)}
              className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
              aria-label="图片"
            >
              <IcImage size={22} strokeWidth={1.8} />
            </button>
            <button
              {...action('publish.editor.video.wontfixToast', () => showToast(WONTFIX_TOAST))}
              className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
              aria-label="视频"
            >
              <IcVideo size={22} strokeWidth={1.8} />
            </button>
            <button
              {...action('publish.editor.emojiPanel.toggle', () => back())}
              className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)"
              aria-label="键盘"
            >
              <IcKeyboard size={22} strokeWidth={1.8} />
            </button>
          </div>
          {/* emoji 网格(点击以 [名称] 插入正文光标处) */}
          <div className="grid grid-cols-7 gap-y-2 px-3 py-3">
            {EMOJIS.map((e) => (
              <button
                key={e.name}
                {...action('publish.editor.emoji.insert', () => insertEmoji(e.name), {
                  params: { value: e.name },
                })}
                aria-label={e.name}
                className="cursor-pointer border-none bg-transparent p-0 text-center text-[24px] leading-8"
              >
                {e.glyph}
              </button>
            ))}
          </div>
          {/* 左下最近使用 */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <span className="text-[12px] text-[#666666]">{t('publish.editor.recent')}</span>
            {recent.map((name) => (
              <button
                key={name}
                {...action('publish.editor.emoji.insert', () => insertEmoji(name), {
                  params: { value: name },
                })}
                aria-label={name}
                className="cursor-pointer rounded-full border-none bg-(--app-c-chip-bg) px-1.5 py-0.5 text-[18px]"
              >
                {GLYPH_BY_NAME.get(name) ?? name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 内容声明底部弹层(s206/s207) */}
      {declareOpen && (
        <div className="absolute inset-0 z-40">
          <div {...bindBack()} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-(--app-c-card-bg) px-4 pb-12 pt-6">
            <div className="flex items-center gap-3">
              <IcDeclare size={20} strokeWidth={2} className="text-[#CCCCCC]" />
              <span className="flex-1 text-[16px]">{t('publish.editor.aiDeclare')}</span>
              <button
                {...action('publish.editor.aiDeclare.toggle', () =>
                  patchDraft({ aiDeclared: !draft.aiDeclared }),
                )}
                aria-label={t('publish.editor.aiDeclare')}
                className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full p-0 ${
                  draft.aiDeclared
                    ? 'border-none bg-white text-black'
                    : 'border-2 border-solid border-[#666666] bg-transparent'
                }`}
              >
                {draft.aiDeclared && <IcCheck size={14} strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 占位图选择底部弹层(轻做:固定占位图集选一张) */}
      {imgpickOpen && (
        <div className="absolute inset-0 z-40">
          <div {...bindBack()} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-(--app-c-card-bg) px-4 pb-10 pt-5">
            <div className="text-center text-[15px] font-bold">{t('publish.editor.pickImage')}</div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {PLACEHOLDER_IMAGES.map((img) => (
                <div
                  key={img.id}
                  {...action('publish.editor.image.add', () => {
                    patchDraft({ images: [...draft.images, img.still].slice(0, MAX_IMAGES) });
                    back();
                  }, { params: { value: img.id } })}
                  className="cursor-pointer"
                >
                  <Img
                    src={img.still}
                    label={img.title}
                    ratio="landscape"
                    className="h-16 w-full rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// apps/Douban/components/ReplyEditor.tsx —— 回复编辑器(FOUNDATION,IMG_0222/0224/0225 R8)。
// 结构:引用块(楼中楼)+ 文本框 + 已选图缩略图(长按=移到最前/删除,由页面绑 longPress)
// + 工具行(图片:加一张种子图 / 表情面板 / 「转发到动态」勾选)+ 发布(→ toast「回复成功」)。
// 文本走 store.replyDraft(页面用 setReplyDraft 控制);其余绑定页面侧字面量传入。
import React from 'react';
import { useDoubanStore } from '../state';
import { C } from './ui';

/** 表情面板的固定表情(「我的表情」) */
export const REPLY_EMOJIS = ['😀', '😂', '🤔', '😭', '😍', '🙏', '👍', '🎉', '🐱', '💚', '🍊', '☕'];

export interface ReplyEditorProps {
  /** 楼中楼引用预览文案(如「豆友:说得太对了」),无引用传 undefined */
  quoteText?: string;
  /** 已选图片(页面态,通常放 URL query 或页面订阅的易失字段) */
  images: string[];
  /** 表情面板是否展开(URL 驱动) */
  emojiOpen: boolean;
  /** 「转发到动态」勾选态 */
  syncToFeed: boolean;
  /** 图片按钮:onTrigger 里给 images 追加一张种子图 */
  bindPickImage: object;
  /** 已选图缩略图 longPress(移到最前/删除菜单) */
  bindImageLongPress?: (index: number) => object;
  /** 表情按钮(开/收面板) */
  bindEmojiToggle: object;
  /** 点某个表情:onTrigger 里 setReplyDraft(draft + emoji) */
  bindEmojiPick: (emoji: string) => object;
  /** 「转发到动态」勾选 */
  bindSyncToggle: object;
  /** 发布:onTrigger 里 addReply(...) + toast('回复成功') + back() */
  bindPublish: object;
  placeholder?: string;
}

export function ReplyEditor({
  quoteText,
  images,
  emojiOpen,
  syncToFeed,
  bindPickImage,
  bindImageLongPress,
  bindEmojiToggle,
  bindEmojiPick,
  bindSyncToggle,
  bindPublish,
  placeholder = '写回复…',
}: ReplyEditorProps) {
  const replyDraft = useDoubanStore((s) => s.replyDraft);
  const setReplyDraft = useDoubanStore((s) => s.setReplyDraft);
  const canPublish = replyDraft.trim().length > 0 || images.length > 0;
  return (
    <div className="shrink-0 border-t bg-white" style={{ borderColor: C.border }} data-keep-keyboard="true">
      {quoteText && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded text-xs truncate" style={{ background: '#F2F3F5', color: C.sub }}>
          回复 {quoteText}
        </div>
      )}
      <div className="px-3 pt-2">
        <textarea
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none border-none"
          style={{ background: '#F2F3F5', color: C.text }}
        />
      </div>
      {images.length > 0 && (
        <div className="flex gap-2 px-3 pt-1.5">
          {images.map((src, i) => (
            <div key={i} {...(bindImageLongPress ? bindImageLongPress(i) : {})} className="relative">
              <img src={src} alt="" className="w-14 h-14 rounded object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center px-3 py-2">
        <button {...bindPickImage} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button {...bindEmojiToggle} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: emojiOpen ? C.green : C.sub }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="10" r="0.5" fill="currentColor" />
            <circle cx="15" cy="10" r="0.5" fill="currentColor" />
          </svg>
        </button>
        <button {...bindSyncToggle} className="flex items-center gap-1 px-2 h-9 bg-transparent border-none cursor-pointer text-xs" style={{ color: syncToFeed ? C.green : C.sub }}>
          <span
            className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
            style={{ border: syncToFeed ? 'none' : `1.5px solid ${C.border}`, background: syncToFeed ? C.green : 'transparent' }}
          >
            {syncToFeed && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </span>
          转发到动态
        </button>
        <div className="flex-1" />
        <button
          {...bindPublish}
          className="px-4 h-8 rounded-full text-sm border-none cursor-pointer text-white"
          style={{ background: canPublish ? C.green : '#B7E5BE' }}
        >
          发布
        </button>
      </div>
      {emojiOpen && (
        <div className="grid grid-cols-6 gap-1 px-4 pb-3">
          {REPLY_EMOJIS.map((e) => (
            <button
              key={e}
              {...bindEmojiPick(e)}
              className="h-11 text-2xl bg-transparent border-none cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

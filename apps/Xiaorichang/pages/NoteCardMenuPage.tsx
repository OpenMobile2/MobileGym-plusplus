import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { makeTextPosterDataUrl } from '@/os/albumBridge';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { MenuPage } from '../components/Sheet';
import { MenuRow, MissingContent } from '../components/common';

/**
 * 笔记卡 ⋮ 菜单(s225:复制内容/分享为图片/查看其它笔记/删除笔记)。
 * 多父页菜单(今日页 + 笔记列表页)⇒ 独立 pathname 路由。
 */
export default function NoteCardMenuPage() {
  const [sp] = useSearchParams();
  const noteId = sp.get('noteId') ?? '';
  const st = useXiaorichangStore();
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, confirm } = useDialogs();
  const note = st.notes.find((n) => n.id === noteId);

  if (!note) return <MissingContent />;

  return (
    <MenuPage>
      <MenuRow label={s.noteCopy}
        {...action('note.cardmenu.copy', () => {
          const clipboard = window.__OS__?.clipboard;
          if (!clipboard) { st.showNotice(s.notAvailable); return; }
          clipboard.copyText(note.body, 'xiaorichang');
          st.showToast(s.copiedToClipboard);
          back();
        }, { params: { noteId } })} />
      <MenuRow label={s.noteShareImage}
        {...action('note.cardmenu.shareImage', () => {
          const poster = makeTextPosterDataUrl(
            [note.title ?? '', note.body],
            { title: s.notesTitle, width: 720, height: 1280 },
          );
          const launched = window.__OS__?.startActivityForResult?.(
            {
              action: 'ACTION_SEND',
              type: 'image/*',
              data: { stream: poster, mimeType: 'image/svg+xml' },
            },
            (result) => { if (result.resultCode === 'OK') st.showToast(s.shareSuccess); },
          );
          if (!launched) st.showNotice(s.notAvailable);
        }, { params: { noteId } })} />
      <MenuRow label={s.noteViewAll} {...bindTap('note.cardmenu.viewAll', {
        nav: { mode: 'replace', popTo: '/notes' },
      })} />
      <MenuRow label={s.noteDelete} danger
        {...action('note.cardmenu.delete', () => confirm({
          title: `${s.noteDelete}?`, danger: true,
          onConfirm: () => { st.deleteNote(noteId); back(); },
        }), { params: { noteId } })} />
      {dialogs}
    </MenuPage>
  );
}

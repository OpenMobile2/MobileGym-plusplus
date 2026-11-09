import React from 'react';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { MenuPage } from '../components/Sheet';
import { MenuRow } from '../components/common';

/** 笔记区 ⋯ 菜单。内容未确证(openIssues.note-section-menu),按最小语义只做「查看全部」。 */
export default function NoteSectionMenuPage() {
  const { bindTap } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <MenuPage>
      <MenuRow label={s.noteViewAll} {...bindTap('note.sectionmenu.viewAll', {
        nav: { mode: 'replace', popTo: '/notes' },
      })} />
    </MenuPage>
  );
}

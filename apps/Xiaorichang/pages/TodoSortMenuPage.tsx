import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { MenuPage } from '../components/Sheet';
import { MenuRow } from '../components/common';

/** 排序方式二级菜单。⚠ 三个选项均 inferred(s234 只拍到 ›),openIssues.todo-sortmenu-options。 */
export default function TodoSortMenuPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const cur = st.settings.todoSort;
  const check = (k: string) => (cur === k ? <span className="text-[#E69F4B]">✓</span> : null);
  return (
    <MenuPage title={s.todoSortBy}>
      <MenuRow label={s.todoSortCreatedAt} trailing={check('createdAt')}
        {...action('todo.sortMenu.sort.select.createdAt', () => { st.updateSettings({ todoSort: 'createdAt' }); back(2); })} />
      <MenuRow label={s.todoSortDueAt} trailing={check('dueAt')}
        {...action('todo.sortMenu.sort.select.dueAt', () => { st.updateSettings({ todoSort: 'dueAt' }); back(2); })} />
      <MenuRow label={s.todoSortManual} trailing={check('manual')}
        {...action('todo.sortMenu.sort.select.manual', () => { st.updateSettings({ todoSort: 'manual' }); back(2); })} />
    </MenuPage>
  );
}

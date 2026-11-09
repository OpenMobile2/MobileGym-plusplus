import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { MenuPage } from '../components/Sheet';
import { MenuRow, Switch } from '../components/common';
import { IcRight } from '../res/icons';

/**
 * 小事页 ⋯ 菜单(s234:排序方式 › / 首页显示,仅两项)。
 * 起草时推断的『清空已完成』被 s234 证伪,已删(铁律③)。
 */
export default function TodoListMenuPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <MenuPage>
      <MenuRow label={s.todoSortBy} trailing={<IcRight size={16} className="text-[#C9CDD3]" />}
        {...bindTap('todo.listmenu.sort.open')} />
      <MenuRow label={s.todoHomeDisplay}
        trailing={<Switch on={st.settings.todoHomeDisplay}
          {...action('todo.listmenu.toggleHomeDisplay', () => st.updateSettings({ todoHomeDisplay: !st.settings.todoHomeDisplay }))} />}
        {...{}} />
    </MenuPage>
  );
}

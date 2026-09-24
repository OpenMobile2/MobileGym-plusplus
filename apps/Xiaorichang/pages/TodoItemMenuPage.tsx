import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { MenuPage } from '../components/Sheet';
import { MenuRow, MissingContent } from '../components/common';

/** 小事行 ⋯ 菜单(整节点 inferred,s204 仅见图标)。多父页 ⇒ 独立路由。 */
export default function TodoItemMenuPage() {
  const [sp] = useSearchParams();
  const todoId = sp.get('todoId') ?? '';
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, prompt } = useDialogs();
  const todo = st.todos.find((t) => t.id === todoId);

  if (!todo) return <MissingContent />;

  return (
    <MenuPage title={todo.title}>
      <MenuRow label={s.edit}
        {...action('todo.itemmenu.edit', () => prompt({
          title: s.edit, initial: todo.title,
          onConfirm: (v) => { st.updateTodo(todoId, { title: v }); back(); },
        }), { params: { todoId } })} />
      <MenuRow label={s.delete} danger
        {...action('todo.itemmenu.delete', () => { st.deleteTodo(todoId); back(); }, { params: { todoId } })} />
      {dialogs}
    </MenuPage>
  );
}

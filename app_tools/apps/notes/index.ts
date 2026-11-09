import { useNotesStore } from '@/system/Notes/state';
import type { Note, NotesFolder, NotesTodo } from '@/system/Notes/types';
import * as TimeService from '@/os/TimeService';
import {
  assertAllowedKeys, optionalInteger, optionalString, requireBoolean, requireString, ToolExecutionError,
} from '../../core/errors';
import { openAppRoute } from '../../core/navigation';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { NOTES_TOOL_DEFINITIONS, NOTES_TOOL_NAMES } from './definitions';

function state() { return useNotesStore.getState(); }
function folderById(id: string): NotesFolder {
  const folder = state().folders.find((item) => item.id === id);
  if (!folder) throw new ToolExecutionError('FOLDER_NOT_FOUND', `Notes folder not found: ${id}`);
  return folder;
}
function visibleNotes(): Note[] { return state().notes.filter((note) => !note.trashedAt && !note.isPrivate); }
function visibleNoteById(id: string): Note {
  const note = visibleNotes().find((item) => item.id === id);
  if (!note) throw new ToolExecutionError('NOTE_NOT_FOUND', `Visible note not found: ${id}`);
  return note;
}
function todoById(id: string): NotesTodo {
  const todo = state().todos.find((item) => item.id === id);
  if (!todo) throw new ToolExecutionError('TODO_NOT_FOUND', `To-do not found: ${id}`);
  return todo;
}
function noteSummary(note: Note) {
  const snippet = note.content.replace(/\s+/g, ' ').trim().slice(0, 160);
  return { note_id: note.id, title: note.title || 'Untitled', snippet, folder_id: note.folderId, pinned: !!note.pinned, updated_at: TimeService.fromTimestamp(note.updatedAt).toISOString() };
}
function optionalCompleted(input: Record<string, unknown>): boolean | undefined {
  if (!('completed' in input)) return undefined;
  return requireBoolean(input, 'completed');
}

const handlers: Record<string, ToolHandler> = {
  [NOTES_TOOL_NAMES.searchNotes]: (input) => {
    assertAllowedKeys(input, ['query', 'folder_id', 'limit']); const query = requireString(input, 'query', { maxLength: 200 }).toLowerCase(); const folderId = optionalString(input, 'folder_id'); if (folderId) folderById(folderId);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = visibleNotes().filter((note) => (!folderId || folderId === 'all' || note.folderId === folderId) && `${note.title}\n${note.content}`.toLowerCase().includes(query));
    return { notes: matches.slice(0, limit).map(noteSummary), total: matches.length, truncated: matches.length > limit };
  },
  [NOTES_TOOL_NAMES.listRecentNotes]: (input) => {
    assertAllowedKeys(input, ['folder_id', 'limit']); const folderId = optionalString(input, 'folder_id'); if (folderId) folderById(folderId); const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const notes = visibleNotes().filter((note) => !folderId || folderId === 'all' || note.folderId === folderId).sort((a, b) => b.updatedAt - a.updatedAt);
    return { notes: notes.slice(0, limit).map(noteSummary), total: notes.length, truncated: notes.length > limit };
  },
  [NOTES_TOOL_NAMES.openNote]: async (input) => {
    assertAllowedKeys(input, ['note_id']); const noteId = requireString(input, 'note_id'); visibleNoteById(noteId); const route = `/note/${encodeURIComponent(noteId)}`; await openAppRoute('notes', route); return { note_id: noteId, route };
  },
  [NOTES_TOOL_NAMES.listFolders]: (input) => {
    assertAllowedKeys(input, []); const notes = visibleNotes(); return { folders: state().folders.map((folder) => ({ folder_id: folder.id, name: folder.name, system: !!folder.system, note_count: folder.id === 'all' ? notes.length : notes.filter((note) => note.folderId === folder.id).length })) };
  },
  [NOTES_TOOL_NAMES.openFolder]: async (input) => {
    assertAllowedKeys(input, ['folder_id']); const folderId = requireString(input, 'folder_id'); folderById(folderId); state().setSelectedFolderId(folderId); const route = '/'; await openAppRoute('notes', route); return { folder_id: folderId, route };
  },
  [NOTES_TOOL_NAMES.createNote]: (input) => {
    assertAllowedKeys(input, ['title', 'content', 'folder_id']); const title = requireString(input, 'title', { maxLength: 200 });
    const contentValue = input.content ?? ''; if (typeof contentValue !== 'string' || contentValue.length > 10000) throw new ToolExecutionError('INVALID_ARGUMENT', '"content" must be a string of at most 10000 characters.');
    const folderId = optionalString(input, 'folder_id') ?? 'unfiled'; folderById(folderId); if (folderId === 'all') throw new ToolExecutionError('INVALID_ARGUMENT', 'Notes cannot be created directly in the aggregate "all" folder.');
    const note = state().addNote({ title, content: contentValue, folderId }); return { note_id: note.id, created_at: TimeService.fromTimestamp(note.updatedAt).toISOString() };
  },
  [NOTES_TOOL_NAMES.searchTodos]: (input) => {
    assertAllowedKeys(input, ['query', 'completed', 'limit']); const queryValue = input.query ?? ''; if (typeof queryValue !== 'string' || queryValue.length > 200) throw new ToolExecutionError('INVALID_ARGUMENT', '"query" must be a string of at most 200 characters.'); const query = queryValue.trim().toLowerCase();
    const completed = optionalCompleted(input); const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = state().todos.filter((todo) => (completed === undefined || todo.completed === completed) && (!query || todo.text.toLowerCase().includes(query)));
    return { todos: matches.slice(0, limit).map((todo) => ({ todo_id: todo.id, text: todo.text, completed: todo.completed, updated_at: TimeService.fromTimestamp(todo.updatedAt).toISOString() })), total: matches.length, truncated: matches.length > limit };
  },
  [NOTES_TOOL_NAMES.createTodo]: (input) => {
    assertAllowedKeys(input, ['text']); const text = requireString(input, 'text', { maxLength: 500 }); const todo = state().addTodo(text); return { todo_id: todo.id, completed: todo.completed };
  },
  [NOTES_TOOL_NAMES.setTodoCompleted]: (input) => {
    assertAllowedKeys(input, ['todo_id', 'completed']); const todoId = requireString(input, 'todo_id'); const completed = requireBoolean(input, 'completed'); const todo = todoById(todoId); if (todo.completed !== completed) state().toggleTodo(todoId); return { todo_id: todoId, completed: todoById(todoId).completed };
  },
  [NOTES_TOOL_NAMES.openTodos]: async (input) => { assertAllowedKeys(input, []); const route = '/todo'; await openAppRoute('notes', route); return { route }; },
};

export function executeNotesTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown Notes tool: ${name}`);
  return handler(input);
}

export function registerNotesTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  NOTES_TOOL_DEFINITIONS.forEach((definition) => registry.register(definition, handlers[definition.name]));
}
export { NOTES_TOOL_DEFINITIONS, NOTES_TOOL_NAMES } from './definitions';

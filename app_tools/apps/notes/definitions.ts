import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;
const LIMIT = { type: 'integer', minimum: 1, maximum: 20, default: 10 } as const;
const NOTES = { type: 'array', items: { type: 'object', properties: { note_id: STRING, title: STRING, snippet: STRING, folder_id: STRING, pinned: { type: 'boolean' }, updated_at: STRING }, required: ['note_id', 'title', 'snippet', 'folder_id', 'pinned', 'updated_at'] } } as const;
const TODOS = { type: 'array', items: { type: 'object', properties: { todo_id: STRING, text: STRING, completed: { type: 'boolean' }, updated_at: STRING }, required: ['todo_id', 'text', 'completed', 'updated_at'] } } as const;
const ann = (readOnly: boolean, uiEffect: 'none' | 'navigation' | 'draft' = 'none', idempotent = true) => ({ readOnlyHint: readOnly, destructiveHint: false, idempotentHint: idempotent, uiEffect });
export const NOTES_TOOL_NAMES = {
  searchNotes: 'notes__search_notes',
  listRecentNotes: 'notes__list_recent_notes',
  openNote: 'notes__open_note',
  listFolders: 'notes__list_folders',
  openFolder: 'notes__open_folder',
  createNote: 'notes__create_note',
  searchTodos: 'notes__search_todos',
  createTodo: 'notes__create_todo',
  setTodoCompleted: 'notes__set_todo_completed',
  openTodos: 'notes__open_todos',
} as const;

export const NOTES_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: NOTES_TOOL_NAMES.searchNotes, app: 'notes', description: 'Search visible Notes by title or content. Private and trashed notes are not exposed.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 200 }, folder_id: STRING, limit: LIMIT }, required: ['query'], additionalProperties: false }, outputSchema: { type: 'object', properties: { notes: NOTES, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['notes', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: NOTES_TOOL_NAMES.listRecentNotes, app: 'notes', description: 'List recently updated visible notes with short snippets. Private and trashed notes are omitted.',
    inputSchema: { type: 'object', properties: { folder_id: STRING, limit: LIMIT }, additionalProperties: false }, outputSchema: { type: 'object', properties: { notes: NOTES, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['notes', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: NOTES_TOOL_NAMES.openNote, app: 'notes', description: 'Open a visible note by note_id. The next screenshot shows the normal editor and complete note content.',
    inputSchema: { type: 'object', properties: { note_id: STRING }, required: ['note_id'], additionalProperties: false }, outputSchema: { type: 'object', properties: { note_id: STRING, route: STRING }, required: ['note_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: NOTES_TOOL_NAMES.listFolders, app: 'notes', description: 'List note folders and visible note counts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { folders: { type: 'array', items: { type: 'object', properties: { folder_id: STRING, name: STRING, system: { type: 'boolean' }, note_count: { type: 'integer' } }, required: ['folder_id', 'name', 'system', 'note_count'] } } }, required: ['folders'] }, annotations: ann(true),
  },
  {
    name: NOTES_TOOL_NAMES.openFolder, app: 'notes', description: 'Open the Notes list filtered to a folder. The next screenshot shows matching notes.',
    inputSchema: { type: 'object', properties: { folder_id: STRING }, required: ['folder_id'], additionalProperties: false }, outputSchema: { type: 'object', properties: { folder_id: STRING, route: STRING }, required: ['folder_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: NOTES_TOOL_NAMES.createNote, app: 'notes', description: 'Create one note through the same store action as the editor auto-save. This does not open the note.',
    inputSchema: { type: 'object', properties: { title: { ...STRING, maxLength: 200 }, content: { type: 'string', maxLength: 10000 }, folder_id: STRING }, required: ['title'], additionalProperties: false }, outputSchema: { type: 'object', properties: { note_id: STRING, created_at: STRING }, required: ['note_id', 'created_at'] }, annotations: ann(false, 'none', false),
  },
  {
    name: NOTES_TOOL_NAMES.searchTodos, app: 'notes', description: 'Search Notes to-dos by text, optionally filtering completion state.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 200, default: '' }, completed: { type: 'boolean' }, limit: LIMIT }, additionalProperties: false }, outputSchema: { type: 'object', properties: { todos: TODOS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['todos', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: NOTES_TOOL_NAMES.createTodo, app: 'notes', description: 'Create one incomplete to-do through the same action as the Notes to-do GUI.',
    inputSchema: { type: 'object', properties: { text: { ...STRING, maxLength: 500 } }, required: ['text'], additionalProperties: false }, outputSchema: { type: 'object', properties: { todo_id: STRING, completed: { type: 'boolean' } }, required: ['todo_id', 'completed'] }, annotations: ann(false, 'none', false),
  },
  {
    name: NOTES_TOOL_NAMES.setTodoCompleted, app: 'notes', description: 'Set one existing to-do completed or incomplete. Repeating the same state is idempotent.',
    inputSchema: { type: 'object', properties: { todo_id: STRING, completed: { type: 'boolean' } }, required: ['todo_id', 'completed'], additionalProperties: false }, outputSchema: { type: 'object', properties: { todo_id: STRING, completed: { type: 'boolean' } }, required: ['todo_id', 'completed'] }, annotations: ann(false),
  },
  {
    name: NOTES_TOOL_NAMES.openTodos, app: 'notes', description: 'Open the Notes to-do tab. Continue visual review or editing in the GUI.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { route: STRING }, required: ['route'] }, annotations: ann(true, 'navigation'),
  },
];

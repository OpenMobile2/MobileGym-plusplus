import * as FileSystem from '@/os/FileSystemService';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys, optionalInteger, optionalString } from '../../core/errors';
import { compactResult, getLimit, getQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { FILE_MANAGER_TOOL_DEFINITIONS } from './definitions';

const meta = (n: ReturnType<typeof FileSystem.getNode> & {}) => ({ path: n.path, name: n.name, type: n.type, size_bytes: n.size, mime_type: n.mimeType, modified_at: TimeService.fromTimestamp(n.modifiedAt).toISOString() });
function canonicalPath(path: string) {
  const clean = path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) return '/sdcard';
  if (clean === 'sdcard' || clean.startsWith('sdcard/')) return `/${clean}`;
  const normalized = clean === 'Downloads' || clean.startsWith('Downloads/')
    ? `Download${clean.slice('Downloads'.length)}`
    : clean;
  return `/sdcard/${normalized}`;
}
function node(path: string) { const canonical = canonicalPath(path); return requireFound(FileSystem.getNode(canonical), 'PATH_NOT_FOUND', `File-system path not found: ${path}`); }
function parent(path: string) { const clean = path.replace(/\/+$/, ''); const index = clean.lastIndexOf('/'); return index <= 0 ? '/' : clean.slice(0, index); }

const handlers: Record<string, ToolHandler> = {
  file_manager__search: (input) => { assertAllowedKeys(input, ['query', 'path', 'mime_type', 'limit']); const limit = getLimit(input, 50); const rawPath = optionalString(input, 'path'); const rows = FileSystem.searchFiles(getQuery(input), { path: rawPath ? canonicalPath(rawPath) : undefined, mimeType: optionalString(input, 'mime_type') }); return compactResult(rows.map(meta), limit); },
  file_manager__list_directory: (input) => { assertAllowedKeys(input, ['path', 'limit']); const path = canonicalPath(getQuery(input, 'path')); const dir = node(path); if (dir.type !== 'directory') requireFound(undefined, 'NOT_A_DIRECTORY', `${path} is not a directory.`); const limit = getLimit(input, 50); return { path, ...compactResult(FileSystem.listDirectory(path).map(meta), limit) }; },
  file_manager__get_metadata: (input) => { assertAllowedKeys(input, ['path']); return meta(node(canonicalPath(getQuery(input, 'path')))); },
  file_manager__read_text: async (input) => { assertAllowedKeys(input, ['path', 'max_chars']); const path = canonicalPath(getQuery(input, 'path')); const n = node(path); const max = optionalInteger(input, 'max_chars', { min: 1, max: 20000, defaultValue: 4000 }); if (n.type !== 'file' || (n.mimeType && !n.mimeType.startsWith('text/') && !/\.(txt|md|json|csv|log)$/i.test(n.name))) requireFound(undefined, 'NOT_TEXT_FILE', `${path} is not a supported text file.`); const blob = requireFound(await FileSystem.readFile(path), 'READ_FAILED', `Could not read ${path}.`); const full = await blob.text(); return { path, text: full.slice(0, max), total_chars: full.length, truncated: full.length > max }; },
  file_manager__list_recent: (input) => { assertAllowedKeys(input, ['limit']); const limit = getLimit(input, 50); const files = FileSystem.snapshotFileSystem().nodes.filter((n) => n.type === 'file').sort((a, b) => b.modifiedAt - a.modifiedAt); return compactResult(files.map(meta), limit); },
  file_manager__summarize_storage: () => { const files = FileSystem.snapshotFileSystem().nodes.filter((n) => n.type === 'file'); const groups: Record<string, { files: number; bytes: number }> = {}; for (const f of files) { const group = f.mimeType?.split('/')[0] || 'other'; groups[group] ??= { files: 0, bytes: 0 }; groups[group].files += 1; groups[group].bytes += f.size; } return { total_files: files.length, total_bytes: files.reduce((n, f) => n + f.size, 0), groups }; },
  file_manager__open_path: async (input) => { assertAllowedKeys(input, ['path']); const n = node(canonicalPath(getQuery(input, 'path'))); const route = n.type === 'directory' ? `/folder?path=${encodeURIComponent(n.path)}` : n.mimeType === 'application/pdf' ? `/pdf?path=${encodeURIComponent(n.path)}` : `/text?path=${encodeURIComponent(n.path)}`; await openAppRoute('file_manager', route); return { route, path: n.path }; },
  file_manager__open_recent: async () => { await openAppRoute('file_manager', '/recent'); return { route: '/recent' }; },
  file_manager__open_containing_folder: async (input) => { assertAllowedKeys(input, ['path']); const n = node(canonicalPath(getQuery(input, 'path'))); const path = n.type === 'directory' ? n.path : parent(n.path); const route = `/folder?path=${encodeURIComponent(path)}`; await openAppRoute('file_manager', route); return { route, path, target_name: n.name }; },
  file_manager__create_folder: async (input) => { assertAllowedKeys(input, ['path']); const path = canonicalPath(getQuery(input, 'path')); if (FileSystem.exists(path)) requireFound(undefined, 'PATH_EXISTS', `Path already exists: ${path}`); return { ...meta(await FileSystem.createDirectory(path)), created: true }; },
  file_manager__copy_file: async (input) => { assertAllowedKeys(input, ['source_path', 'destination_path']); const source = canonicalPath(getQuery(input, 'source_path')); const destination = canonicalPath(getQuery(input, 'destination_path')); if (node(source).type !== 'file') requireFound(undefined, 'NOT_A_FILE', `${source} is not a file.`); if (FileSystem.exists(destination)) requireFound(undefined, 'PATH_EXISTS', `Destination already exists: ${destination}`); return { ...meta(requireFound(await FileSystem.copyFile(source, destination), 'COPY_FAILED', `Could not copy ${source}.`)), copied_from: source }; },
  file_manager__move_file: async (input) => { assertAllowedKeys(input, ['source_path', 'destination_path']); const source = canonicalPath(getQuery(input, 'source_path')); const destination = canonicalPath(getQuery(input, 'destination_path')); if (node(source).type !== 'file') requireFound(undefined, 'NOT_A_FILE', `${source} is not a file.`); if (FileSystem.exists(destination)) requireFound(undefined, 'PATH_EXISTS', `Destination already exists: ${destination}`); const moved = requireFound(await FileSystem.moveNode(source, destination), 'MOVE_FAILED', `Could not move ${source}.`); return { ...meta(moved), moved_from: source, source_exists: FileSystem.exists(source), destination_exists: FileSystem.exists(destination) }; },
};

export function executeFileManagerTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown File Manager tool: ${name}`)(input); }
export { FILE_MANAGER_TOOL_DEFINITIONS } from './definitions';

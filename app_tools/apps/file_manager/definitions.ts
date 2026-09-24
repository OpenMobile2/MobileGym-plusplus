import { defineAppTools, LIMIT, STRING } from '../../core/define';

export const FILE_MANAGER_TOOL_DEFINITIONS = defineAppTools('file_manager', [
  { name: 'search', description: 'Search files and folders by name with optional path and MIME filters.', properties: { query: STRING, path: STRING, mime_type: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'list_directory', description: 'List compact metadata for one directory. Accepts absolute /sdcard paths or storage-root-relative paths such as Download/reports.', properties: { path: STRING, limit: LIMIT }, required: ['path'] },
  { name: 'get_metadata', description: 'Return metadata for one exact file-system path.', properties: { path: STRING }, required: ['path'] },
  { name: 'read_text', description: 'Read a bounded UTF-8 text file. Binary files and oversized contents are not returned.', properties: { path: STRING, max_chars: { type: 'integer', minimum: 1, maximum: 20000, default: 4000 } }, required: ['path'] },
  { name: 'list_recent', description: 'List recently modified files without reading contents.', properties: { limit: LIMIT } },
  { name: 'summarize_storage', description: 'Return file counts and byte totals grouped by broad MIME category.' },
  { name: 'open_path', description: 'Open a directory or supported file in the normal File Manager GUI.', properties: { path: STRING }, required: ['path'], kind: 'navigation' },
  { name: 'open_recent', description: 'Open the File Manager recent-files page.', kind: 'navigation' },
  { name: 'open_containing_folder', description: 'Open the containing folder for a file. Select and rename it through the normal GUI.', properties: { path: STRING }, required: ['path'], kind: 'navigation' },
  { name: 'create_folder', description: 'Create one folder at an exact path. It fails if a file already occupies that path.', properties: { path: STRING }, required: ['path'], kind: 'write' },
  { name: 'copy_file', description: 'Copy one file to a new exact path.', properties: { source_path: STRING, destination_path: STRING }, required: ['source_path', 'destination_path'], kind: 'write' },
  { name: 'move_file', description: 'Move one file to a new exact path, preserving metadata and removing the source path.', properties: { source_path: STRING, destination_path: STRING }, required: ['source_path', 'destination_path'], kind: 'write' },
]);

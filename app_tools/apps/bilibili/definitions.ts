import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';
export const BILIBILI_TOOL_DEFINITIONS = defineAppTools('bilibili', [
  { name:'search_videos', description:'Search videos by title, author, description, or partition. Returns compact candidates.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'get_ranking', description:'Return a compact ranking for one Bilibili partition.', properties:{partition:STRING,limit:LIMIT}, required:['partition'] },
  { name:'get_video_summary', description:'Return public summary and engagement counts for one video.', properties:{video_id:ID}, required:['video_id'] },
  { name:'get_video_tags', description:'Return public tags for one video.', properties:{video_id:ID}, required:['video_id'] },
  { name:'search_authors', description:'Search video authors by name.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'list_favorite_folders', description:'List the current user favorite folders without returning every saved video.' },
  { name:'open_search', description:'Open Bilibili search. Enter and refine the query through the GUI.', kind:'navigation' },
  { name:'open_video', description:'Open a video detail page for GUI inspection.', properties:{video_id:ID}, required:['video_id'], kind:'navigation' },
  { name:'open_author', description:'Open an author profile.', properties:{author_id:ID}, required:['author_id'], kind:'navigation' },
  { name:'open_ranking', description:'Open the ranking page. Choose partitions and inspect ordering through the GUI.', kind:'navigation' },
  { name:'add_video_to_folder', description:'Add one known video to one existing favorite folder. This does not create a folder.', properties:{video_id:ID,folder_id:ID}, required:['video_id','folder_id'], kind:'write' },
  { name:'follow_author', description:'Follow an author if not already followed. This does not toggle an existing follow off.', properties:{author_id:ID}, required:['author_id'], kind:'write', idempotent:true },
]);

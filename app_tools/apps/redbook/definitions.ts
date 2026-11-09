import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';
export const REDBOOK_TOOL_DEFINITIONS = defineAppTools('redbook', [
  { name:'search_notes', description:'Search public notes in the same default order as the normal GUI result page, matching title, content, or category.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'get_note_summary', description:'Return public note metadata and engagement counts without full visual content.', properties:{note_id:ID}, required:['note_id'] },
  { name:'search_users', description:'Search creators by name, introduction, or location.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'list_chat_threads', description:'List compact private-message thread previews.', properties:{limit:LIMIT} },
  { name:'search_chat_messages', description:'Search text in one private-message conversation.', properties:{user_id:ID,query:STRING,limit:LIMIT}, required:['user_id','query'] },
  { name:'list_saved_notes', description:'List note IDs and titles currently collected by the user.', properties:{limit:LIMIT} },
  { name:'open_search', description:'Open the normal RedBook search page for continued GUI filtering.', kind:'navigation' },
  { name:'open_note', description:'Open one note detail page for visual inspection.', properties:{note_id:ID}, required:['note_id'], kind:'navigation' },
  { name:'open_user', description:'Open a creator profile.', properties:{user_id:ID}, required:['user_id'], kind:'navigation' },
  { name:'open_chat', description:'Open a private-message conversation.', properties:{user_id:ID}, required:['user_id'], kind:'navigation' },
  { name:'prepare_text_post', description:'Open a text-post draft with title and body prefilled. Publishing remains a GUI action.', properties:{title:STRING,content:STRING}, required:['title','content'], kind:'draft' },
]);

import { useRedBookStore } from '@/apps/RedBook/state';
import { getBaseDataset } from '@/apps/RedBook/data/loader';
import { buildRedBookView } from '@/apps/RedBook/data/view';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult,getLimit,getQuery,includesQuery,requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject,ToolHandler } from '../../core/types';
import { REDBOOK_TOOL_DEFINITIONS } from './definitions';
function state(){return useRedBookStore.getState();}function view(){const base=requireFound(getBaseDataset(),'DATA_NOT_READY','RedBook base data is not loaded.');return buildRedBookView(state(),base);}function note(id:string){return requireFound(view().notesById[id],'NOTE_NOT_FOUND',`RedBook note not found: ${id}`);}function user(id:string){return requireFound(view().usersById[id],'USER_NOT_FOUND',`RedBook user not found: ${id}`);}const ns=(n:NonNullable<ReturnType<typeof note>>)=>{const v=view();return{note_id:n.id,title:n.title,author_id:n.authorId,author:v.usersById[n.authorId]?.name,likes:n.likes,collections:n.collections,comments:n.comments,created_at:TimeService.fromTimestamp(n.createdAt).toISOString(),tags:n.tags};};
const handlers:Record<string,ToolHandler>={
  redbook__search_notes:i=>{assertAllowedKeys(i,['query','limit']);const q=getQuery(i),l=getLimit(i,50),v=view();return compactResult(v.feedIds.map(id=>v.notesById[id]).filter(n=>n&&includesQuery([n.title,n.content,n.category],q)).map(n=>ns(n!)),l);},
  redbook__get_note_summary:i=>{assertAllowedKeys(i,['note_id']);return ns(note(getQuery(i,'note_id')));},
  redbook__search_users:i=>{assertAllowedKeys(i,['query','limit']);const q=getQuery(i),l=getLimit(i,50),v=view();return compactResult(v.userIds.map(id=>v.usersById[id]).filter(u=>u&&includesQuery([u.name,u.intro,u.location],q)).map(u=>({user_id:u!.id,name:u!.name,introduction:u!.intro,location:u!.location,followers:u!.followers})),l);},
  redbook__list_chat_threads:i=>{assertAllowedKeys(i,['limit']);const l=getLimit(i);return compactResult(state().chats.slice().sort((a,b)=>(b.lastTime??0)-(a.lastTime??0)).map(c=>({user_id:c.userId,username:c.username,last_message:c.lastMessage,unread_count:c.unreadCount,last_time:c.lastTime?TimeService.fromTimestamp(c.lastTime).toISOString():undefined})),l);},
  redbook__search_chat_messages:i=>{assertAllowedKeys(i,['user_id','query','limit']);const id=getQuery(i,'user_id'),q=getQuery(i),l=getLimit(i);const c=requireFound(state().chats.find(c=>c.userId===id),'CHAT_NOT_FOUND',`RedBook chat not found: ${id}`);return compactResult(c.messages.filter(m=>includesQuery([m.content],q)).map(m=>({message_id:m.id,sender_id:m.senderId,content:m.content,timestamp:TimeService.fromTimestamp(m.timestamp).toISOString()})),l);},
  redbook__list_saved_notes:i=>{assertAllowedKeys(i,['limit']);const l=getLimit(i),v=view();return compactResult((state().user.collectedNotes??[]).map(id=>v.notesById[id]).filter(Boolean).map(n=>({note_id:n!.id,title:n!.title,author_id:n!.authorId})),l);},
  redbook__open_search:async()=>{await openAppRoute('redbook','/search');return{route:'/search'};},
  redbook__open_note:async i=>{assertAllowedKeys(i,['note_id']);const id=note(getQuery(i,'note_id')).id;const route=`/note/${encodeURIComponent(id)}`;await openAppRoute('redbook',route);return{route,note_id:id};},
  redbook__open_user:async i=>{assertAllowedKeys(i,['user_id']);const id=user(getQuery(i,'user_id')).id;const route=`/user/${encodeURIComponent(id)}`;await openAppRoute('redbook',route);return{route,user_id:id};},
  redbook__open_chat:async i=>{assertAllowedKeys(i,['user_id']);const id=getQuery(i,'user_id');requireFound(state().chats.find(c=>c.userId===id),'CHAT_NOT_FOUND',`RedBook chat not found: ${id}`);const route=`/chat/${encodeURIComponent(id)}`;await openAppRoute('redbook',route);return{route,user_id:id};},
  redbook__prepare_text_post:async i=>{assertAllowedKeys(i,['title','content']);const title=getQuery(i,'title'),content=getQuery(i,'content');state().updatePublishDraft({title,text:content});await openAppRoute('redbook','/publish/text/final');return{route:'/publish/text/final',persisted:false,title};},
};
export function executeRedbookTool(n:string,i:JsonObject){return requireFound(handlers[n],'TOOL_NOT_FOUND',`Unknown RedBook tool: ${n}`)(i);}export{REDBOOK_TOOL_DEFINITIONS}from'./definitions';

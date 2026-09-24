import { useBilibiliStore } from '@/apps/Bilibili/state';
import { loadAuthors, loadRankings, loadVideoTags, loadVideos } from '@/apps/Bilibili/data/loader';
import type { BilibiliVideo, RankingVideo } from '@/apps/Bilibili/types';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { BILIBILI_TOOL_DEFINITIONS } from './definitions';
const videoSummary=(v:BilibiliVideo|RankingVideo)=>{const stats=(v as BilibiliVideo).stats;return{video_id:v.id,title:v.title,author:v.author,partition:v.partition,duration:v.duration,plays:v.plays,danmaku:v.danmaku,likes:stats?.likes,coins:stats?.coins,favorites:stats?.favorites??stats?.favs};};
async function video(id:string){return requireFound((await loadVideos()).find(v=>v.id===id),'VIDEO_NOT_FOUND',`Bilibili video not found: ${id}`);}
const handlers:Record<string,ToolHandler>={
  bilibili__search_videos:async i=>{assertAllowedKeys(i,['query','limit']);const q=getQuery(i),l=getLimit(i,50);return compactResult((await loadVideos()).filter(v=>includesQuery([v.title,v.author,v.desc,v.partition],q)).map(videoSummary),l);},
  bilibili__get_ranking:async i=>{assertAllowedKeys(i,['partition','limit']);const p=getQuery(i,'partition'),l=getLimit(i,50);const ranks=await loadRankings();const key=Object.keys(ranks).find(k=>k.toLowerCase()===p.toLowerCase())??p;return{partition:key,...compactResult((ranks[key]??[]).map(v=>({rank:v.rank,...videoSummary(v)})),l)};},
  bilibili__get_video_summary:async i=>{assertAllowedKeys(i,['video_id']);return videoSummary(await video(getQuery(i,'video_id')));},
  bilibili__get_video_tags:async i=>{assertAllowedKeys(i,['video_id']);const id=(await video(getQuery(i,'video_id'))).id;return{video_id:id,tags:(await loadVideoTags())[id]??[]};},
  bilibili__search_authors:async i=>{assertAllowedKeys(i,['query','limit']);const q=getQuery(i),l=getLimit(i,50);return compactResult(Object.entries(await loadAuthors()).filter(([,a])=>includesQuery([a.name,a.sign],q)).map(([id,a])=>({author_id:String(a.mid??id),name:a.name,signature:a.sign,followers:a.follower})),l);},
  bilibili__list_favorite_folders:()=>({folders:(useBilibiliStore.getState().user.favoritesFolders??[]).map(f=>({folder_id:f.id,title:f.title,description:f.description,is_public:f.isPublic,video_count:f.videoIds?.length??f.count??0}))}),
  bilibili__open_search:async()=>{await openAppRoute('bilibili','/search');return{route:'/search'};},
  bilibili__open_video:async i=>{assertAllowedKeys(i,['video_id']);const id=(await video(getQuery(i,'video_id'))).id;const route=`/video/${encodeURIComponent(id)}`;await openAppRoute('bilibili',route);return{route,video_id:id};},
  bilibili__open_author:async i=>{assertAllowedKeys(i,['author_id']);const id=getQuery(i,'author_id');requireFound(Object.entries(await loadAuthors()).find(([key,a])=>key===id||String(a.mid)===id),'AUTHOR_NOT_FOUND',`Bilibili author not found: ${id}`);const route=`/user/${encodeURIComponent(id)}`;await openAppRoute('bilibili',route);return{route,author_id:id};},
  bilibili__open_ranking:async()=>{await openAppRoute('bilibili','/ranking');return{route:'/ranking'};},
  bilibili__add_video_to_folder:async i=>{assertAllowedKeys(i,['video_id','folder_id']);const vid=(await video(getQuery(i,'video_id'))).id,fid=getQuery(i,'folder_id');const folders=useBilibiliStore.getState().user.favoritesFolders??[];requireFound(folders.find(f=>f.id===fid),'FOLDER_NOT_FOUND',`Favorite folder not found: ${fid}`);const selected=folders.filter(f=>f.videoIds?.includes(vid)).map(f=>f.id);if(!selected.includes(fid))selected.push(fid);useBilibiliStore.getState().setFavFolders(vid,selected);return{video_id:vid,folder_id:fid,saved:true};},
  bilibili__follow_author:async i=>{assertAllowedKeys(i,['author_id']);const id=getQuery(i,'author_id');const authors=await loadAuthors();const entry=requireFound(Object.entries(authors).find(([key,a])=>key===id||String(a.mid)===id),'AUTHOR_NOT_FOUND',`Bilibili author not found: ${id}`);const mid=String(entry[1].mid??entry[0]);if(!(useBilibiliStore.getState().user.followingList??[]).some(u=>String(u.mid)===mid))useBilibiliStore.getState().toggleFollow(mid);return{author_id:mid,following:true};},
};
export function executeBilibiliTool(n:string,i:JsonObject){return requireFound(handlers[n],'TOOL_NOT_FOUND',`Unknown Bilibili tool: ${n}`)(i);}export{BILIBILI_TOOL_DEFINITIONS}from'./definitions';

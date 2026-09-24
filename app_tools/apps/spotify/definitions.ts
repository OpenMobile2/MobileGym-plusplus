import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';
export const SPOTIFY_TOOL_DEFINITIONS = defineAppTools('spotify', [
  { name:'search_tracks', description:'Search known tracks by title or artist.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'search_artists', description:'Search known artists by name.', properties:{query:STRING,limit:LIMIT}, required:['query'] },
  { name:'get_track_summary', description:'Return compact track metadata and whether it is liked.', properties:{track_id:ID}, required:['track_id'] },
  { name:'list_liked_songs', description:'List liked songs with compact metadata.', properties:{limit:LIMIT} },
  { name:'list_recent_plays', description:'List recent plays newest-first. Timestamp fields are included when the playback record provides them.', properties:{limit:LIMIT} },
  { name:'list_playlists', description:'List user and built-in playlists without expanding every track.', properties:{limit:LIMIT} },
  { name:'open_search', description:'Open Spotify search input.', kind:'navigation' },
  { name:'open_artist', description:'Open the normal Spotify artist page for visual inspection.', properties:{artist:STRING}, required:['artist'], kind:'navigation' },
  { name:'open_playlist', description:'Open the normal Spotify playlist page for visual inspection.', properties:{playlist_id:ID}, required:['playlist_id'], kind:'navigation' },
  { name:'open_queue', description:'Open the player; inspect and edit the queue through the GUI.', kind:'navigation' },
  { name:'add_to_queue', description:'Append one known track to the playback queue.', properties:{track_id:ID}, required:['track_id'], kind:'write' },
  { name:'add_to_playlist', description:'Add one known track to an existing user playlist.', properties:{track_id:ID,playlist_name:STRING}, required:['track_id','playlist_name'], kind:'write', idempotent:true },
]);

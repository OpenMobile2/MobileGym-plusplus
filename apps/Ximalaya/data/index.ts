import defaults from './defaults.json';
import quickListenCopy from './quickListenCopy.json';
import type { Album, Track, XmlyState } from '../types';

const TRACK_STORIES = quickListenCopy as Record<string, { titles: string[]; excerpts: string[] }>;

function hashText(value: string): number {
  return Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function enrichTrack(track: Track, album: Album): Track {
  const story = TRACK_STORIES[album.category] || TRACK_STORIES.播客;
  const episodeIndex = Math.max(0, album.trackIds.indexOf(track.id));
  const copyIndex = (episodeIndex + hashText(album.id)) % story.titles.length;
  return {
    ...track,
    title: `第${episodeIndex + 1}集｜${story.titles[copyIndex]}`,
    transcript: `《${album.title}》${story.excerpts[copyIndex]}`,
  };
}

const source = defaults as unknown as XmlyState;
const albumById = new Map(source.albums.map((album) => [album.id, album]));
const tracks = source.tracks.map((track) => {
  const album = albumById.get(track.albumId);
  return album ? enrichTrack(track, album) : track;
});

export const XIMALAYA_CONFIG: XmlyState = {
  ...source,
  tracks,
};

import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useXimalayaStrings() {
  return useAppStrings(strings, stringsEn);
}

export type XimalayaStringKey = keyof typeof strings;

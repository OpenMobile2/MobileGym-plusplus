import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useDidiStrings() {
  return useAppStrings(strings, stringsEn);
}

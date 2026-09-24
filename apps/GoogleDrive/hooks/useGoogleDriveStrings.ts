import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useGoogleDriveStrings() {
  return useAppStrings(strings, stringsEn);
}

export type GoogleDriveStrings = ReturnType<typeof useGoogleDriveStrings>;

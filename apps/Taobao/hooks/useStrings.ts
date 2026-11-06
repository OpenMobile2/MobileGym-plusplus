import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useStrings() {
  return useAppStrings(strings, stringsEn);
}

import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** flomo i18n：中文基线 + 英文覆盖，跟随系统语言。 */
export function useFlomoStrings() {
  return useAppStrings(strings, stringsEn);
}

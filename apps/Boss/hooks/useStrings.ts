// 文案 hook。真机无 in-app 语言开关,跟随 OS 语言(§10.2)。
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useStrings() {
  return useAppStrings(strings, stringsEn);
}

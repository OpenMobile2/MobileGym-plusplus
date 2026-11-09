// 文案 hook。百词斩真机设置无 in-app 语言开关(8335),故仅跟随 OS 语言(§10.2)。
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

export function useStrings() {
  return useAppStrings(strings, stringsEn);
}

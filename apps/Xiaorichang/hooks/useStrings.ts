// 文案 hook。语言优先级:App 内设置(中文/EN)> 系统语言(设置=『系统』时)。
// 真机 s200:设置页语言切换 = 系统|中文|EN 三档。
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useXiaorichangStore } from '../state';

export function useStrings() {
  const language = useXiaorichangStore((st) => st.settings.language);
  const override = language === 'system' ? undefined : language === 'en' ? ('en' as const) : ('zh-Hans' as const);
  return useAppStrings(strings, stringsEn, override);
}

import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useJingdongStore } from '../state';

export function useJingdongStrings() {
  // 仅读本 App settings.language,不跟随/改写系统全局语言
  const language = useJingdongStore((s) => s.settings.language ?? 'zh-Hans');
  return useAppStrings(strings, stringsEn, language);
}

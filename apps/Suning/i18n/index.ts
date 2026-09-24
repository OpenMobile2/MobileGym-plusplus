import { useAppStrings } from '../../../os/useAppStrings';
import { STRINGS } from '../res/strings';
import { STRINGS_EN } from '../res/strings.en';

/** 统一取文案:const S = useStrings(); S.tabHome */
export function useStrings() {
  return useAppStrings(STRINGS, STRINGS_EN);
}

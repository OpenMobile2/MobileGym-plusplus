import { useLocale } from '../../../os/locale';
import { useXiaorichangStore } from '../state';

/*
 * Seeded/user content stays in the store's canonical form.  Translate only when
 * rendering so actions still read and write the very same objects in every locale.
 */
const SEEDED_CONTENT_EN: Record<string, string> = {
  小满: 'Summer',
  晨间: 'Morning',
  日间: 'Daytime',
  晚间: 'Evening',
  早起: 'Wake up early',
  起床一杯水: 'Drink water after waking',
  背一个单词: 'Learn one word',
  '读书 30 分钟': 'Read for 30 minutes',
  夜跑: 'Evening run',
  '深呼吸 3 次': 'Take 3 deep breaths',
  睡觉: 'Sleep',
  '写日记(已归档)': 'Write journal (archived)',
  晨间三件套: 'Morning routine',
  闹钟响了两次: 'The alarm rang twice',
  一杯芝士奶茶: 'Cheese milk tea',
  买一本想读很久的书: 'Buy a long-awaited book',
  周末看场电影: 'Watch a movie this weekend',
  换一副耳机: 'Get new headphones',
  一次短途旅行: 'Take a short trip',
  小习惯大改变: 'Small habits, big changes',
  '这是一条笔记:别急着把目标定得很大。先选一个小到不可思议的习惯:做一个俯卧撑、读一页书、拉伸10秒——小到几乎不会失败。你要培养的不是「意志力」,而是「开始的动作」。从今天起,只要每天完成这一点点,你就已经在变得更容易坚持了。':
    'Do not rush to set a huge goal. Start with a habit so small it feels impossible to fail: one push-up, one page, or a 10-second stretch. You are training the act of starting. Complete that tiny step every day and consistency will get easier.',
  '长按拖动下方的习惯,可以将其拖动到不同的时间段中。':
    'Long-press a habit below to move it to another time of day.',
  雨天: 'Rainy day',
  '下雨了,把跑步换成了室内拉伸。规则可以让步,别让它断掉。':
    'It rained, so I swapped running for indoor stretching. The rule can bend; the streak does not have to break.',
  '今天单词没背完,标了失败。扣掉的光芒值就当是学费。':
    'I did not finish today’s words, so I marked it failed. The lost Glow is tuition.',
  专注复盘: 'Focus review',
  '45 分钟那档最舒服,25 分钟刚进入状态就被打断。':
    'The 45-minute session felt best; 25 minutes ended just as I found my focus.',
  回复班主任消息: 'Reply to the homeroom teacher',
  收拾明天的书包: "Pack tomorrow's schoolbag",
  给绿萝浇水: 'Water the pothos',
  买牙膏: 'Buy toothpaste',
  预约周六理发: 'Book a haircut for Saturday',
  交电费: 'Pay the electricity bill',
  写周报: 'Write weekly report',
  复习: 'Review',
};

export function useLocalizedContent() {
  const appLanguage = useXiaorichangStore((st) => st.settings.language);
  const osLocale = useLocale();
  const isEnglish = appLanguage === 'en' || (appLanguage === 'system' && osLocale === 'en');
  const text = (value?: string | null) => {
    if (!value) return '';
    return isEnglish ? SEEDED_CONTENT_EN[value] ?? value : value;
  };
  return { isEnglish, text };
}

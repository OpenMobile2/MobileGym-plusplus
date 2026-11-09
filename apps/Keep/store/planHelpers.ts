/** 计划定制相关纯函数（问卷映射 / BMI 评估文案） */

export type BmiBand = '偏低' | '正常' | '偏高';

export function bmiBand(bmi: number): BmiBand {
  if (bmi < 18.5) return '偏低';
  if (bmi < 24) return '正常';
  return '偏高';
}

export function bmiAdvice(band: BmiBand): string {
  if (band === '偏低') return '建议增肌塑形,均衡饮食';
  if (band === '正常') return '保持节奏,有氧力量兼顾';
  return '建议减脂,有氧无氧结合';
}

/** BMI 仪表指针角度：偏低≈-55°、正常≈0°、偏高≈55°（相对竖直） */
export function bmiNeedleAngle(bmi: number): number {
  const clamped = Math.max(15, Math.min(35, bmi));
  // 15→-60, 18.5→-30, 24→25, 35→60
  if (clamped < 18.5) return -60 + ((clamped - 15) / 3.5) * 30;
  if (clamped < 24) return -30 + ((clamped - 18.5) / 5.5) * 55;
  return 25 + ((clamped - 24) / 11) * 35;
}

export type CardioLevel = { label: string; tone: 'weak' | 'ok' | 'good' | 'great'; tip: string };

export function cardioFromStairs(stairs: string | undefined): CardioLevel {
  if (!stairs) return { label: '良好', tone: 'good', tip: '适合中等强度的全身训练' };
  if (stairs.includes('很累') || stairs.includes('喘不过气')) {
    return { label: '较弱 ↓', tone: 'weak', tip: '建议从低冲击有氧循序渐进' };
  }
  if (stairs.includes('比较累')) {
    return { label: '一般', tone: 'ok', tip: '适合循序渐进提升心肺' };
  }
  if (stairs.includes('有点局促')) {
    return { label: '良好', tone: 'good', tip: '适合中等强度的全身训练' };
  }
  return { label: '出色 ↑', tone: 'great', tip: '适合高强度的全身训练' };
}

export function bodytypeTip(bodyType: string): string {
  if (bodyType === '苹果型') return '更多腰腹训练,告别大肚腩';
  if (bodyType === '梨型') return '强化下肢塑形,兼顾上身线条';
  if (bodyType === '沙漏型') return '维持曲线,力量与有氧搭配';
  if (bodyType === '直筒型') return '增肌塑形,打造身体线条';
  return '根据体型定制动作配比';
}

/**
 * 根据问卷答案 + BMI 选择最匹配的计划 id。
 * 无真实 AI，用可解释规则覆盖主流路径。
 */
export function pickPlanIdFromQuiz(
  answers: Record<string, string | string[]>,
  bmi: number,
): string {
  const sport = typeof answers.sport === 'string' ? answers.sport : '';
  const bodytype = typeof answers.bodytype === 'string' ? answers.bodytype : '';
  const stairs = typeof answers.stairs === 'string' ? answers.stairs : '';
  const duration = typeof answers.duration === 'string' ? answers.duration : '';

  if (sport === '跑步') return 'p_run';
  if (bodytype === '苹果型' || bmi >= 25) return 'p_bigweight';
  if (bodytype === '梨型') return 'p_chest';
  if (bodytype === '沙漏型' || sport === '操课') return 'p_abs';
  if (sport === '跳绳') return 'p_summer60';
  if (stairs.includes('非常轻松') || stairs.includes('几乎没有')) return 'p_muscle';
  if (duration.includes('40')) return 'p_summer60';
  if (bmi < 20) return 'p_student_slim';
  return 'p_abs';
}

/** 有氧占比：跑步计划更高，增肌/腹肌偏低 */
export function aerobicRatioForPlan(planId: string, tags: string[]): number {
  if (planId === 'p_run' || tags.includes('跑步')) return 72;
  if (planId === 'p_muscle' || planId === 'p_abs') return 45;
  if (planId === 'p_bigweight' || tags.includes('大体重掉秤')) return 62;
  return 55;
}

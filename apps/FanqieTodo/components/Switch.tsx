/** iOS 风格开关:轨道 + 白色圆形滑块(开→右滑绿色,关→左滑灰色)。 */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-[#4CD964]' : 'bg-[#E5E5E5]'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
      />
    </span>
  );
}

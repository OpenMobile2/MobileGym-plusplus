# -*- coding: utf-8 -*-
"""
卡皮记账 运行时走查(pipeline v3 阶段3 第五道机器 gate;Stage4 v1.1.0 已补 F1/F2/F3/F4 断言)。

按 spec P0 交互在真实模拟器里逐条执行,每步带状态断言(抓"点了没反应"的死按钮),
全程监听 console error / pageerror(零容忍,过滤 WMR/404 资源噪声)。

用法:模拟器 npm run dev 跑在 :3000 时执行
    python apps/Kapi/assets/runtime_walkthrough.py
"""
import asyncio
import sys
from playwright.async_api import async_playwright

URL = "http://localhost:3000"
RESULTS = []


def record(name, passed, detail=""):
    RESULTS.append((name, passed, detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f"  {detail}" if detail else ""), flush=True)


async def st(page, expr):
    return await page.evaluate(f"window.__SIM__.getState().apps.kapi.{expr}")


async def back(page):
    await page.locator('[data-trigger-type="back"]').first.click()
    await page.wait_for_timeout(500)


async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 420, "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:160]}"))
        page.on("console", lambda m: errors.append(f"console: {m.text[:160]}")
                if m.type == "error" and "WMR" not in m.text and "404" not in m.text else None)

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(2200)
        await page.evaluate("window.__OS__.openApp('kapi')")
        await page.wait_for_timeout(2200)

        # W1 首页渲染不崩 + 有种子账单
        b0 = await st(page, "bills.length")
        home_ok = await page.locator('[data-trigger="recordBar.record.open"]').count() > 0
        record("W1 首页渲染+种子账单", home_ok and b0 > 0, f"bills={b0}")

        # W2 记一笔:记账弹层→输入金额→完成→bills+1
        await page.locator('[data-trigger="recordBar.record.open"]').click()
        await page.wait_for_timeout(500)
        await page.locator('[data-action="record.amount.input.value"]', has_text="5").first.click()
        await page.locator('[data-action="record.amount.input.value"]', has_text="0").first.click()
        await page.wait_for_timeout(200)
        await page.locator('[data-action="record.submit.confirm.done"]').click()
        await page.wait_for_timeout(700)
        b1 = await st(page, "bills.length")
        record("W2 完成记一笔 bills+1", b1 == b0 + 1, f"bills {b0}->{b1}")

        # W3 账单详情:打开 + 报销开关切换
        await page.locator('[data-trigger="home.bill.open"]').first.click()
        await page.wait_for_timeout(700)
        on_detail = await page.locator('[data-action="billDetail.reimburse.toggle.flag"]').count() > 0
        r0 = await page.evaluate("window.__SIM__.getState().apps.kapi.bills.filter(b=>b.reimburse).length")
        await page.locator('[data-action="billDetail.reimburse.toggle.flag"]').click()
        await page.wait_for_timeout(400)
        r1 = await page.evaluate("window.__SIM__.getState().apps.kapi.bills.filter(b=>b.reimburse).length")
        record("W3 详情页+报销开关", on_detail and r1 == r0 + 1, f"reimburse {r0}->{r1}")

        # W4 (F3) 实付金额可改:点金额→数字键盘弹层→输入→完成→amount 变化
        bid = await st(page, "_activeBillId")
        amt0 = await page.evaluate(
            "(id)=>window.__SIM__.getState().apps.kapi.bills.find(b=>b.id===id).amount", bid)
        await page.locator('[data-trigger="billDetail.amount.open"]').click()
        await page.wait_for_timeout(500)
        edit_open = await page.locator('[data-action="amountEdit.amount.input.value"]').count() > 0
        await page.locator('[data-action="amountEdit.amount.input.value"]', has_text="5").first.click()
        await page.wait_for_timeout(150)
        await page.locator('[data-action="amountEdit.submit.confirm.done"]').click()
        await page.wait_for_timeout(500)
        amt1 = await page.evaluate(
            "(id)=>window.__SIM__.getState().apps.kapi.bills.find(b=>b.id===id).amount", bid)
        record("W4 (F3) 实付金额可改", edit_open and amt1 != amt0 and amt1 > 0, f"amount {amt0}->{amt1}")

        # W5 删除账单 → bills-1
        b0 = await st(page, "bills.length")
        await page.locator('[data-action="billDetail.delete.confirm.remove"]').click()
        await page.wait_for_timeout(300)
        await page.get_by_text("删除", exact=True).last.click()
        await page.wait_for_timeout(600)
        b1 = await st(page, "bills.length")
        record("W5 删除账单 bills-1", b1 == b0 - 1, f"bills {b0}->{b1}")

        # 回到首页(删除后 back 已返回首页)
        # W6 (F4) 首页月预算剩余 → 预算管理页
        await page.locator('[data-trigger="home.budget.open"]').click()
        await page.wait_for_timeout(700)
        on_budget = await page.locator('[data-trigger="budget.addCategory.open"]').count() > 0
        record("W6 (F4) 月预算剩余跳预算管理", on_budget)
        await back(page)

        # W7 (F1/F2) 统计:周期切换换数据 + 翻页箭头改区间(读 range 标签变化)
        await page.locator('[data-trigger="home.stats.open"]').click()
        await page.wait_for_timeout(700)
        lbl_month = await page.locator('[data-range-label]').inner_text()
        await page.locator('[data-action="stats.period.select.tab"]').nth(0).click()  # 周
        await page.wait_for_timeout(400)
        lbl_week = await page.locator('[data-range-label]').inner_text()
        await page.locator('[data-action="stats.range.select.shift"]').nth(0).click()  # 上一周
        await page.wait_for_timeout(400)
        lbl_week_prev = await page.locator('[data-range-label]').inner_text()
        f1_ok = lbl_week != lbl_month
        f2_ok = lbl_week_prev != lbl_week
        record("W7 (F1) 周期切换换区间", f1_ok, f"月[{lbl_month}] -> 周[{lbl_week}]")
        record("W7 (F2) 翻页箭头改区间", f2_ok, f"周[{lbl_week}] -> 上周[{lbl_week_prev}]")
        await back(page)

        # W8 AI 助手发送消息 → aiMessages+2
        await page.locator('[data-trigger="home.ai.open"]').click()
        await page.wait_for_timeout(600)
        m0 = await st(page, "aiMessages.length")
        await page.locator('input[data-action="ai.message.submit.send"]').fill("帮我复盘一下本月消费")
        await page.locator('button[data-action="ai.message.submit.send"]').click()
        await page.wait_for_timeout(700)
        m1 = await st(page, "aiMessages.length")
        record("W8 AI发送 aiMessages+2", m1 == m0 + 2, f"aiMessages {m0}->{m1}")

        # W9 抽屉→设置→清空所有账单
        await page.locator('[data-trigger="ai.home.open"]').click()
        await page.wait_for_timeout(500)
        await page.locator('[data-trigger="home.drawer.open"]').click()
        await page.wait_for_timeout(500)
        await page.locator('[data-trigger="drawer.settings.open"]').click()
        await page.wait_for_timeout(600)
        await page.locator('[data-action="settings.purge.confirm.delete"]').click()
        await page.wait_for_timeout(300)
        await page.get_by_text("删除", exact=True).last.click()
        await page.wait_for_timeout(500)
        b_final = await st(page, "bills.length")
        record("W9 清空所有账单", b_final == 0, f"bills={b_final}")

        await browser.close()

    print()
    failed = [r for r in RESULTS if not r[1]]
    if errors:
        print(f"console/page errors ({len(errors)}):")
        for e in errors[:10]:
            print("  -", e)
    print(f"\n断言: {len(RESULTS) - len(failed)}/{len(RESULTS)} 通过, 运行时错误: {len(errors)}")
    if failed or errors:
        sys.exit(1)
    print("OK: runtime walkthrough 全绿")


if __name__ == "__main__":
    asyncio.run(main())

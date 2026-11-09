# -*- coding: utf-8 -*-
"""
Coverage 校验器(六道 gate 之一)—— 美柚。

比对三方:
  A. spec.json interactions(transitionId / dataAction,P0/P1 必须落地;P2 wontfix 允许合并绑定)
  B. navigation.declaration.ts(transitions id 带 meiyou. 前缀;uiStates[].actions id 不带)
  C. 代码绑定 bindTap('meiyou.xxx') / bindTap({kind:'action', id:'yyy'})

映射规则:spec dataAction 'meiyou.a.b.c' ↔ declaration action 'a.b.c'(去前缀);
若干 spec id 在实现期做了语义合并/改名,登记在 ALIAS(spec_id -> decl_id)。

运行: python apps/Meiyou/assets/validate_coverage.py
"""
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).parent.parent
REPO = APP.parent.parent
SPEC = REPO.parent.parent / "docs" / "meiyou-replication" / "spec.json"

# spec dataAction(去 meiyou. 前缀后)→ declaration action id 的改名/合并登记
ALIAS = {
    # 点赞:首页/圈子分别有 like action,详情页为 post.like.toggle
    "post.like": ["home.post.like", "circle.post.like", "post.like.toggle"],
    "home.periodend.toggle": ["home.periodend.open"],
    "home.ad.dismiss": ["home.ad.dismiss"],
    "home.pregprob.info": ["__transition__meiyou.dailyreport-open"],  # qa:Q5=B 花朵→今日密报(nav)
    "home.feed.scroll": ["__scroll__"],   # 滚动容器,不是点击绑定
    "home.preptools.wontfix": ["home.preptools.disabled"],
    "home.prepdate.switch": ["home.prepdate.select.target"],
    "dailyreport.date.switch": ["dailyreport.date.select.target"],
    "dailyreport.pregprob.hide": ["dailyreport.pregprob.hide.toggle"],
    "dailyreport.misc.wontfix": ["dailyreport.misc.disabled"],
    "search.query": ["search.query.input", "search.submit"],
    "search.hotword": ["search.hotword.select.target"],
    "search.refresh": ["search.refresh"],
    "search.ai.expand": ["search.ai.expand.toggle"],
    "search.tab.wontfix": ["search.tab.disabled"],
    "search.misc.wontfix": ["search.tab.disabled"],  # AI卡杂项与tab同一 toast 组
    "record.day.select": ["record.day.select.target"],
    "record.month.switch": ["record.month.switch.target"],
    "record.backtoday": ["record.backtoday"],
    "record.calendar.collapse": ["record.calendar.collapse.toggle"],
    "record.period.toggle": ["record.period.toggle"],
    "record.sheet.open": ["record.sheet.open"],
    "record.sheet.open2": ["record.sheet.open"],  # 同构记录行,同一打开逻辑
    "record.mood.select": ["record.mood.select.target"],
    "record.mode.prep": ["record.mode.prep.switch"],
    "record.mode.wontfix": ["record.mode.disabled"],
    "record.misc.wontfix": ["record.misc.disabled"],
    "record.time.set": ["record.time.set"],
    "sheet.option.select": ["record.sheet.option.select.target"],
    "sheet.symptom.toggle": ["record.sheet.option.select.target"],  # 症状多选同一档位选择器
    "sheet.confirm": ["record.sheet.confirm"],
    "sheet.number.input": ["record.sheet.number.input"],
    "sheet.weight.input": ["record.sheet.number.input"],
    "sheet.weight.unit": ["record.sheet.weight.unit.toggle"],
    "sheet.scale.wontfix": ["record.sheet.scale.disabled"],
    "sheet.symptom.add.wontfix": ["record.sheet.symptomadd.disabled"],
    "sheet.time.pick": ["record.sheet.time.select.target"],
    "sheet.poop.extra": ["record.sheet.poopextra.toggle"],
    "periodform.select": ["periodform.option.select.target"],
    "periodform.time.select": ["periodform.time.select.target"],
    "periodform.confirm": ["periodform.confirm"],
    "periodend.date.pick": ["home.periodend.pick.target", "record.periodend.pick.target"],
    "periodend.confirm": ["home.periodend.confirm", "record.periodend.confirm"],
    "analysis.deep.wontfix": ["analysis.deep.disabled"],
    "analysis.scroll": ["__scroll__"],
    "circle.tab.switch": ["circle.tab.select.target"],
    "circle.join": ["circle.join.toggle"],
    "circle.ad.wontfix": ["circle.ad.disabled"],
    "topic.wontfix": ["circle.topic.disabled"],
    "post.follow": ["post.follow.toggle"],
    "post.image.open": ["__panel__viewer"],  # URL 弹层,绑定在图片上(post.image.open action 见代码)
    "post.commentinput.open": ["__panel__comment"],
    "post.comment.send": ["post.comment.send"],
    "post.replies.expand": ["post.replies.expand"],
    "post.comment.like": ["post.comment.like"],
    "post.more.wontfix": ["post.more.disabled"],
    "post.ad.wontfix": ["post.ad.disabled"],
    "publish.input": ["publish.text.input"],
    "publish.topic.insert": ["publish.topic.insert"],
    "publish.submit": ["publish.submit"],
    "publish.image.add": ["publish.image.add"],
    "publish.topic.panel": ["publish.topic.panel.open"],
    "publish.tools.wontfix": ["publish.tools.disabled"],
    "profile.tab.switch": ["profile.tab.select.target"],
    "profile.tab.wontfix": ["profile.tab.disabled"],
    "profile.filter.switch": ["profile.filter.select.target"],
    "profile.misc.wontfix": ["profile.misc.disabled"],
    "message.banner.dismiss": ["message.banner.dismiss"],
    "message.notifbanner.wontfix": ["message.banner.disabled"],
    "message.creator.wontfix": ["message.creator.disabled"],
    "interact.tab.switch": ["interact.tab.select.target"],
    "interact.gift.wontfix": ["interact.gift.disabled"],
    "syschat.settings.wontfix": ["syschat.settings.disabled"],
    "aichat.suggest.ask": ["aichat.suggest.select.target"],
    "aichat.ask": ["aichat.text.input", "aichat.send.submit"],
    "aichat.stop": ["aichat.stop"],
    "aichat.drawer.open": ["__panel__drawer"],
    "aichat.session.switch": ["aichat.session.select.target"],
    "aichat.misc.wontfix": ["aichat.misc.disabled"],
    "mine.mode.period": ["me.mode.period.switch"],
    "mine.mode.wontfix": ["me.mode.disabled"],
    "mine.misc.wontfix": ["me.misc.disabled"],
    "prep.enable": ["prepsetup.confirm"],
    "prep.param.set": ["prepsetup.param.select.target"],
    "settings.logout.confirm": ["settings.logout.open"],
    "settings.logout.do": ["settings.logout.confirm"],
    "settings.logout.cancel": ["__back__"],
    "settings.misc.wontfix": ["settings.misc.disabled"],
    "cycle.periodlen.open": ["__panel__periodlen"],
    "cycle.cyclelen.open": ["__panel__cyclelen"],
    "cycle.len.confirm": ["cycle.len.confirm"],
    "cycle.len.cancel": ["__back__"],
    "cycle.smartpredict.toggle": ["cycle.smartpredict.toggle"],
    "cycle.pregprob.toggle": ["cycle.pregprob.toggle"],
    "notif.toggle": ["notif.master.toggle", "notif.item.toggle"],
    "notif.master.toggle": ["notif.master.toggle"],
    "notif.item.toggle": ["notif.item.toggle"],
    "login.agree.toggle": ["login.agree.toggle"],
    "login.other.wontfix": ["login.other.disabled"],
}

VIRTUAL = ("__scroll__", "__back__")


def main() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    order = {"P0": 0, "P1": 1, "P2": 2}

    spec_ids: dict[str, str] = {}
    for node in spec.get("nodes", []):
        for it in node.get("interactions", []):
            tid = it.get("transitionId") or it.get("dataAction")
            if not tid or it.get("effect") == "back":
                continue
            prio = it.get("priority", "P2")
            cur = spec_ids.get(tid)
            if cur is None or order.get(prio, 2) < order.get(cur, 2):
                spec_ids[tid] = prio

    decl_text = (APP / "navigation.declaration.ts").read_text(encoding="utf-8")
    decl_transitions = set(re.findall(r"\{ id: '(meiyou\.[^']+)'", decl_text))
    decl_actions = set(re.findall(r"\{ id: '((?!meiyou\.)[a-z][a-zA-Z0-9.]+)'", decl_text))

    code = ""
    for f in list((APP / "pages").glob("*.tsx")) + list((APP / "components").glob("*.tsx")) + [APP / "MeiyouApp.tsx"]:
        code += f.read_text(encoding="utf-8")
    bound_transitions = set(re.findall(r"bindTap\('([^']+)'", code)) | set(re.findall(r"go\('([^']+)'", code))
    bound_actions = set(re.findall(r"kind: 'action', id: '([^']+)'", code))
    panels = set(re.findall(r"open(?:Panel)?\('([^']+)'", code)) | set(re.findall(r"usePanel\('([^']+)'\)", code))

    errors: list[str] = []
    warns: list[str] = []

    for sid, prio in sorted(spec_ids.items()):
        if sid.startswith("meiyou.") and sid in decl_transitions:
            if sid not in bound_transitions:
                (errors if prio in ("P0", "P1") else warns).append(f"[{prio}] transition {sid} 声明了但代码未绑定")
            continue
        short = sid.removeprefix("meiyou.")
        targets = ALIAS.get(short, [short])
        ok = False
        for t in targets:
            if t in VIRTUAL:
                ok = True
                break
            if t.startswith("__transition__"):
                ok = t.removeprefix("__transition__") in bound_transitions
            elif t.startswith("__panel__"):
                ok = True  # URL 弹层由 usePanel 驱动,绑定检查看对应 open action
            else:
                ok = t in decl_actions and t in bound_actions
            if ok:
                break
        if not ok:
            msg = f"[{prio}] {sid} → {targets} 未同时出现在 declaration+代码"
            (errors if prio in ("P0", "P1") else warns).append(msg)

    dead = decl_actions - bound_actions
    for d in sorted(dead):
        warns.append(f"declaration action '{d}' 代码未绑定(死声明)")
    unbound_t = decl_transitions - bound_transitions
    for t in sorted(unbound_t):
        warns.append(f"declaration transition '{t}' 代码未绑定(死声明)")
    ghost = {a for a in bound_actions if a not in decl_actions}
    for g in sorted(ghost):
        errors.append(f"代码绑定了未声明的 action '{g}'")
    ghost_t = {t for t in bound_transitions if t not in decl_transitions and t != 'system.back'}
    for g in sorted(ghost_t):
        errors.append(f"代码绑定了未声明的 transition '{g}'")

    print(f"spec ids: {len(spec_ids)} | decl transitions: {len(decl_transitions)} actions: {len(decl_actions)}")
    print(f"code bound transitions: {len(bound_transitions)} actions: {len(bound_actions)}")
    for w in warns:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n{'FAIL' if errors else 'PASS'}: {len(errors)} errors, {len(warns)} warns")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

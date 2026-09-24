#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从冻结的 spec.json 生成 navigation.declaration.ts。

保证 spec 里每个 nav transitionId 都成为 transition,每个 state/wontfix actionId 都成为
对应 uiState 的 action —— 覆盖率 gate 的 id 完整性由此保证。
返回/关闭(gesture=back, transitionId=system.back)不声明,由 bindBack 处理。

百词斩全部节点均为整页(菜单/弹层建模为页面 uiState,非独立节点),故 DIALOG_ON 为空。
"""
import json
from pathlib import Path

APP = "baicizhan"
SPEC = Path(__file__).parents[5] / "docs/baicizhan-replication/spec.json"
OUT = Path(__file__).parents[1] / "navigation.declaration.ts"

# 节点 -> (pathname, 组件名)
ROUTE_OF = {
    # 主 4 tab
    "home.main": ("/", "HomePage"),
    "course.main": ("/course", "CoursePage"),
    "train.main": ("/train", "TrainPage"),
    "mall.main": ("/mall", "MallPage"),
    # 学习流
    "study.session": ("/study", "StudyPage"),
    "study.detail": ("/study/detail", "WordDetailPage"),
    "review.session": ("/review", "ReviewPage"),
    "study.settle": ("/study/settle", "SettlePage"),
    "study.summary": ("/study/summary", "SummaryPage"),
    # 首页周边
    "task.main": ("/task", "TaskPage"),
    "rank.main": ("/rank", "RankPage"),
    "dict.search": ("/dict", "DictPage"),
    "dict.result": ("/dict/result", "DictResultPage"),
    "wordbook.list": ("/wordbook", "WordbookListPage"),
    "wordbook.detail": ("/wordbook/detail", "WordbookDetailPage"),
    "wordbook.edit": ("/wordbook/edit", "WordbookEditPage"),
    "wordbook.add": ("/wordbook/add", "WordbookAddPage"),
    "book.plan": ("/book/plan", "BookPlanPage"),
    "book.adjust": ("/book/adjust", "BookAdjustPage"),
    "book.manage": ("/book/manage", "BookManagePage"),
    "book.store": ("/book/store", "BookStorePage"),
    "book.words": ("/book/words", "BookWordsPage"),
    "word.browse": ("/word/browse", "WordBrowsePage"),
    "member.pro": ("/member", "MemberPage"),
    "coin.detail": ("/coin", "CoinPage"),
    "streak.main": ("/streak", "StreakPage"),
    "share.cards": ("/share", "SharePage"),
    "stats.review": ("/stats/review", "ReviewStatsPage"),
    # 训练场
    "train.choice": ("/train/choice", "TrainChoicePage"),
    "train.spell": ("/train/spell", "TrainSpellPage"),
    "train.cnchoice": ("/train/cnchoice", "TrainCnChoicePage"),
    "train.fillblank": ("/train/fillblank", "TrainFillblankPage"),
    "train.assemble": ("/train/assemble", "TrainAssemblePage"),
    "train.selfcheck": ("/train/selfcheck", "TrainSelfCheckPage"),
    # Gate4 v2 补充页
    "course.topic": ("/course/topic", "CourseTopicPage"),
    "course.lesson": ("/course/lesson", "CourseLessonPage"),
    "mall.category": ("/mall/category", "MallCategoryPage"),
    "mall.mine": ("/mall/mine", "MallMinePage"),
    "profile.wallet": ("/me/wallet", "WalletPage"),
    "profile.books": ("/me/books", "MyBooksPage"),
    "profile.help": ("/me/help", "HelpPage"),
    # 我的
    "profile.main": ("/me", "ProfilePage"),
    "settings.main": ("/settings", "SettingsPage"),
    "settings.account": ("/settings/account", "AccountPage"),
    "settings.sound": ("/settings/sound", "SoundSettingsPage"),
    "settings.push": ("/settings/push", "PushSettingsPage"),
    "settings.privacy": ("/settings/privacy", "PrivacySettingsPage"),
    "settings.cache": ("/settings/cache", "CacheSettingsPage"),
    "collect.hub": ("/collect", "CollectPage"),
    "vocab.test": ("/vocab-test", "VocabTestPage"),
    "identity.edit": ("/identity", "IdentityPage"),
    # 商城
    "mall.search": ("/mall/search", "MallSearchPage"),
    "mall.detail": ("/mall/detail", "MallDetailPage"),
    "mall.reviews": ("/mall/reviews", "MallReviewsPage"),
    "mall.cart": ("/mall/cart", "CartPage"),
    "order.confirm": ("/mall/order", "OrderConfirmPage"),
    "address.add": ("/mall/address", "AddressAddPage"),
    # 阅读(内嵌薄荷阅读,自带子 tabbar)
    "read.home": ("/read", "ReadHomePage"),
    "read.article": ("/read/article", "ReadArticlePage"),
    "read.toc": ("/read/toc", "ReadTocPage"),
    "read.plan": ("/read/plan", "ReadPlanPage"),
    "read.mine": ("/read/mine", "ReadMinePage"),
    "read.camp": ("/read/camp", "ReadCampPage"),
    "read.profile": ("/read/profile", "ReadProfilePage"),
    "system.unavailable": ("/unavailable", "UnavailablePage"),
}
ROUTE_OF = {k: v for k, v in ROUTE_OF.items() if v is not None}

DIALOG_ON: dict = {}

spec = json.loads(SPEC.read_text(encoding="utf-8"))
if not spec.get("frozen"):
    raise SystemExit("拒绝生成:spec 未冻结(frozen != true)。先过阶段④ Gate。")
nodes = spec["nodes"]
by_id = {n["id"]: n for n in nodes}

# 一致性自检:每个非 component 节点都必须映射
COMPONENT_IDS = {n["id"] for n in nodes if n.get("kind") == "component"}
unmapped = [n["id"] for n in nodes
            if n["id"] not in COMPONENT_IDS and n["id"] not in ROUTE_OF and n["id"] not in DIALOG_ON]
if unmapped:
    raise SystemExit(f"以下 spec 节点未映射到路由,拒绝生成:{unmapped}")

TAB_ROOTS = {"/", "/course", "/train", "/mall"}


def node_path(nid):
    if nid in ROUTE_OF:
        return ROUTE_OF[nid][0]
    if nid in DIALOG_ON:
        return DIALOG_ON[nid][0]
    return None


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def behavior_of(aid):
    if aid.endswith(".toggle") or aid.endswith("Toggle"):
        return "toggle"
    if ".select." in aid:
        return "select"
    if aid.endswith(".input"):
        return "input"
    if aid.endswith(".commit") or aid.endswith(".submit") or aid.endswith(".save"):
        return "submit"
    return "other"


def actions_for(node):
    out, seen = [], set()
    for it in node.get("interactions", []):
        if it.get("effect") != "state":
            continue
        aid = it.get("actionId")
        if not aid or aid in seen:
            continue
        seen.add(aid)
        beh = behavior_of(aid)
        is_wontfix = it.get("priority") == "wontfix"
        label = esc(it.get("element", aid))
        idents = list(it.get("params", []) or [])
        ps = {p: "string" for p in idents}
        if beh == "input":
            ps["value"] = "string"
        a = {"id": aid, "label": label + (" (暂未开放)" if is_wontfix else ""), "behavior": beh}
        if idents:
            a["scope"] = "item"
            a["paramsSchema"] = ps
        elif ps:
            a["paramsSchema"] = ps
        out.append(a)
    return out


routes = []
for nid, (path, comp) in ROUTE_OF.items():
    rnode = by_id[nid]
    ui_states = [{
        "id": f"{APP}.{nid}.base",
        "search": {},
        "description": esc(rnode.get("title", nid)),
        "actions": actions_for(rnode),
    }]
    query_keys = {}
    for it in rnode.get("interactions", []):
        for p in it.get("params", []) or []:
            query_keys[p] = "string"
    routes.append({
        "path": path, "component": comp, "params": {},
        "entryPoint": "home" if path == "/" else "none",
        "scrollContainers": [{"name": "main", "direction": "vertical", "description": "主滚动区"}],
        "uiStates": ui_states,
        "queryParams": query_keys,
        "description": esc(rnode.get("title", nid)),
    })

transitions = []
seen_t = set()
for n in nodes:
    src = n["id"]
    from_path = "*" if n.get("kind") == "component" else node_path(src)
    for it in n.get("interactions", []):
        if it.get("effect") != "nav" or it.get("gesture") == "back":
            continue
        tid, tgt = it.get("transitionId"), it.get("target")
        if not tid or not tgt or tid in seen_t:
            continue
        if tgt in ROUTE_OF:
            to, search = ROUTE_OF[tgt][0], {}
        elif tgt in DIALOG_ON:
            to, search = DIALOG_ON[tgt][0], dict(DIALOG_ON[tgt][1])
        else:
            raise SystemExit(f"transition {tid} 指向未映射节点 {tgt}")
        seen_t.add(tid)
        mode = it.get("mode") or ("replace" if tid.startswith("tabbar.") or tid.startswith("read.tabbar.") else "push")
        transitions.append({
            "id": tid, "from": from_path or "*", "to": to, "search": search,
            "searchParams": {p: "string" for p in it.get("params", []) or []},
            "mode": mode, "params": {},
            "label": esc(it.get("element", tid)),
            "ui": {"placement": "none", "icon": "chevronRight",
                   "gesture": "longPress" if it.get("gesture") == "long-press" else "tap"},
        })


def _prim(x):
    return isinstance(x, (str, int, float, bool))


def js(v, ind=0):
    pad = "  " * ind
    if isinstance(v, dict):
        if not v:
            return "{}"

        def kf(k):
            return k if str(k).isidentifier() else f"'{esc(k)}'"

        if all(_prim(val) for val in v.values()):
            return "{ " + ", ".join(f"{kf(k)}: {js(val)}" for k, val in v.items()) + " }"
        lines = [f"{pad}  {kf(k)}: {js(val, ind + 1)}" for k, val in v.items()]
        return "{\n" + ",\n".join(lines) + f"\n{pad}}}"
    if isinstance(v, list):
        if not v:
            return "[]"
        return "[\n" + ",\n".join(f"{pad}  {js(x, ind + 1)}" for x in v) + f"\n{pad}]"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return f"'{esc(v)}'"


header = f"""// AUTO-GENERATED by assets/gen_nav_declaration.py from
// docs/baicizhan-replication/spec.json (frozen v{spec['specVersion']}).
// 覆盖率 gate 依赖此文件包含 spec 全部 transitionId/actionId。改交互请先改 spec 再重跑本脚本。
import type {{ NavigationDeclaration }} from './navigation.types';

export const NAVIGATION_DECLARATION = {{
  app: '{APP}',
  routes: {js(routes, 1)},
  transitions: {js(transitions, 1)},
  capabilities: {{ historyBack: true }},
}} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
"""

OUT.write_text(header, encoding="utf-8")
n_actions = sum(len(u.get("actions", [])) for r in routes for u in r["uiStates"])
print(f"OK: {OUT.name}  routes={len(routes)} transitions={len(transitions)} actions={n_actions}")

spec_t = {it["transitionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "nav" and it.get("gesture") != "back" and it.get("transitionId")}
spec_a = {it["actionId"] for n in nodes for it in n.get("interactions", [])
          if it.get("effect") == "state" and it.get("actionId")}
decl_t = {t["id"] for t in transitions}
decl_a = {a["id"] for r in routes for u in r["uiStates"] for a in u.get("actions", [])}
miss_t, miss_a = spec_t - decl_t, spec_a - decl_a
print(f"   transition 覆盖 {len(decl_t)}/{len(spec_t)}", "✓" if not miss_t else f"✗ 漏 {sorted(miss_t)}")
print(f"   action     覆盖 {len(decl_a)}/{len(spec_a)}", "✓" if not miss_a else f"✗ 漏 {sorted(miss_a)}")
if miss_t or miss_a:
    raise SystemExit(1)

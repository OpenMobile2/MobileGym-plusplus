# -*- coding: utf-8 -*-
"""从 docs/youku-replication/spec.json(冻结 v1.0.0)生成 apps/Youku/navigation.declaration.ts。

覆盖率 gate 依赖生成文件包含 spec 全部 transitionId/actionId(双向)。
改交互请先改 spec 再重跑本脚本: python apps/Youku/assets/gen_nav_declaration.py

生成规则(与 docs/youku-replication/05-build-progress.md 的接口契约一致):
- 每个 spec 节点一条 route,base uiState id = youku.<nodeId>.base;
- effect=nav 的交互 → transitions(按 transitionId 去重、合并 from);
- effect=state 的交互 → 归属 route 的 uiStates[].actions(全局按 actionId 去重,首个所属节点持有);
- note 含『内容卡通用路由』(或 EXTRA_CASES 白名单)的 transition 生成 4 分支 cases,
  运行时按参数 ctype(movie/series/short/drama)分流 —— 页面用 utils/openContent.contentNavParams(item);
- actionId 中的 <占位> 按 spec note 的取值枚举展开为字面量(checker 合同)。
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve()
APP_DIR = HERE.parents[1]
REPO_ROOT = HERE.parents[5]  # mobilegym-mock/
SPEC = REPO_ROOT / "docs" / "youku-replication" / "spec.json"
OUT = APP_DIR / "navigation.declaration.ts"

spec = json.loads(SPEC.read_text(encoding="utf-8"))

NODES = {n["id"]: n for n in spec["nodes"]}
# OS 合同:App 主页必须在 '/'(OS 多处 activityNav('/') 复位);spec 的 /home 映射为 '/'
for _n in NODES.values():
    if _n["id"] == "home.main":
        _n["route"] = "/"
CHROME = {n["id"]: n for n in spec.get("chrome", [])}

COMPONENTS = {
    "home.main": "HomeMainPage", "home.channel": "HomeChannelPage", "home.channelLite": "HomeChannelLitePage",
    "search.entry": "SearchEntryPage", "search.results": "SearchResultsPage",
    "player.main": "PlayerMoviePage", "player.series.main": "PlayerSeriesPage",
    "player.series.episodes.sheet": "EpisodesSheet", "player.rating.page": "RatingPage",
    "player.share.sheet": "ShareSheet", "player.speed.sheet": "SpeedSheet", "player.timer.sheet": "TimerSheet",
    "shorts.feed": "ShortsFeedPage", "shorts.watched": "ShortsWatchedPage", "shorts.dramaList": "ShortsDramaListPage",
    "taohaopian.hot": "TaoHotPage", "taohaopian.jieshuo": "TaoJieshuoPage",
    "taohaopian.publish.sheet": "TaoPublishSheet", "taohaopian.upcoming": "TaoUpcomingPage",
    "vip.main": "VipPage",
    "me.main": "MePage", "me.profile": "MyProfilePage", "me.profileEdit": "ProfileEditPage",
    "me.following": "FollowingPage", "me.fans": "FansPage", "me.library": "LibraryPage",
    "me.history": "HistoryPage", "me.favtypes": "FavTypesPage", "me.downloads": "DownloadsPage",
    "me.orders": "OrdersPage", "me.coupons": "CouponsPage", "me.settings": "SettingsPage",
    "creator.profile": "CreatorProfilePage",
    "msg.center": "MsgCenterPage", "msg.likes": "MsgNoticesPage", "msg.fans": "MsgFansPage", "msg.system": "MsgSystemPage",
    "publish.editor": "PublishEditorPage", "publish.topic": "PublishTopicPage", "publish.show": "PublishShowPage",
}

# actionId 占位展开(取值来自 spec 各交互 note/stateChange)
EXPAND = {
    "taohaopian.hot.filter.select.<tag>": ["hot", "heibang", "xuanyi", "yinhang"],
    "taohaopian.jieshuo.vote.select.<option>": ["xihuan", "youyisi", "luguo"],
    "taohaopian.upcoming.sort.select.<option>": ["recommend", "time"],
    "vip.plan.select.<option>": ["monthly", "quarter", "year"],
    "me.profile.tab.select.<tab>": ["video", "moments", "interact", "likes"],
    "me.profileEdit.gender.select.<option>": ["male", "female", "secret"],
    "me.following.tab.select.<tab>": ["user", "topic"],
    "me.library.tab.select.<tab>": ["zhui", "yuyue", "fav"],
    "me.library.favtab.select.<sub>": ["video", "comic"],
    "me.favtypes.tab.select.<type>": ["chuanqi", "guou", "nvxing", "youqing", "guoman", "rexue"],
    "me.orders.tab.select.<tab>": ["orders", "films"],
    "me.coupons.tab.select.<tab>": ["all", "welfare", "virtual", "goods", "offline"],
    "me.coupons.subtab.select.<sub>": ["received", "expired"],
}

# item 作用域动作:真实标识参数(checker: scope:'item' 需非 value 的标识参数)
ITEM_ACTIONS = {
    "player.comment.like.toggle": {"commentId": "string"},
    "player.comment.replies.expand": {"commentId": "string"},
    "player.comment.reply.start": {"commentId": "string"},
    "player.comment.fulltext.expand": {"commentId": "string"},
    "home.channel.follow.toggle": {"showId": "string"},
    "home.channel.reserve.toggle": {"upcomingId": "string"},
    "taohaopian.upcoming.reserve.toggle": {"upcomingId": "string"},
    "me.library.reserve.toast": {"upcomingId": "string"},
    "me.library.reserve.cancel": {"upcomingId": "string"},
    "me.library.edit.select.toggle": {"itemId": "string"},
    "me.history.edit.select.toggle": {"itemKey": "string"},
    "me.following.recommend.follow.toggle": {"userId": "string"},
    "me.following.unfollow.confirm": {"userId": "string"},
    "me.fans.followback.toggle": {"userId": "string"},
    "search.results.userFollow.toggle": {"userId": "string"},
    "creator.profile.dynamic.like.toggle": {"dynamicId": "string"},
    "me.profile.commentlike.toggle": {"interactionId": "string"},
    "taohaopian.jieshuo.vote.select.xihuan": {"shortId": "string"},
    "taohaopian.jieshuo.vote.select.youyisi": {"shortId": "string"},
    "taohaopian.jieshuo.vote.select.luguo": {"shortId": "string"},
    "taohaopian.jieshuo.comment.like.toggle": {"commentId": "string"},
}

# tab/子tab/频道切换与面板互换 → replace,其余 push
REPLACE_IDS = {
    "home.main.channel.open", "home.main.channelLite.open", "home.main.swipeChannel.open",
    "home.channel.switch.open", "home.channel.channelLite.open", "home.channel.swipeChannel.open",
    "home.channelLite.channel.open", "home.channelLite.switch.open", "home.channelLite.swipeChannel.open",
    "shorts.feed.watched.open", "shorts.feed.dramaList.open",
    "shorts.watched.feed.open", "shorts.watched.dramaList.open",
    "shorts.dramaList.watched.open", "shorts.dramaList.feed.open",
    "taohaopian.hot.jieshuo.open", "taohaopian.hot.upcoming.open",
    "taohaopian.jieshuo.hot.open", "taohaopian.jieshuo.upcoming.open",
    "taohaopian.upcoming.hot.open", "taohaopian.upcoming.jieshuo.open",
    "player.share.speed.open", "player.share.timer.open",
}

# 目标路由默认动态参数(queryParams;运行时缺省则不写 URL)
TARGET_QUERY = {
    "/player": {"videoId": "string"},
    "/player/series": {"showId": "string", "ep": "string"},
    "/player/rating": {"videoId": "string"},
    "/shorts": {"shortId": "string"},
    "/shorts/dramas": {"dramaId": "string"},
    "/search/results": {"keyword": "string"},
}
NO_QUERY_IDS = {
    "chrome.tabbar.home.open", "chrome.tabbar.shorts.open", "chrome.tabbar.vip.open",
    "chrome.tabbar.taohaopian.open", "chrome.tabbar.me.open",
}
EXTRA_QUERY = {
    "msg.likes.player.open": {"commentId": "string"},
    "search.results.entry.open": {"keyword": "string"},
}
# 在追为 me.library 默认 tab(base 即在追),仅收藏入口带 tab=fav
STATIC_SEARCH = {
    "me.library.fav.open": {"tab": "fav"},
}
PRESERVE = {
    "player.more.share.open": ["videoId"],
    "player.share.open": ["videoId"],
    "player.series.share.open": ["showId", "ep"],
    "player.share.speed.open": ["videoId", "showId", "ep"],
    "player.share.timer.open": ["videoId", "showId", "ep"],
    "player.rating.open": ["videoId"],
    "player.series.episodes.open": ["showId", "ep"],
}
# note 未标注但同属「影视内容卡」的跳转(全局规则:任何影视卡按类型路由)
EXTRA_CASES = {
    "home.channel.banner.player.open", "home.channel.opfloor.player.open",
    "home.channel.broadcast.player.open", "home.channelLite.banner.player.open",
    "taohaopian.jieshuo.player.open",
}
# 频道左右滑:相邻频道可能是内容频道或长尾频道(kind 参数分流)
SWIPE_CASES = {
    "home.main.swipeChannel.open": "content",
    "home.channel.swipeChannel.open": "content",
    "home.channelLite.swipeChannel.open": "lite",
}

BRANCHES = [
    ("movie", "/player", {"videoId": "string"}),
    ("series", "/player/series", {"showId": "string", "ep": "string"}),
    ("short", "/shorts", {"shortId": "string"}),
    ("drama", "/shorts/dramas", {"dramaId": "string"}),
]

# route 额外 uiStates(URL 驱动的编辑态/入口 tab;进入编辑态由 action + setSearchParams push,back 退出)
EXTRA_STATES = {
    "me.library": [
        ("fav", {"tab": "fav"}, "收藏tab(入口指定;base=默认在追tab)"),
        ("edit", {"edit": "1"}, "编辑多选态(URL 驱动,back 退出)"),
    ],
    "me.history": [
        ("edit", {"edit": "1"}, "编辑多选态(URL 驱动,back 退出)"),
    ],
}
# 动作放进指定 uiState(默认 base)
ACTION_STATE = {
    "me.library.edit.select.toggle": "edit",
    "me.library.edit.selectAll.toggle": "edit",
    "me.library.edit.delete.commit": "edit",
    "me.history.edit.select.toggle": "edit",
    "me.history.edit.selectAll.toggle": "edit",
    "me.history.edit.delete.commit": "edit",
}

# ------------------------------------------------------------------ 收集
spec_tids, spec_aids = set(), set()
transitions = {}  # id -> dict
route_actions = {}  # nodeId -> {stateSuffix: [action dict]}
order_nodes = [n["id"] for n in spec["nodes"]]


def behavior_of(aid, gesture):
    if gesture == "input" or aid.endswith(".input") or aid.endswith(".change") or aid.endswith(".publish") or aid.endswith(".send"):
        if aid.endswith(".publish") or aid.endswith(".send"):
            return "input"
        return "input"
    if ".select." in aid:
        return "select"
    if aid.endswith(".toggle"):
        return "toggle"
    if aid.endswith((".submit", ".confirm", ".commit", ".apply", ".add")):
        return "submit"
    if aid.endswith((".open", ".enter", ".start")):
        return "open"
    if aid.endswith((".dismiss", ".close")):
        return "close"
    if aid.endswith((".clear", ".delete", ".insert", ".adjust", ".jump")):
        return "modify"
    if aid.endswith((".expand",)):
        return "toggle"
    return "other"


def add_action(node_id, itx):
    raw_id = itx["actionId"]
    note_opts = EXPAND.get(raw_id)
    if note_opts:
        prefix = raw_id[: raw_id.index("<")]
        ids = [prefix + opt for opt in note_opts]
    else:
        ids = [raw_id]
    for aid in ids:
        assert "<" not in aid, f"未展开的占位 actionId: {aid}"
        if aid in seen_actions:
            spec_aids.add(aid)
            continue
        seen_actions.add(aid)
        spec_aids.add(aid)
        label = itx.get("element", aid)
        if note_opts:
            label = f"{label}={aid.rsplit('.', 1)[-1]}"
        if "wontfixToast" in aid:
            label = f"{label} (暂未开放)"
        a = {"id": aid, "label": label, "behavior": behavior_of(aid, itx.get("gesture", "tap"))}
        ps = itx.get("paramsSchema")
        if isinstance(ps, dict):
            a["paramsSchema"] = dict(ps)
        elif ".select." in aid and not note_opts and not aid.endswith((".vip", ".svip")):
            a["paramsSchema"] = {"value": "string"}
        if aid in ITEM_ACTIONS:
            a["scope"] = "item"
            a["paramsSchema"] = {**ITEM_ACTIONS[aid], **a.get("paramsSchema", {})}
        st = ACTION_STATE.get(aid, "base")
        route_actions.setdefault(node_id, {}).setdefault(st, []).append(a)


seen_actions = set()


def add_transition(node_id, itx):
    tid = itx["transitionId"]
    spec_tids.add(tid)
    target = itx["target"]
    tnode = NODES[target]
    if tid in transitions:
        t = transitions[tid]
        frm = "*" if node_id == "chrome" else NODES[node_id]["route"]
        if t["_from"] != "*" and frm not in t["_from_list"]:
            t["_from_list"].append(frm)
        return
    frm = "*" if node_id in CHROME or node_id == "chrome" else NODES[node_id]["route"]
    to_route = tnode["route"]
    path_params = {m: "string" for m in re.findall(r":(\w+)", to_route)}
    q = {}
    if tid not in NO_QUERY_IDS:
        q.update(TARGET_QUERY.get(to_route, {}))
    q.update(EXTRA_QUERY.get(tid, {}))
    note = itx.get("note", "") or ""
    has_cases = ("内容卡通用路由" in note) or (tid in EXTRA_CASES)
    cases = None
    if has_cases:
        default_branch = None
        for name, route, bq in BRANCHES:
            if route == to_route:
                default_branch = name
        if default_branch is None:
            default_branch = "movie"
            to_route = "/player"
        cases = []
        for name, route, bq in BRANCHES:
            if name == default_branch:
                continue
            cases.append({
                "to": route, "search": {}, "searchParams": {**bq, **EXTRA_QUERY.get(tid, {})},
                "when": {"op": "eq", "left": {"ref": "param", "key": "ctype"}, "right": name},
            })
        dq = dict([(b[1], b[2]) for b in BRANCHES])[to_route]
        cases.append({"to": to_route, "search": {}, "searchParams": {**dq, **EXTRA_QUERY.get(tid, {})},
                      "when": {"op": "always"}})
        q = {**dq, **EXTRA_QUERY.get(tid, {})}
    elif tid in SWIPE_CASES:
        kind = SWIPE_CASES[tid]
        other = ("/home/channel-lite/:channelId", "lite") if kind == "content" else ("/home/channel/:channelId", "content")
        cases = [
            {"to": other[0], "search": {}, "searchParams": {},
             "when": {"op": "eq", "left": {"ref": "param", "key": "kind"}, "right": other[1]}},
            {"to": to_route, "search": {}, "searchParams": {}, "when": {"op": "always"}},
        ]
    transitions[tid] = {
        "id": tid,
        "_from": frm,
        "_from_list": [frm] if frm != "*" else [],
        "to": to_route,
        "search": STATIC_SEARCH.get(tid, {}),
        "searchParams": q,
        "preserveParams": PRESERVE.get(tid),
        "cases": cases,
        "mode": "replace" if (tid in REPLACE_IDS or node_id in CHROME) else "push",
        "params": path_params,
        "label": itx.get("element", tid),
    }


for n in spec.get("chrome", []):
    for itx in n.get("interactions", []):
        if itx.get("effect") == "nav" and itx.get("transitionId"):
            add_transition(n["id"], itx)

for n in spec["nodes"]:
    for itx in n.get("interactions", []):
        eff = itx.get("effect")
        if eff == "nav" and itx.get("transitionId"):
            add_transition(n["id"], itx)
        elif eff == "state" and itx.get("actionId"):
            add_action(n["id"], itx)

# ------------------------------------------------------------------ 校验
declared_tids = set(transitions.keys())
assert declared_tids == spec_tids, f"transition 不一致: 缺 {spec_tids - declared_tids} 多 {declared_tids - spec_tids}"
declared_aids = set()
for m in route_actions.values():
    for lst in m.values():
        for a in lst:
            declared_aids.add(a["id"])
assert declared_aids == spec_aids, f"action 不一致: 缺 {spec_aids - declared_aids} 多 {declared_aids - spec_aids}"

# ------------------------------------------------------------------ 输出 TS
def ts(v):
    """emit 单行 TS 字面量(单引号)"""
    if isinstance(v, str):
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if v is None:
        return "null"
    if isinstance(v, list):
        return "[" + ", ".join(ts(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{ " + ", ".join(f"{k}: {ts(x)}" for k, x in v.items()) + " }" if v else "{}"
    raise TypeError(v)


lines = []
w = lines.append
w("// AUTO-GENERATED by assets/gen_nav_declaration.py from")
w("// docs/youku-replication/spec.json (frozen v1.0.0).")
w("// 覆盖率 gate 依赖此文件包含 spec 全部 transitionId/actionId。改交互请先改 spec 再重跑本脚本。")
w("import type { NavigationDeclaration } from './navigation.types';")
w("")
w("export const NAVIGATION_DECLARATION = {")
w("  app: 'youku',")
w("  routes: [")

for i, nid in enumerate(order_nodes):
    n = NODES[nid]
    route = n["route"]
    path_params = {m: "string" for m in re.findall(r":(\w+)", route)}
    # route queryParams:该路由作为目标时的动态参数
    qp = dict(TARGET_QUERY.get(route, {}))
    if route == "/player":
        qp["commentId"] = "string"
    if route == "/player/series":
        qp["commentId"] = "string"
    w("    {")
    w(f"      path: {ts(route)},")
    w(f"      component: {ts(COMPONENTS[nid])},")
    w(f"      params: {ts(path_params)},")
    w(f"      entryPoint: {ts('home' if nid == 'home.main' else 'none')},")
    w("      scrollContainers: [")
    w("        { name: 'main', direction: 'vertical', description: '主滚动区' }")
    w("      ],")
    w("      uiStates: [")
    states = [("base", {}, n.get("title", nid))]
    states += EXTRA_STATES.get(nid, [])
    acts_by_state = route_actions.get(nid, {})
    for si, (suffix, search, desc) in enumerate(states):
        w("        {")
        w(f"          id: {ts(f'youku.{nid}.{suffix}')},")
        w(f"          search: {ts(search)},")
        w(f"          description: {ts(desc)},")
        acts = acts_by_state.get(suffix, [])
        if acts:
            w("          actions: [")
            for ai, a in enumerate(acts):
                parts = [f"id: {ts(a['id'])}", f"label: {ts(a['label'])}", f"behavior: {ts(a['behavior'])}"]
                if a.get("scope"):
                    parts.append(f"scope: {ts(a['scope'])}")
                if a.get("paramsSchema"):
                    parts.append(f"paramsSchema: {ts(a['paramsSchema'])}")
                comma = "," if ai < len(acts) - 1 else ""
                w("            { " + ", ".join(parts) + " }" + comma)
            w("          ]")
        else:
            w("          actions: []")
        w("        }" + ("," if si < len(states) - 1 else ""))
    w("      ],")
    w(f"      queryParams: {ts(qp)},")
    w(f"      description: {ts(n.get('title', nid))}")
    w("    }" + ("," if i < len(order_nodes) - 1 else ""))
w("  ],")
w("  transitions: [")
tlist = list(transitions.values())
for i, t in enumerate(tlist):
    frm = "'*'" if t["_from"] == "*" else ts(t["_from_list"] if len(t["_from_list"]) > 1 else t["_from_list"][0])
    w("    {")
    w(f"      id: {ts(t['id'])},")
    w(f"      from: {frm},")
    w(f"      to: {ts(t['to'])},")
    w(f"      search: {ts(t['search'])},")
    w(f"      searchParams: {ts(t['searchParams'])},")
    if t.get("preserveParams"):
        w(f"      preserveParams: {ts(t['preserveParams'])},")
    if t.get("cases"):
        w("      cases: [")
        for ci, c in enumerate(t["cases"]):
            comma = "," if ci < len(t["cases"]) - 1 else ""
            w("        { " + ", ".join([
                f"to: {ts(c['to'])}",
                f"search: {ts(c['search'])}",
                f"searchParams: {ts(c['searchParams'])}",
                f"when: {ts(c['when'])}",
            ]) + " }" + comma)
        w("      ],")
    w(f"      mode: {ts(t['mode'])},")
    w(f"      params: {ts(t['params'])},")
    w(f"      label: {ts(t['label'])},")
    w("      ui: { placement: 'none', icon: 'chevronRight', gesture: 'tap' }")
    w("    }" + ("," if i < len(tlist) - 1 else ""))
w("  ],")
w("  capabilities: { historyBack: true },")
w("} as const satisfies NavigationDeclaration;")
w("")
w("export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];")
w("")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"navigation.declaration.ts written: {len(transitions)} transitions, {len(declared_aids)} actions, {len(order_nodes)} routes")

# -*- coding: utf-8 -*-
"""生成 apps/Ximalaya/navigation.declaration.ts。
routes[] = spec 页面节点;transitions[] = 改 URL 的跳转;uiStates[].actions = 原地动作(data-action)。"""
import json, os
OUT = os.path.join(os.path.dirname(__file__), "..", "navigation.declaration.ts")

def A(id, label, behavior="other", scope=None, params=None):
    d = {"id": id, "label": label, "behavior": behavior}
    if scope: d["scope"] = scope
    if params: d["paramsSchema"] = params
    return d

def UI(id, desc, search=None, actions=None):
    d = {"id": id, "search": search or {}, "description": desc}
    if actions: d["actions"] = actions
    return d

def SC(name, desc, direction="vertical"):
    return {"name": name, "direction": direction, "description": desc}

def R(path, comp, desc, params=None, entry="none", scroll=None, ui=None, query=None):
    return {"path": path, "component": comp, "params": params or {}, "entryPoint": entry,
            "scrollContainers": scroll or [SC("main", "主内容区")],
            "uiStates": ui or [UI(comp.lower()+".base", desc)],
            "queryParams": query or {}, "description": desc}

def T(id, to, label, frm="*", search=None, searchParams=None, mode="push",
      params=None, placement="content", icon="card", gesture="tap", ds=None):
    d = {"id": id, "from": frm, "to": to, "search": search or {}, "searchParams": searchParams or {},
         "mode": mode, "params": params or {}, "label": label,
         "ui": {"placement": placement, "icon": icon, "gesture": gesture}}
    if ds: d["dataSource"] = ds
    return d

def DS(ref, mapping, label=None):
    d = {"ref": ref, "paramMapping": mapping}
    if label: d["labelField"] = label
    return d

albumDS = DS("albums", {"id": "id"}, "title")

# ---------------- ROUTES ----------------
routes = [
 R("/", "HomePage", "首页", entry="home",
   ui=[UI("home.base", "首页", actions=[
        A("tabbar.player.toggle", "中央播放按钮内芯播放/暂停", "toggle"),
        A("home.category.switch", "切换首页分类Tab", "select", params={"cat":"string"}),
        A("home.quickmenu.open", "展开右上加号快捷菜单", "open"),
        A("home.ai.wontfix", "AI/扫码兔(暂未开放)", "other"),
      ])]),
 R("/category-sub", "HomeCategoryPage", "首页-分类子页(体裁落地页)", query={"cat":"string"},
   ui=[UI("catsub.base", "分类子页", actions=[
        A("catsub.genre.select", "品类chip筛选", "select", params={"genre":"string"}),
        A("catsub.tab", "全部/推荐 切换", "select", params={"tab":"string"}),
        A("catsub.sort", "排序/筛选", "select", params={"sort":"string"}),
      ])]),
 R("/quicklisten", "QuickListenPage", "快听(沉浸流)",
   ui=[UI("quick.base", "沉浸流", actions=[
        A("quicklisten.next", "上滑换下一条并自动播放", "other"),
        A("quicklisten.toggle", "播放/暂停", "toggle"),
        A("quicklisten.tab", "切换内容池", "select", params={"tab":"string"}),
        A("quicklisten.drama.wontfix", "刷短剧(暂未开放)", "other"),
        A("quicklisten.subscribe", "订阅当前专辑", "toggle"),
        A("quicklisten.like", "点赞", "toggle"),
      ]),
      UI("quick.share", "分享面板", {"panel":"share"}, actions=[A("share.thirdparty.wontfix","第三方分享(暂未开放)","other")])]),
 # —— 播放器 ——
 R("/player", "PlayerPage", "全屏播放页",
   scroll=[SC("player-main","播放页滚动区"), SC("player-content","下滑内容区")],
   ui=[UI("player.base", "播放页", actions=[
        A("player.tab.switch", "封面/文稿切换", "select", params={"tab":"string"}),
        A("player.tab.zhoubian.wontfix", "周边(暂未开放)", "other"),
        A("player.download", "直接下载本集", "other"),
        A("player.like", "点赞", "toggle"),
        A("player.collect", "收藏本集进听单", "toggle"),
        A("player.toggle", "播放/暂停", "toggle"),
        A("player.prevnext", "上一集/下一集", "select", params={"dir":"string"}),
        A("player.seek", "拖动进度", "modify", params={"sec":"number"}),
        A("player.skip15", "前进/后退15秒", "select", params={"dir":"string"}),
        A("player.collapse", "收起播放页", "other"),
        A("player.reward.wontfix", "主播打赏(暂未开放)", "other"),
        A("player.danmaku.input", "弹幕输入弹窗", "open"),
      ]),
      UI("player.transcript", "文稿全屏", {"view":"transcript"}, actions=[
        A("transcript.exit", "退出全屏阅读", "other"),
        A("transcript.page", "左滑翻页", "other"),
      ]),
      UI("player.more", "更多菜单", {"panel":"more"}, actions=[
        A("more.skiphead.set", "跳过头尾设置弹窗", "open"),
        A("more.autostart.alarm", "定时启播添加闹钟", "open"),
        A("more.points.wontfix", "领积分(暂未开放)", "other"),
        A("more.addtolist", "添加到听单", "other"),
        A("more.download", "下载节目", "other"),
        A("more.autoplay.toggle", "自动播放推荐开关", "toggle"),
        A("more.castdevice", "连接外设选择设备弹窗", "open"),
        A("more.ka.wontfix", "ka!剪辑片段(暂未开放)", "other"),
        A("more.ringtone.wontfix", "设为铃声(暂未开放)", "other"),
      ]),
      UI("player.timer", "定时弹层", {"panel":"timer"}, actions=[
        A("timer.bytime.select", "按时间定时", "select", params={"min":"number"}),
        A("timer.bycount.select", "按集数定时", "select", params={"cnt":"number"}),
        A("timer.custom.wontfix", "自定义定时(暂未开放)", "other"),
        A("timer.toggle", "定时开关", "toggle"),
      ]),
      UI("player.speed", "倍速弹层", {"panel":"speed"}, actions=[
        A("speed.select", "选择倍速", "select", params={"rate":"number"}),
        A("speed.scopetoggle", "只应用本专辑开关", "toggle"),
      ]),
      UI("player.quality", "音质音效弹层", {"panel":"quality"}, actions=[
        A("quality.tab", "音质/音效切换", "select", params={"tab":"string"}),
        A("quality.use", "免费音质使用", "select", params={"q":"string"}),
        A("quality.vip.use", "VIP音质(提示开会员)", "select", params={"q":"string"}),
      ]),
      UI("player.playsettings", "播放设置弹层", {"panel":"playsettings"}, actions=[
        A("playset.mix", "与其他应用同时播放", "toggle"),
        A("playset.lock", "锁屏显示", "toggle"),
        A("playset.help.wontfix", "查看帮助(暂未开放)", "other"),
      ]),
      UI("player.downloadquality", "下载音质弹层", {"panel":"downloadquality"}, actions=[
        A("dlquality.select", "选下载音质并加入队列", "select", params={"q":"string"}),
      ]),
      UI("player.share", "分享面板", {"panel":"share"}, actions=[
        A("share.thirdparty.wontfix", "第三方分享(暂未开放)", "other"),
        A("share.poster.wontfix", "海报/视频片段(暂未开放)", "other"),
      ]),
      UI("player.playlist", "播放列表弹层", {"panel":"playlist"}, actions=[
        A("playlist.play", "切集播放", "select", scope="item", params={"trackId":"string"}),
        A("playlist.sort", "正倒序", "toggle"),
      ]),
      UI("player.ticket", "月票弹层", {"panel":"ticket"}, actions=[
        A("ticket.tab", "领/投月票切换", "select", params={"tab":"string"}),
        A("ticket.listen", "去收听", "other"),
        A("ticket.video.fake", "看视频领月票(模拟弹窗)", "open"),
        A("ticket.vote", "投月票", "other"),
      ])]),
 R("/skin", "SkinPage", "播放器皮肤页",
   ui=[UI("skin.base", "皮肤页", actions=[
        A("skin.cat", "皮肤分类切换", "select", params={"cat":"string"}),
        A("skin.preview", "预览皮肤", "select", scope="item", params={"skinId":"string"}),
        A("skin.apply", "应用皮肤(真实切换)", "select", scope="item", params={"skinId":"string"}),
        A("skin.bag.owned", "查看已购皮肤", "other"),
      ])]),
 R("/comment", "CommentPage", "评论页",
   ui=[UI("comment.base", "评论", actions=[
        A("comment.rate", "轻触评价", "select", params={"val":"string"}),
        A("comment.vote", "投票弹窗", "open"),
        A("comment.sort", "评论排序", "select", params={"sort":"string"}),
        A("comment.like", "评论点赞", "toggle", scope="item", params={"cid":"string"}),
        A("comment.jumptime", "时间戳跳转", "other", scope="item", params={"sec":"number"}),
        A("comment.replies", "展开回复", "toggle", scope="item", params={"cid":"string"}),
        A("comment.inputopen", "评论输入态", "open"),
        A("comment.send", "发送评论", "submit"),
      ])]),
 R("/sound/:id", "SoundDetailPage", "声音详情页", params={"id":"string"},
   ui=[UI("sound.base", "声音详情", actions=[A("sounddetail.ai.wontfix","AI摘要(暂未开放)","other")]),
       UI("sound.share", "分享面板", {"panel":"share"}, actions=[A("share.thirdparty.wontfix2","分享(暂未开放)","other")])]),
 # —— 专辑 & 浏览 ——
 R("/album/:id", "AlbumPage", "专辑详情页", params={"id":"string"},
   scroll=[SC("album-main","专辑滚动区")],
   ui=[UI("album.base", "专辑详情", actions=[
        A("album.subscribe", "订阅/已订阅", "toggle"),
        A("album.tab", "节目/评价/找相似/橱窗切换", "select", params={"tab":"string"}),
        A("album.showcase.wontfix", "橱窗(暂未开放)", "other"),
        A("album.sort", "正倒序", "toggle"),
        A("album.listsearch.wontfix", "集内搜索(暂未开放)", "other"),
      ]),
      UI("album.download", "下载音质弹层", {"panel":"downloadquality"}, actions=[A("dlquality.select2","选下载音质","select",params={"q":"string"})]),
      UI("album.share", "分享面板", {"panel":"share"}, actions=[A("share.thirdparty.wontfix3","分享(暂未开放)","other")]),
      UI("album.itemmenu", "节目项…菜单", {"panel":"itemmenu"}),
      UI("album.moremenu", "顶栏更多菜单", {"panel":"moremenu"}, actions=[
        A("album.more.gift.wontfix", "赠送亲友(暂未开放)", "other"),
        A("album.more.skiphead.wontfix", "跳过头尾(暂未开放)", "other"),
        A("album.more.copyright.wontfix", "版权申诉(暂未开放)", "other"),
      ])]),
 R("/similar/:id", "SimilarPage", "找相似(相似推荐)", params={"id":"string"}),
 R("/anchor/:id", "AnchorPage", "主播页", params={"id":"string"},
   ui=[UI("anchor.base", "主播页", actions=[
        A("anchor.follow", "关注/已关注", "toggle"),
        A("anchor.tab", "全部/推荐切换", "select", params={"tab":"string"}),
        A("anchor.sort", "排序", "select", params={"sort":"string"}),
      ])]),
 R("/category", "CategoryPage", "分类页",
   ui=[UI("category.base", "分类", actions=[A("category.rail","左类目切换","select",params={"cat":"string"})])]),
 R("/rank", "RankPage", "排行榜页",
   ui=[UI("rank.base", "排行榜", actions=[
        A("rank.tab", "榜单切换", "select", params={"tab":"string"}),
        A("rank.category", "左品类切换", "select", params={"cat":"string"}),
      ])]),
 # —— 搜索 ——
 R("/search", "SearchPage", "搜索页", query={"q":"string"},
   ui=[UI("search.base", "搜索", actions=[
        A("search.input", "输入进入联想态", "input"),
        A("search.clearhistory", "清空搜索历史", "other"),
        A("search.ai.wontfix", "AI荐书(暂未开放)", "other"),
      ]),
      UI("search.suggest", "联想态", {"mode":"suggest"}, actions=[A("suggest.ai.wontfix","小雅Ai(暂未开放)","other")])]),
 R("/search-result", "SearchResultPage", "搜索结果页", query={"q":"string"},
   ui=[UI("result.base", "搜索结果", actions=[
        A("result.tab", "结果类型切换", "select", params={"tab":"string"}),
        A("result.broadcast", "广播(虚拟)", "select"),
        A("result.sort", "排序", "select", params={"sort":"string"}),
        A("result.filter.open", "筛选抽屉", "open"),
        A("result.filter.apply", "应用筛选", "submit"),
        A("result.follow", "主播关注", "toggle", scope="item", params={"anchorId":"string"}),
      ])]),
 # —— 我的 ——
 R("/me", "MinePage", "我的(个人中心)", entry="none",
   ui=[UI("mine.base", "我的", actions=[
        A("mine.contenttab", "内容Tab页内切换(消息/历史/订阅/本地/已购)", "select", params={"tab":"string"}),
        A("mine.services.wontfix", "全部服务宫格(暂未开放)", "other"),
        A("mine.record.wontfix", "录音直播(暂未开放)", "other"),
      ])]),
 R("/subscribe", "SubscribePage", "订阅列表",
   ui=[UI("subscribe.base", "订阅", actions=[
        A("subscribe.tab", "订阅分类切换", "select", params={"tab":"string"}),
        A("subscribe.sort", "排序", "select", params={"sort":"string"}),
        A("subscribe.more", "…(搜索/宫格/批量)", "open"),
      ]),
      UI("subscribe.itemmenu", "项…菜单", {"panel":"itemmenu"}, actions=[A("subscribe.item.menu","项菜单","open",scope="item",params={"albumId":"string"})])]),
 R("/subscribe-manage", "SubscribeManagePage", "订阅管理(批量)",
   ui=[UI("submanage.base", "订阅管理", actions=[A("submanage.check","勾选","toggle",scope="item",params={"albumId":"string"}),A("submanage.remove","批量取消订阅","submit")])]),
 R("/history", "HistoryPage", "播放历史",
   ui=[UI("history.base", "播放历史", actions=[
        A("history.tab", "播放/浏览历史切换", "select", params={"tab":"string"}),
        A("history.item.menu", "历史项…菜单", "open", scope="item", params={"trackId":"string"}),
      ])]),
 R("/history-manage", "HistoryManagePage", "管理最近收听(批量)",
   ui=[UI("histmanage.base", "管理收听", actions=[A("histmanage.selectall","全选/选择已听完","toggle"),A("histmanage.delete","删除所选","submit")])]),
 R("/local", "LocalPage", "本地/下载",
   ui=[UI("local.base", "本地", actions=[
        A("local.tab", "本地类型切换", "select", params={"tab":"string"}),
        A("local.autoclean", "自动清理完播开关", "toggle"),
        A("local.item.menu", "本地项…菜单", "open", scope="item", params={"albumId":"string"}),
      ])]),
 R("/purchased", "PurchasedPage", "已购",
   ui=[UI("purchased.base", "已购", actions=[
        A("purchased.tab", "已购类型切换", "select", params={"tab":"string"}),
        A("purchased.order", "展示已购订单列表", "other"),
      ])]),
 R("/messages", "MessagesPage", "消息中心",
   ui=[UI("messages.base", "消息", actions=[A("messages.readall","一键已读","other")])]),
 R("/message/:id", "MessageDetailPage", "消息子会话页", params={"id":"string"},
   ui=[UI("msgdetail.base", "消息详情", actions=[
        A("msgdetail.tab", "互动类型切换", "select", params={"tab":"string"}),
        A("msgdetail.survey.wontfix", "调研(暂未开放)", "other"),
        A("msgdetail.vote", "听见投票", "select", params={"opt":"string"}),
      ])]),
 R("/profile", "ProfilePage", "个人主页",
   ui=[UI("profile.base", "个人主页", actions=[
        A("profile.tab", "作品/动态切换", "select", params={"tab":"string"}),
        A("profile.subtab", "动态子Tab", "select", params={"tab":"string"}),
        A("profile.upload.wontfix", "上传照片(暂未开放)", "other"),
      ])]),
 R("/profile-edit", "ProfileEditPage", "编辑资料",
   ui=[UI("pedit.base", "编辑资料", actions=[
        A("pedit.field", "编辑昵称/性别/生日/地区", "input", params={"field":"string"}),
        A("pedit.voice.wontfix", "声音签名(暂未开放)", "other"),
        A("pedit.avatar.wontfix", "编辑头像/背景(暂未开放)", "other"),
        A("pedit.misc.wontfix", "认证/隐私(暂未开放)", "other"),
        A("pedit.sync.wontfix", "同步微信/QQ(暂未开放)", "other"),
      ])]),
 R("/badges", "BadgesPage", "勋章墙",
   ui=[UI("badges.base", "勋章墙", actions=[
        A("badges.tab", "成就分类切换", "select", params={"tab":"string"}),
        A("badges.detail", "勋章详情", "open", scope="item", params={"bid":"string"}),
        A("badges.wear.wontfix", "佩戴管理(暂未开放)", "other"),
        A("badges.more", "展开更多", "other"),
      ]),
      UI("badges.share", "分享面板", {"panel":"share"}, actions=[A("share.thirdparty.wontfix4","分享(暂未开放)","other")])]),
 R("/listenlist/:id", "ListenListPage", "听单详情(我收藏的声音)", params={"id":"string"}),
 # —— 会员 ——
 R("/member", "MemberCenterPage", "会员中心", entry="none",
   ui=[UI("member.base", "会员中心", actions=[A("member.tab","会员/儿童会员切换","select",params={"tab":"string"})])]),
 R("/member-purchase", "MemberPurchasePage", "VIP开通页",
   ui=[UI("purchase.base", "开通页", actions=[
        A("purchase.plan", "选择套餐", "select", params={"planId":"string"}),
        A("purchase.tier", "会员档切换", "select", params={"tier":"string"}),
        A("purchase.paymethod", "选择支付方式", "select", params={"method":"string"}),
        A("purchase.union.wontfix", "联合会员(暂未开放)", "other"),
      ])]),
 R("/pay-success", "PaySuccessPage", "开通成功(模拟)",
   ui=[UI("paysuccess.base", "开通成功")]),
 R("/child-member", "ChildMemberPage", "儿童会员中心",
   ui=[UI("childmember.base", "儿童会员", actions=[A("childmember.open.wontfix","立即开通(暂未开放)","other")])]),
 # —— 更多菜单派生页 ——
 R("/driving", "DrivingPage", "驾驶模式(极简收听)",
   ui=[UI("driving.base", "驾驶模式", actions=[
        A("driving.toggle", "播放/暂停", "toggle"),
        A("driving.prevnext", "上一集/下一集", "select", params={"dir":"string"}),
        A("driving.exit", "退出驾驶模式", "other"),
      ])]),
 R("/feedback", "FeedbackPage", "评价反馈",
   ui=[UI("feedback.base", "评价反馈", actions=[
        A("feedback.stars", "星级评分", "select", params={"n":"number"}),
        A("feedback.choice", "小调研/电话回访", "select", params={"opt":"string"}),
        A("feedback.submit", "提交(模拟)", "submit"),
      ])]),
 R("/report", "ReportPage", "声音举报",
   ui=[UI("report.base", "声音举报", actions=[
        A("report.reason", "选择举报原因", "select", params={"reason":"string"}),
        A("report.upload.wontfix", "上传证明材料(暂未开放)", "other"),
        A("report.submit", "提交(模拟)", "submit"),
      ])]),
 R("/copyright", "CopyrightPage", "版权申诉",
   ui=[UI("copyright.base", "版权申诉", actions=[
        A("copyright.input", "填写作品/著作人/手机号", "input", params={"field":"string"}),
        A("copyright.upload.wontfix", "证明材料上传(暂未开放)", "other"),
        A("copyright.apply.wontfix", "在线申请版权认证(暂未开放)", "other"),
        A("copyright.submit", "提交(模拟)", "submit"),
      ])]),
 R("/relations", "RelationsPage", "粉丝/关注列表", query={"tab":"string"},
   ui=[UI("relations.base", "关系列表", actions=[
        A("relations.tab", "粉丝/关注切换", "select", params={"tab":"string"}),
        A("relations.follow", "关注/取关", "toggle", scope="item", params={"uid":"string"}),
      ])]),
 R("/stub", "StubPage", "暂未开放占位页"),
]

# ---------------- TRANSITIONS ----------------
trans = [
 # Tabs + 中央播放
 T("tabbar.home-open", "/", "首页 Tab", mode="replace", placement="tabbar", icon="tab_home"),
 T("tabbar.quicklisten-open", "/quicklisten", "快听 Tab", mode="replace", placement="tabbar", icon="tab_quick"),
 T("tabbar.member-open", "/member", "会员 Tab", mode="replace", placement="tabbar", icon="tab_member"),
 T("tabbar.mine-open", "/me", "我的 Tab", mode="replace", placement="tabbar", icon="tab_mine"),
 T("tabbar.player-open", "/player", "中央播放按钮外环→播放页", placement="tabbar", icon="play"),
 # Home
 T("home.search-open", "/search", "首页搜索栏", placement="topbar", icon="search"),
 T("home.categorysub-open", "/category-sub", "首页分类子页", searchParams={"cat":"string"}, params={"cat":"string"}),
 T("home.driving-open", "/driving", "切换模式→驾驶模式", frm="/"),
 T("home.categorymore-open", "/category", "更多分类≡"),
 T("home.continue-play", "/player", "续听卡→续播"),
 T("home.rank-open", "/rank", "首页排行榜"),
 T("home.album-open", "/album/:id", "首页专辑卡", params={"id":"string"}, ds=albumDS),
 # CategorySub
 T("catsub.album-open", "/album/:id", "分类子页专辑卡", params={"id":"string"}, ds=albumDS),
 # QuickListen
 T("quick.player-open", "/player", "快听当前音源条→播放页"),
 T("quick.share-open", "/quicklisten", "快听分享", search={"panel":"share"}),
 # Player panels + pages
 T("player.more-open", "/player", "更多菜单", frm="/player", search={"panel":"more"}),
 T("player.timer-open", "/player", "定时弹层", frm="/player", search={"panel":"timer"}),
 T("player.speed-open", "/player", "倍速弹层", frm="/player", search={"panel":"speed"}),
 T("player.quality-open", "/player", "音质音效弹层", frm="/player", search={"panel":"quality"}),
 T("player.playsettings-open", "/player", "播放设置弹层", frm="/player", search={"panel":"playsettings"}),
 T("player.share-open", "/player", "分享面板", frm="/player", search={"panel":"share"}),
 T("player.playlist-open", "/player", "播放列表弹层", frm="/player", search={"panel":"playlist"}),
 T("player.ticket-open", "/player", "月票弹层", frm="/player", search={"panel":"ticket"}),
 T("player.transcript-open", "/player", "文稿全屏", frm="/player", search={"view":"transcript"}),
 T("player.comment-open", "/comment", "评论页"),
 T("player.skin-open", "/skin", "播放器皮肤页"),
 T("player.album-open", "/album/:id", "播放页专辑卡", params={"id":"string"}, ds=albumDS),
 T("player.anchor-open", "/anchor/:id", "播放页主播", params={"id":"string"}),
 T("player.sounddetail-open", "/sound/:id", "声音详情", params={"id":"string"}),
 T("player.driving-open", "/driving", "驾驶模式"),
 T("player.feedback-open", "/feedback", "评价反馈"),
 T("player.report-open", "/report", "声音举报"),
 T("player.copyright-open", "/copyright", "版权申诉"),
 T("player.watch-transcript", "/player", "边听边看→文稿", frm="/player", search={"view":"transcript"}),
 T("player.downloadquality-open", "/player", "下载音质弹层", frm="/player", search={"panel":"downloadquality"}),
 # Album
 T("album.player-open", "/player", "专辑→播放"),
 T("album.similar-open", "/similar/:id", "找相似", params={"id":"string"}),
 T("album.anchor-open", "/anchor/:id", "专辑→主播", params={"id":"string"}),
 T("album.share-open", "/album/:id", "专辑分享", params={"id":"string"}, search={"panel":"share"}),
 T("album.download-open", "/album/:id", "专辑下载音质", params={"id":"string"}, search={"panel":"downloadquality"}),
 T("album.itemmenu-open", "/album/:id", "节目项菜单", params={"id":"string"}, search={"panel":"itemmenu"}),
 # Similar / Anchor / Category / Rank
 T("similar.album-open", "/album/:id", "相似专辑卡", params={"id":"string"}, ds=albumDS),
 T("anchor.album-open", "/album/:id", "主播作品卡", params={"id":"string"}, ds=albumDS),
 T("category.chip-open", "/rank", "分类名家chip→榜单"),
 T("rank.album-open", "/album/:id", "榜单专辑", params={"id":"string"}, ds=albumDS),
 # Search
 T("search.submit", "/search-result", "提交搜索", placement="topbar", icon="search"),
 T("search.result-open", "/search-result", "历史/热搜→结果"),
 T("suggest.play", "/player", "联想直达播放"),
 T("result.album-open", "/album/:id", "结果专辑卡", params={"id":"string"}, ds=albumDS),
 T("result.play", "/player", "一键播放第1集"),
 # Mine
 T("mine.profile-open", "/profile", "头像→个人主页"),
 T("mine.vip-open", "/member-purchase", "VIP卡→开通"),
 T("mine.child-open", "/child-member", "VIP儿童卡"),
 T("mine.messages-open", "/messages", "消息Tab"),
 T("mine.history-open", "/history", "历史Tab"),
 T("mine.subscribe-open", "/subscribe", "订阅Tab"),
 T("mine.local-open", "/local", "本地Tab"),
 T("mine.purchased-open", "/purchased", "已购Tab"),
 # Subscribe
 T("subscribe.album-open", "/album/:id", "订阅专辑行", params={"id":"string"}, ds=albumDS),
 T("subscribe.player-open", "/player", "订阅续播"),
 T("subscribe.listenlist-open", "/listenlist/:id", "我收藏的声音听单", params={"id":"string"}),
 T("subscribe.manage-open", "/subscribe-manage", "批量处理"),
 T("subscribe.add-open", "/search", "添加订阅→搜索"),
 # History / Local / Purchased
 T("history.player-open", "/player", "历史行→播放"),
 T("history.manage-open", "/history-manage", "管理最近收听"),
 T("local.player-open", "/player", "本地行→播放"),
 T("purchased.album-open", "/album/:id", "已购专辑行", params={"id":"string"}, ds=albumDS),
 # Messages
 T("messages.detail-open", "/message/:id", "消息会话", params={"id":"string"}, ds=DS("messages",{"id":"id"},"name")),
 T("msgdetail.source-open", "/album/:id", "互动卡跳源", params={"id":"string"}),
 # Profile
 T("profile.edit-open", "/profile-edit", "编辑资料"),
 T("profile.badges-open", "/badges", "勋章墙"),
 T("profile.card-open", "/album/:id", "动态专辑卡", params={"id":"string"}),
 T("badges.share-open", "/badges", "勋章分享", search={"panel":"share"}),
 # ListenList
 T("listenlist.play", "/player", "听单单集播放"),
 # Member
 T("member.purchase-open", "/member-purchase", "续费/开通"),
 T("member.superlisten-open", "/album/:id", "超前听专辑", params={"id":"string"}),
 T("purchase.confirm", "/pay-success", "确认协议并开通→模拟成功"),
 T("childmember.album-open", "/album/:id", "儿童专辑卡", params={"id":"string"}),
 # Sound share
 T("sound.share-open", "/sound/:id", "声音详情分享", params={"id":"string"}, search={"panel":"share"}),
 # —— 阶段⑥走查新增 ——
 T("album.moremenu-open", "/album/:id", "专辑顶栏更多菜单", frm="/album/:id", params={"id":"string"}, search={"panel":"moremenu"}),
 T("home.vip-open", "/member-purchase", "首页VIP促销条", frm="/"),
 T("profile.listen-open", "/history", "收听时长→收听列表", frm="/profile"),
 T("profile.fans-open", "/relations", "粉丝列表", frm="/profile", search={"tab":"fans"}),
 T("profile.follows-open", "/relations", "关注列表", frm="/profile", search={"tab":"follows"}),
]

# —— 设置每条 transition 的 from 为其真实来源页路径(取代通配 *,过一致性 from 检查) ——
# 来源:实现后跑 check_navigation_declaration_consistency 得到的 expectedFromPaths(见 scratchpad/frommap.json)
FROM_MAP = {
 "album.anchor-open":["/album/:id"],"album.download-open":["/album/:id"],"album.itemmenu-open":["/album/:id"],
 "album.player-open":["/album/:id"],"album.share-open":["/album/:id"],"album.similar-open":["/album/:id"],
 "anchor.album-open":["/anchor/:id"],"badges.share-open":["/badges"],"category.chip-open":["/category"],
 "catsub.album-open":["/category-sub"],"catsub.rank-open":["/category-sub"],"catsub.vip-open":["/category-sub"],
 "childmember.album-open":["/child-member"],"history.manage-open":["/history"],"history.player-open":["/history","/me"],
 "home.album-open":["/"],"home.categorymore-open":["/","/category-sub"],"home.categorysub-open":["/"],
 "home.continue-play":["/"],"home.rank-open":["/"],"home.search-open":["/","/search-result"],
 "listenlist.play":["/listenlist/:id"],"local.player-open":["/local","/me"],
 "local.player-open":["/local","/me"],"purchased.album-open":["/purchased","/me"],
 "member.purchase-open":["/member","/player"],"member.superlisten-open":["/member"],
 "messages.detail-open":["/messages","/me"],"mine.child-open":["/me"],"mine.history-open":["/","/me"],
 "mine.local-open":["/me"],"mine.messages-open":["/me"],"mine.profile-open":["/me"],"mine.purchased-open":["/me"],
 "mine.subscribe-open":["/me"],"mine.vip-open":["/me"],"msgdetail.source-open":["/message/:id"],
 "player.album-open":["/player"],"player.anchor-open":["/player"],"player.comment-open":["/album/:id","/player"],
 "player.copyright-open":["/player"],"player.driving-open":["/player"],"player.feedback-open":["/player"],
 "player.report-open":["/player"],"player.skin-open":["/player"],"player.sounddetail-open":["/player"],
 "profile.badges-open":["/profile"],"profile.card-open":["/profile"],"profile.edit-open":["/profile"],
 "purchase.confirm":["/member-purchase"],"purchased.album-open":["/purchased","/me"],
 "quick.player-open":["/quicklisten"],"quick.share-open":["/quicklisten"],"rank.album-open":["/rank"],
 "result.album-open":["/search-result"],"result.play":["/search-result"],"search.result-open":["/search"],
 "search.submit":["/search","/search-result"],"similar.album-open":["/similar/:id"],"sound.share-open":["/sound/:id"],
 "subscribe.add-open":["/subscribe"],"subscribe.album-open":["/subscribe","/me"],"subscribe.listenlist-open":["/subscribe","/me"],
 "subscribe.manage-open":["/subscribe"],"subscribe.player-open":["/subscribe","/me"],"suggest.play":["/search"],
 # 播放器内部弹层:from 已是 /player(见 T() 里 frm),此处不覆盖
}
for _t in trans:
    fp = FROM_MAP.get(_t["id"])
    if fp:
        _t["from"] = fp if len(fp) > 1 else fp[0]

# —— 规范化 action id:>=3 段、[a-zA-Z0-9]+、唯一;select 须以 .select.<opt> 结尾;input 须有 value 参数 ——
_seen = set()
_suffix = {"toggle":"toggle","open":"open","submit":"submit","modify":"set","close":"close","other":"tap"}
for _r in routes:
    for _st in _r["uiStates"]:
        for _a in _st.get("actions", []):
            b = _a["behavior"]
            parts = _a["id"].split(".")
            if b == "select":
                if parts[-1] == "select":
                    parts.append("opt")
                elif not (len(parts) >= 2 and parts[-2] == "select"):
                    parts += ["select", "opt"]
            elif b == "input":
                if len(parts) < 3:
                    parts.append("input")
                _a.setdefault("paramsSchema", {})
                _a["paramsSchema"]["value"] = "string"
            else:
                if len(parts) < 3:
                    parts.append(_suffix.get(b, "tap"))
                while len(parts) < 3:
                    parts.append("act")
            nid = ".".join(parts)
            if nid in _seen:
                if b == "select":
                    # 保持 .select.<opt> 结尾唯一性
                    stem, opt = nid.rsplit(".", 1)
                    i = 2
                    while f"{stem}.{opt}{i}" in _seen:
                        i += 1
                    nid = f"{stem}.{opt}{i}"
                else:
                    i = 2
                    while f"{nid}.v{i}" in _seen:
                        i += 1
                    nid = f"{nid}.v{i}"
            _seen.add(nid)
            _a["id"] = nid

decl = {"app": "ximalaya", "routes": routes, "transitions": trans, "capabilities": {"historyBack": True}}

def emit(o, ind=1):
    pad = "  " * ind
    if isinstance(o, dict):
        if not o: return "{}"
        lines = ["{"]
        for k, v in o.items():
            key = k if k.replace("_","").isalnum() else json.dumps(k, ensure_ascii=False)
            lines.append(f"{pad}{key}: {emit(v, ind+1)},")
        lines.append("  " * (ind-1) + "}")
        return "\n".join(lines)
    if isinstance(o, list):
        if not o: return "[]"
        return "[\n" + "\n".join(f"{pad}{emit(x, ind+1)}," for x in o) + "\n" + "  "*(ind-1) + "]"
    if isinstance(o, bool): return "true" if o else "false"
    if o is None: return "null"
    if isinstance(o, (int, float)): return str(o)
    return json.dumps(o, ensure_ascii=False)

header = "import type { NavigationDeclaration } from './navigation.types';\n\nexport const NAVIGATION_DECLARATION = "
footer = " as const satisfies NavigationDeclaration;\n\nexport type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];\n"
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header + emit(decl) + footer)
print("OK nav.declaration.ts:", len(routes), "routes,", len(trans), "transitions")

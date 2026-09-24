import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: "ximalaya",
  routes: [
    {
      path: "/",
      component: "HomePage",
      params: {},
      entryPoint: "home",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "home.base",
          search: {},
          description: "首页",
          actions: [
            {
              id: "tabbar.player.toggle",
              label: "中央播放按钮内芯播放/暂停",
              behavior: "toggle",
            },
            {
              id: "home.category.switch.select.opt",
              label: "切换首页分类Tab",
              behavior: "select",
              paramsSchema: {
                cat: "string",
              },
            },
            {
              id: "home.quickmenu.open",
              label: "展开右上加号快捷菜单",
              behavior: "open",
            },
            {
              id: "home.ai.wontfix",
              label: "AI/扫码兔(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "首页",
    },
    {
      path: "/category-sub",
      component: "HomeCategoryPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "catsub.base",
          search: {},
          description: "分类子页",
          actions: [
            {
              id: "catsub.genre.select.opt",
              label: "品类chip筛选",
              behavior: "select",
              paramsSchema: {
                genre: "string",
              },
            },
            {
              id: "catsub.tab.select.opt",
              label: "全部/推荐 切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "catsub.sort.select.opt",
              label: "排序/筛选",
              behavior: "select",
              paramsSchema: {
                sort: "string",
              },
            },
          ],
        },
      ],
      queryParams: {
        cat: "string",
      },
      description: "首页-分类子页(体裁落地页)",
    },
    {
      path: "/quicklisten",
      component: "QuickListenPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "quick.base",
          search: {},
          description: "沉浸流",
          actions: [
            {
              id: "quicklisten.next.tap",
              label: "上滑换下一条并自动播放",
              behavior: "other",
            },
            {
              id: "quicklisten.toggle.toggle",
              label: "播放/暂停",
              behavior: "toggle",
            },
            {
              id: "quicklisten.tab.select.opt",
              label: "切换内容池",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "quicklisten.drama.wontfix",
              label: "刷短剧(暂未开放)",
              behavior: "other",
            },
            {
              id: "quicklisten.subscribe.toggle",
              label: "订阅当前专辑",
              behavior: "toggle",
            },
            {
              id: "quicklisten.like.toggle",
              label: "点赞",
              behavior: "toggle",
            },
          ],
        },
        {
          id: "quick.share",
          search: {
            panel: "share",
          },
          description: "分享面板",
          actions: [
            {
              id: "share.thirdparty.wontfix",
              label: "第三方分享(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "快听(沉浸流)",
    },
    {
      path: "/player",
      component: "PlayerPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "player-main",
          direction: "vertical",
          description: "播放页滚动区",
        },
        {
          name: "player-content",
          direction: "vertical",
          description: "下滑内容区",
        },
      ],
      uiStates: [
        {
          id: "player.base",
          search: {},
          description: "播放页",
          actions: [
            {
              id: "player.tab.switch.select.opt",
              label: "封面/文稿切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "player.tab.zhoubian.wontfix",
              label: "周边(暂未开放)",
              behavior: "other",
            },
            {
              id: "player.download.tap",
              label: "直接下载本集",
              behavior: "other",
            },
            {
              id: "player.like.toggle",
              label: "点赞",
              behavior: "toggle",
            },
            {
              id: "player.collect.toggle",
              label: "收藏本集进听单",
              behavior: "toggle",
            },
            {
              id: "player.toggle.toggle",
              label: "播放/暂停",
              behavior: "toggle",
            },
            {
              id: "player.prevnext.select.opt",
              label: "上一集/下一集",
              behavior: "select",
              paramsSchema: {
                dir: "string",
              },
            },
            {
              id: "player.seek.set",
              label: "拖动进度",
              behavior: "modify",
              paramsSchema: {
                sec: "number",
              },
            },
            {
              id: "player.skip15.select.opt",
              label: "前进/后退15秒",
              behavior: "select",
              paramsSchema: {
                dir: "string",
              },
            },
            {
              id: "player.collapse.tap",
              label: "收起播放页",
              behavior: "other",
            },
            {
              id: "player.reward.wontfix",
              label: "主播打赏(暂未开放)",
              behavior: "other",
            },
            {
              id: "player.danmaku.input",
              label: "弹幕输入弹窗",
              behavior: "open",
            },
          ],
        },
        {
          id: "player.transcript",
          search: {
            view: "transcript",
          },
          description: "文稿全屏",
          actions: [
            {
              id: "transcript.exit.tap",
              label: "退出全屏阅读",
              behavior: "other",
            },
            {
              id: "transcript.page.tap",
              label: "左滑翻页",
              behavior: "other",
            },
          ],
        },
        {
          id: "player.more",
          search: {
            panel: "more",
          },
          description: "更多菜单",
          actions: [
            {
              id: "more.skiphead.set",
              label: "跳过头尾设置弹窗",
              behavior: "open",
            },
            {
              id: "more.autostart.alarm",
              label: "定时启播添加闹钟",
              behavior: "open",
            },
            {
              id: "more.points.wontfix",
              label: "领积分(暂未开放)",
              behavior: "other",
            },
            {
              id: "more.addtolist.tap",
              label: "添加到听单",
              behavior: "other",
            },
            {
              id: "more.download.tap",
              label: "下载节目",
              behavior: "other",
            },
            {
              id: "more.autoplay.toggle",
              label: "自动播放推荐开关",
              behavior: "toggle",
            },
            {
              id: "more.castdevice.open",
              label: "连接外设选择设备弹窗",
              behavior: "open",
            },
            {
              id: "more.ka.wontfix",
              label: "ka!剪辑片段(暂未开放)",
              behavior: "other",
            },
            {
              id: "more.ringtone.wontfix",
              label: "设为铃声(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "player.timer",
          search: {
            panel: "timer",
          },
          description: "定时弹层",
          actions: [
            {
              id: "timer.bytime.select.opt",
              label: "按时间定时",
              behavior: "select",
              paramsSchema: {
                min: "number",
              },
            },
            {
              id: "timer.bycount.select.opt",
              label: "按集数定时",
              behavior: "select",
              paramsSchema: {
                cnt: "number",
              },
            },
            {
              id: "timer.custom.wontfix",
              label: "自定义定时(暂未开放)",
              behavior: "other",
            },
            {
              id: "timer.toggle.toggle",
              label: "定时开关",
              behavior: "toggle",
            },
          ],
        },
        {
          id: "player.speed",
          search: {
            panel: "speed",
          },
          description: "倍速弹层",
          actions: [
            {
              id: "speed.select.opt",
              label: "选择倍速",
              behavior: "select",
              paramsSchema: {
                rate: "number",
              },
            },
            {
              id: "speed.scopetoggle.toggle",
              label: "只应用本专辑开关",
              behavior: "toggle",
            },
          ],
        },
        {
          id: "player.quality",
          search: {
            panel: "quality",
          },
          description: "音质音效弹层",
          actions: [
            {
              id: "quality.tab.select.opt",
              label: "音质/音效切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "quality.use.select.opt",
              label: "免费音质使用",
              behavior: "select",
              paramsSchema: {
                q: "string",
              },
            },
            {
              id: "quality.vip.use.select.opt",
              label: "VIP音质(提示开会员)",
              behavior: "select",
              paramsSchema: {
                q: "string",
              },
            },
          ],
        },
        {
          id: "player.playsettings",
          search: {
            panel: "playsettings",
          },
          description: "播放设置弹层",
          actions: [
            {
              id: "playset.mix.toggle",
              label: "与其他应用同时播放",
              behavior: "toggle",
            },
            {
              id: "playset.lock.toggle",
              label: "锁屏显示",
              behavior: "toggle",
            },
            {
              id: "playset.help.wontfix",
              label: "查看帮助(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "player.downloadquality",
          search: {
            panel: "downloadquality",
          },
          description: "下载音质弹层",
          actions: [
            {
              id: "dlquality.select.opt",
              label: "选下载音质并加入队列",
              behavior: "select",
              paramsSchema: {
                q: "string",
              },
            },
          ],
        },
        {
          id: "player.share",
          search: {
            panel: "share",
          },
          description: "分享面板",
          actions: [
            {
              id: "share.thirdparty.wontfix.v2",
              label: "第三方分享(暂未开放)",
              behavior: "other",
            },
            {
              id: "share.poster.wontfix",
              label: "海报/视频片段(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "player.playlist",
          search: {
            panel: "playlist",
          },
          description: "播放列表弹层",
          actions: [
            {
              id: "playlist.play.select.opt",
              label: "切集播放",
              behavior: "select",
              scope: "item",
              paramsSchema: {
                trackId: "string",
              },
            },
            {
              id: "playlist.sort.toggle",
              label: "正倒序",
              behavior: "toggle",
            },
          ],
        },
        {
          id: "player.ticket",
          search: {
            panel: "ticket",
          },
          description: "月票弹层",
          actions: [
            {
              id: "ticket.tab.select.opt",
              label: "领/投月票切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "ticket.listen.tap",
              label: "去收听",
              behavior: "other",
            },
            {
              id: "ticket.video.fake",
              label: "看视频领月票(模拟弹窗)",
              behavior: "open",
            },
            {
              id: "ticket.vote.tap",
              label: "投月票",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "全屏播放页",
    },
    {
      path: "/skin",
      component: "SkinPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "skin.base",
          search: {},
          description: "皮肤页",
          actions: [
            {
              id: "skin.cat.select.opt",
              label: "皮肤分类切换",
              behavior: "select",
              paramsSchema: {
                cat: "string",
              },
            },
            {
              id: "skin.preview.select.opt",
              label: "预览皮肤",
              behavior: "select",
              scope: "item",
              paramsSchema: {
                skinId: "string",
              },
            },
            {
              id: "skin.apply.select.opt",
              label: "应用皮肤(真实切换)",
              behavior: "select",
              scope: "item",
              paramsSchema: {
                skinId: "string",
              },
            },
            {
              id: "skin.bag.owned",
              label: "查看已购皮肤",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "播放器皮肤页",
    },
    {
      path: "/comment",
      component: "CommentPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "comment.base",
          search: {},
          description: "评论",
          actions: [
            {
              id: "comment.rate.select.opt",
              label: "轻触评价",
              behavior: "select",
              paramsSchema: {
                val: "string",
              },
            },
            {
              id: "comment.vote.open",
              label: "投票弹窗",
              behavior: "open",
            },
            {
              id: "comment.sort.select.opt",
              label: "评论排序",
              behavior: "select",
              paramsSchema: {
                sort: "string",
              },
            },
            {
              id: "comment.like.toggle",
              label: "评论点赞",
              behavior: "toggle",
              scope: "item",
              paramsSchema: {
                cid: "string",
              },
            },
            {
              id: "comment.jumptime.tap",
              label: "时间戳跳转",
              behavior: "other",
              scope: "item",
              paramsSchema: {
                sec: "number",
              },
            },
            {
              id: "comment.replies.toggle",
              label: "展开回复",
              behavior: "toggle",
              scope: "item",
              paramsSchema: {
                cid: "string",
              },
            },
            {
              id: "comment.inputopen.open",
              label: "评论输入态",
              behavior: "open",
            },
            {
              id: "comment.send.submit",
              label: "发送评论",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "评论页",
    },
    {
      path: "/sound/:id",
      component: "SoundDetailPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "sound.base",
          search: {},
          description: "声音详情",
          actions: [
            {
              id: "sounddetail.ai.wontfix",
              label: "AI摘要(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "sound.share",
          search: {
            panel: "share",
          },
          description: "分享面板",
          actions: [
            {
              id: "share.thirdparty.wontfix2",
              label: "分享(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "声音详情页",
    },
    {
      path: "/album/:id",
      component: "AlbumPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "album-main",
          direction: "vertical",
          description: "专辑滚动区",
        },
      ],
      uiStates: [
        {
          id: "album.base",
          search: {},
          description: "专辑详情",
          actions: [
            {
              id: "album.subscribe.toggle",
              label: "订阅/已订阅",
              behavior: "toggle",
            },
            {
              id: "album.tab.select.opt",
              label: "节目/评价/找相似/橱窗切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "album.showcase.wontfix",
              label: "橱窗(暂未开放)",
              behavior: "other",
            },
            {
              id: "album.sort.toggle",
              label: "正倒序",
              behavior: "toggle",
            },
            {
              id: "album.listsearch.wontfix",
              label: "集内搜索(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "album.download",
          search: {
            panel: "downloadquality",
          },
          description: "下载音质弹层",
          actions: [
            {
              id: "dlquality.select2.select.opt",
              label: "选下载音质",
              behavior: "select",
              paramsSchema: {
                q: "string",
              },
            },
          ],
        },
        {
          id: "album.share",
          search: {
            panel: "share",
          },
          description: "分享面板",
          actions: [
            {
              id: "share.thirdparty.wontfix3",
              label: "分享(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "album.itemmenu",
          search: {
            panel: "itemmenu",
          },
          description: "节目项…菜单",
        },
        {
          id: "album.moremenu",
          search: {
            panel: "moremenu",
          },
          description: "顶栏更多菜单",
          actions: [
            {
              id: "album.more.gift.wontfix",
              label: "赠送亲友(暂未开放)",
              behavior: "other",
            },
            {
              id: "album.more.skiphead.wontfix",
              label: "跳过头尾(暂未开放)",
              behavior: "other",
            },
            {
              id: "album.more.copyright.wontfix",
              label: "版权申诉(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "专辑详情页",
    },
    {
      path: "/similar/:id",
      component: "SimilarPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "similarpage.base",
          search: {},
          description: "找相似(相似推荐)",
        },
      ],
      queryParams: {},
      description: "找相似(相似推荐)",
    },
    {
      path: "/anchor/:id",
      component: "AnchorPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "anchor.base",
          search: {},
          description: "主播页",
          actions: [
            {
              id: "anchor.follow.toggle",
              label: "关注/已关注",
              behavior: "toggle",
            },
            {
              id: "anchor.tab.select.opt",
              label: "全部/推荐切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "anchor.sort.select.opt",
              label: "排序",
              behavior: "select",
              paramsSchema: {
                sort: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "主播页",
    },
    {
      path: "/category",
      component: "CategoryPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "category.base",
          search: {},
          description: "分类",
          actions: [
            {
              id: "category.rail.select.opt",
              label: "左类目切换",
              behavior: "select",
              paramsSchema: {
                cat: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "分类页",
    },
    {
      path: "/rank",
      component: "RankPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "rank.base",
          search: {},
          description: "排行榜",
          actions: [
            {
              id: "rank.tab.select.opt",
              label: "榜单切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "rank.category.select.opt",
              label: "左品类切换",
              behavior: "select",
              paramsSchema: {
                cat: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "排行榜页",
    },
    {
      path: "/search",
      component: "SearchPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "search.base",
          search: {},
          description: "搜索",
          actions: [
            {
              id: "search.input.input",
              label: "输入进入联想态",
              behavior: "input",
              paramsSchema: {
                value: "string",
              },
            },
            {
              id: "search.clearhistory.tap",
              label: "清空搜索历史",
              behavior: "other",
            },
            {
              id: "search.ai.wontfix",
              label: "AI荐书(暂未开放)",
              behavior: "other",
            },
          ],
        },
        {
          id: "search.suggest",
          search: {
            mode: "suggest",
          },
          description: "联想态",
          actions: [
            {
              id: "suggest.ai.wontfix",
              label: "小雅Ai(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {
        q: "string",
      },
      description: "搜索页",
    },
    {
      path: "/search-result",
      component: "SearchResultPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "result.base",
          search: {},
          description: "搜索结果",
          actions: [
            {
              id: "result.tab.select.opt",
              label: "结果类型切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "result.broadcast.select.opt",
              label: "广播(虚拟)",
              behavior: "select",
            },
            {
              id: "result.sort.select.opt",
              label: "排序",
              behavior: "select",
              paramsSchema: {
                sort: "string",
              },
            },
            {
              id: "result.filter.open",
              label: "筛选抽屉",
              behavior: "open",
            },
            {
              id: "result.filter.apply",
              label: "应用筛选",
              behavior: "submit",
            },
            {
              id: "result.follow.toggle",
              label: "主播关注",
              behavior: "toggle",
              scope: "item",
              paramsSchema: {
                anchorId: "string",
              },
            },
          ],
        },
      ],
      queryParams: {
        q: "string",
      },
      description: "搜索结果页",
    },
    {
      path: "/me",
      component: "MinePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "mine.base",
          search: {},
          description: "我的",
          actions: [
            {
              id: "mine.contenttab.select.opt",
              label: "内容Tab页内切换(消息/历史/订阅/本地/已购)",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "mine.services.wontfix",
              label: "全部服务宫格(暂未开放)",
              behavior: "other",
            },
            {
              id: "mine.record.wontfix",
              label: "录音直播(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "我的(个人中心)",
    },
    {
      path: "/subscribe",
      component: "SubscribePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "subscribe.base",
          search: {},
          description: "订阅",
          actions: [
            {
              id: "subscribe.tab.select.opt",
              label: "订阅分类切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "subscribe.sort.select.opt",
              label: "排序",
              behavior: "select",
              paramsSchema: {
                sort: "string",
              },
            },
            {
              id: "subscribe.more.open",
              label: "…(搜索/宫格/批量)",
              behavior: "open",
            },
          ],
        },
        {
          id: "subscribe.itemmenu",
          search: {
            panel: "itemmenu",
          },
          description: "项…菜单",
          actions: [
            {
              id: "subscribe.item.menu",
              label: "项菜单",
              behavior: "open",
              scope: "item",
              paramsSchema: {
                albumId: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "订阅列表",
    },
    {
      path: "/subscribe-manage",
      component: "SubscribeManagePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "submanage.base",
          search: {},
          description: "订阅管理",
          actions: [
            {
              id: "submanage.check.toggle",
              label: "勾选",
              behavior: "toggle",
              scope: "item",
              paramsSchema: {
                albumId: "string",
              },
            },
            {
              id: "submanage.remove.submit",
              label: "批量取消订阅",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "订阅管理(批量)",
    },
    {
      path: "/history",
      component: "HistoryPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "history.base",
          search: {},
          description: "播放历史",
          actions: [
            {
              id: "history.tab.select.opt",
              label: "播放/浏览历史切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "history.item.menu",
              label: "历史项…菜单",
              behavior: "open",
              scope: "item",
              paramsSchema: {
                trackId: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "播放历史",
    },
    {
      path: "/history-manage",
      component: "HistoryManagePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "histmanage.base",
          search: {},
          description: "管理收听",
          actions: [
            {
              id: "histmanage.selectall.toggle",
              label: "全选/选择已听完",
              behavior: "toggle",
            },
            {
              id: "histmanage.delete.submit",
              label: "删除所选",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "管理最近收听(批量)",
    },
    {
      path: "/local",
      component: "LocalPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "local.base",
          search: {},
          description: "本地",
          actions: [
            {
              id: "local.tab.select.opt",
              label: "本地类型切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "local.autoclean.toggle",
              label: "自动清理完播开关",
              behavior: "toggle",
            },
            {
              id: "local.item.menu",
              label: "本地项…菜单",
              behavior: "open",
              scope: "item",
              paramsSchema: {
                albumId: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "本地/下载",
    },
    {
      path: "/purchased",
      component: "PurchasedPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "purchased.base",
          search: {},
          description: "已购",
          actions: [
            {
              id: "purchased.tab.select.opt",
              label: "已购类型切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "purchased.order.tap",
              label: "展示已购订单列表",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "已购",
    },
    {
      path: "/messages",
      component: "MessagesPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "messages.base",
          search: {},
          description: "消息",
          actions: [
            {
              id: "messages.readall.tap",
              label: "一键已读",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "消息中心",
    },
    {
      path: "/message/:id",
      component: "MessageDetailPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "msgdetail.base",
          search: {},
          description: "消息详情",
          actions: [
            {
              id: "msgdetail.tab.select.opt",
              label: "互动类型切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "msgdetail.survey.wontfix",
              label: "调研(暂未开放)",
              behavior: "other",
            },
            {
              id: "msgdetail.vote.select.opt",
              label: "听见投票",
              behavior: "select",
              paramsSchema: {
                opt: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "消息子会话页",
    },
    {
      path: "/profile",
      component: "ProfilePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "profile.base",
          search: {},
          description: "个人主页",
          actions: [
            {
              id: "profile.tab.select.opt",
              label: "作品/动态切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "profile.subtab.select.opt",
              label: "动态子Tab",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "profile.upload.wontfix",
              label: "上传照片(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "个人主页",
    },
    {
      path: "/profile-edit",
      component: "ProfileEditPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "pedit.base",
          search: {},
          description: "编辑资料",
          actions: [
            {
              id: "pedit.field.input",
              label: "编辑昵称/性别/生日/地区",
              behavior: "input",
              paramsSchema: {
                field: "string",
                value: "string",
              },
            },
            {
              id: "pedit.voice.wontfix",
              label: "声音签名(暂未开放)",
              behavior: "other",
            },
            {
              id: "pedit.avatar.wontfix",
              label: "编辑头像/背景(暂未开放)",
              behavior: "other",
            },
            {
              id: "pedit.misc.wontfix",
              label: "认证/隐私(暂未开放)",
              behavior: "other",
            },
            {
              id: "pedit.sync.wontfix",
              label: "同步微信/QQ(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "编辑资料",
    },
    {
      path: "/badges",
      component: "BadgesPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "badges.base",
          search: {},
          description: "勋章墙",
          actions: [
            {
              id: "badges.tab.select.opt",
              label: "成就分类切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "badges.detail.open",
              label: "勋章详情",
              behavior: "open",
              scope: "item",
              paramsSchema: {
                bid: "string",
              },
            },
            {
              id: "badges.wear.wontfix",
              label: "佩戴管理(暂未开放)",
              behavior: "other",
            },
            {
              id: "badges.more.tap",
              label: "展开更多",
              behavior: "other",
            },
          ],
        },
        {
          id: "badges.share",
          search: {
            panel: "share",
          },
          description: "分享面板",
          actions: [
            {
              id: "share.thirdparty.wontfix4",
              label: "分享(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "勋章墙",
    },
    {
      path: "/listenlist/:id",
      component: "ListenListPage",
      params: {
        id: "string",
      },
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "listenlistpage.base",
          search: {},
          description: "听单详情(我收藏的声音)",
        },
      ],
      queryParams: {},
      description: "听单详情(我收藏的声音)",
    },
    {
      path: "/member",
      component: "MemberCenterPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "member.base",
          search: {},
          description: "会员中心",
          actions: [
            {
              id: "member.tab.select.opt",
              label: "会员/儿童会员切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
          ],
        },
      ],
      queryParams: {},
      description: "会员中心",
    },
    {
      path: "/member-purchase",
      component: "MemberPurchasePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "purchase.base",
          search: {},
          description: "开通页",
          actions: [
            {
              id: "purchase.plan.select.opt",
              label: "选择套餐",
              behavior: "select",
              paramsSchema: {
                planId: "string",
              },
            },
            {
              id: "purchase.tier.select.opt",
              label: "会员档切换",
              behavior: "select",
              paramsSchema: {
                tier: "string",
              },
            },
            {
              id: "purchase.paymethod.select.opt",
              label: "选择支付方式",
              behavior: "select",
              paramsSchema: {
                method: "string",
              },
            },
            {
              id: "purchase.union.wontfix",
              label: "联合会员(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "VIP开通页",
    },
    {
      path: "/pay-success",
      component: "PaySuccessPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "paysuccess.base",
          search: {},
          description: "开通成功",
        },
      ],
      queryParams: {},
      description: "开通成功(模拟)",
    },
    {
      path: "/child-member",
      component: "ChildMemberPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "childmember.base",
          search: {},
          description: "儿童会员",
          actions: [
            {
              id: "childmember.open.wontfix",
              label: "立即开通(暂未开放)",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "儿童会员中心",
    },
    {
      path: "/driving",
      component: "DrivingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "driving.base",
          search: {},
          description: "驾驶模式",
          actions: [
            {
              id: "driving.toggle.toggle",
              label: "播放/暂停",
              behavior: "toggle",
            },
            {
              id: "driving.prevnext.select.opt",
              label: "上一集/下一集",
              behavior: "select",
              paramsSchema: {
                dir: "string",
              },
            },
            {
              id: "driving.exit.tap",
              label: "退出驾驶模式",
              behavior: "other",
            },
          ],
        },
      ],
      queryParams: {},
      description: "驾驶模式(极简收听)",
    },
    {
      path: "/feedback",
      component: "FeedbackPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "feedback.base",
          search: {},
          description: "评价反馈",
          actions: [
            {
              id: "feedback.stars.select.opt",
              label: "星级评分",
              behavior: "select",
              paramsSchema: {
                n: "number",
              },
            },
            {
              id: "feedback.choice.select.opt",
              label: "小调研/电话回访",
              behavior: "select",
              paramsSchema: {
                opt: "string",
              },
            },
            {
              id: "feedback.submit.submit",
              label: "提交(模拟)",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "评价反馈",
    },
    {
      path: "/report",
      component: "ReportPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "report.base",
          search: {},
          description: "声音举报",
          actions: [
            {
              id: "report.reason.select.opt",
              label: "选择举报原因",
              behavior: "select",
              paramsSchema: {
                reason: "string",
              },
            },
            {
              id: "report.upload.wontfix",
              label: "上传证明材料(暂未开放)",
              behavior: "other",
            },
            {
              id: "report.submit.submit",
              label: "提交(模拟)",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "声音举报",
    },
    {
      path: "/copyright",
      component: "CopyrightPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "copyright.base",
          search: {},
          description: "版权申诉",
          actions: [
            {
              id: "copyright.input.input",
              label: "填写作品/著作人/手机号",
              behavior: "input",
              paramsSchema: {
                field: "string",
                value: "string",
              },
            },
            {
              id: "copyright.upload.wontfix",
              label: "证明材料上传(暂未开放)",
              behavior: "other",
            },
            {
              id: "copyright.apply.wontfix",
              label: "在线申请版权认证(暂未开放)",
              behavior: "other",
            },
            {
              id: "copyright.submit.submit",
              label: "提交(模拟)",
              behavior: "submit",
            },
          ],
        },
      ],
      queryParams: {},
      description: "版权申诉",
    },
    {
      path: "/relations",
      component: "RelationsPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "relations.base",
          search: {},
          description: "关系列表",
          actions: [
            {
              id: "relations.tab.select.opt",
              label: "粉丝/关注切换",
              behavior: "select",
              paramsSchema: {
                tab: "string",
              },
            },
            {
              id: "relations.follow.toggle",
              label: "关注/取关",
              behavior: "toggle",
              scope: "item",
              paramsSchema: {
                uid: "string",
              },
            },
          ],
        },
      ],
      queryParams: {
        tab: "string",
      },
      description: "粉丝/关注列表",
    },
    {
      path: "/stub",
      component: "StubPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [
        {
          name: "main",
          direction: "vertical",
          description: "主内容区",
        },
      ],
      uiStates: [
        {
          id: "stubpage.base",
          search: {},
          description: "暂未开放占位页",
        },
      ],
      queryParams: {},
      description: "暂未开放占位页",
    },
  ],
  transitions: [
    {
      id: "tabbar.home-open",
      from: "*",
      to: "/",
      search: {},
      searchParams: {},
      mode: "replace",
      params: {},
      label: "首页 Tab",
      ui: {
        placement: "tabbar",
        icon: "tab_home",
        gesture: "tap",
      },
    },
    {
      id: "tabbar.quicklisten-open",
      from: "*",
      to: "/quicklisten",
      search: {},
      searchParams: {},
      mode: "replace",
      params: {},
      label: "快听 Tab",
      ui: {
        placement: "tabbar",
        icon: "tab_quick",
        gesture: "tap",
      },
    },
    {
      id: "tabbar.member-open",
      from: "*",
      to: "/member",
      search: {},
      searchParams: {},
      mode: "replace",
      params: {},
      label: "会员 Tab",
      ui: {
        placement: "tabbar",
        icon: "tab_member",
        gesture: "tap",
      },
    },
    {
      id: "tabbar.mine-open",
      from: "*",
      to: "/me",
      search: {},
      searchParams: {},
      mode: "replace",
      params: {},
      label: "我的 Tab",
      ui: {
        placement: "tabbar",
        icon: "tab_mine",
        gesture: "tap",
      },
    },
    {
      id: "tabbar.player-open",
      from: "*",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "中央播放按钮外环→播放页",
      ui: {
        placement: "tabbar",
        icon: "play",
        gesture: "tap",
      },
    },
    {
      id: "home.search-open",
      from: [
        "/",
        "/search-result",
      ],
      to: "/search",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "首页搜索栏",
      ui: {
        placement: "topbar",
        icon: "search",
        gesture: "tap",
      },
    },
    {
      id: "home.categorysub-open",
      from: "/",
      to: "/category-sub",
      search: {},
      searchParams: {
        cat: "string",
      },
      mode: "push",
      params: {
        cat: "string",
      },
      label: "首页分类子页",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.driving-open",
      from: "/",
      to: "/driving",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "切换模式→驾驶模式",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.categorymore-open",
      from: [
        "/",
        "/category-sub",
      ],
      to: "/category",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "更多分类≡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.continue-play",
      from: "/",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "续听卡→续播",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.rank-open",
      from: "/",
      to: "/rank",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "首页排行榜",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.album-open",
      from: "/",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "首页专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "catsub.album-open",
      from: "/category-sub",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "分类子页专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "quick.player-open",
      from: "/quicklisten",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "快听当前音源条→播放页",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "quick.share-open",
      from: "/quicklisten",
      to: "/quicklisten",
      search: {
        panel: "share",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "快听分享",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.more-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "more",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "更多菜单",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.timer-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "timer",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "定时弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.speed-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "speed",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "倍速弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.quality-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "quality",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "音质音效弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.playsettings-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "playsettings",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "播放设置弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.share-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "share",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "分享面板",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.playlist-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "playlist",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "播放列表弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.ticket-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "ticket",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "月票弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.transcript-open",
      from: "/player",
      to: "/player",
      search: {
        view: "transcript",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "文稿全屏",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.comment-open",
      from: [
        "/album/:id",
        "/player",
      ],
      to: "/comment",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "评论页",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.skin-open",
      from: "/player",
      to: "/skin",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "播放器皮肤页",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.album-open",
      from: "/player",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "播放页专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "player.anchor-open",
      from: "/player",
      to: "/anchor/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "播放页主播",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.sounddetail-open",
      from: "/player",
      to: "/sound/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "声音详情",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.driving-open",
      from: "/player",
      to: "/driving",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "驾驶模式",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.feedback-open",
      from: "/player",
      to: "/feedback",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "评价反馈",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.report-open",
      from: "/player",
      to: "/report",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "声音举报",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.copyright-open",
      from: "/player",
      to: "/copyright",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "版权申诉",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.watch-transcript",
      from: "/player",
      to: "/player",
      search: {
        view: "transcript",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "边听边看→文稿",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "player.downloadquality-open",
      from: "/player",
      to: "/player",
      search: {
        panel: "downloadquality",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "下载音质弹层",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.player-open",
      from: "/album/:id",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "专辑→播放",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.similar-open",
      from: "/album/:id",
      to: "/similar/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "找相似",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.anchor-open",
      from: "/album/:id",
      to: "/anchor/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "专辑→主播",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.share-open",
      from: "/album/:id",
      to: "/album/:id",
      search: {
        panel: "share",
      },
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "专辑分享",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.download-open",
      from: "/album/:id",
      to: "/album/:id",
      search: {
        panel: "downloadquality",
      },
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "专辑下载音质",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.itemmenu-open",
      from: "/album/:id",
      to: "/album/:id",
      search: {
        panel: "itemmenu",
      },
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "节目项菜单",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "similar.album-open",
      from: "/similar/:id",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "相似专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "anchor.album-open",
      from: "/anchor/:id",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "主播作品卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "category.chip-open",
      from: "/category",
      to: "/rank",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "分类名家chip→榜单",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "rank.album-open",
      from: "/rank",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "榜单专辑",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "search.submit",
      from: [
        "/search",
        "/search-result",
      ],
      to: "/search-result",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "提交搜索",
      ui: {
        placement: "topbar",
        icon: "search",
        gesture: "tap",
      },
    },
    {
      id: "search.result-open",
      from: "/search",
      to: "/search-result",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "历史/热搜→结果",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "suggest.play",
      from: "/search",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "联想直达播放",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "result.album-open",
      from: "/search-result",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "结果专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "result.anchor-open",
      from: "/search-result",
      to: "/anchor/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "结果主播卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "anchors",
        paramMapping: {
          id: "id",
        },
        labelField: "name",
      },
    },
    {
      id: "result.play",
      from: "/search-result",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "一键播放第1集",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.profile-open",
      from: "/me",
      to: "/profile",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "头像→个人主页",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.vip-open",
      from: "/me",
      to: "/member-purchase",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "VIP卡→开通",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.child-open",
      from: "/me",
      to: "/child-member",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "VIP儿童卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.messages-open",
      from: "/me",
      to: "/messages",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "消息Tab",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.history-open",
      from: [
        "/",
        "/me",
      ],
      to: "/history",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "历史Tab",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.subscribe-open",
      from: "/me",
      to: "/subscribe",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "订阅Tab",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.local-open",
      from: "/me",
      to: "/local",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "本地Tab",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "mine.purchased-open",
      from: "/me",
      to: "/purchased",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "已购Tab",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "subscribe.album-open",
      from: [
        "/subscribe",
        "/me",
      ],
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "订阅专辑行",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "subscribe.player-open",
      from: [
        "/subscribe",
        "/me",
      ],
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "订阅续播",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "subscribe.listenlist-open",
      from: [
        "/subscribe",
        "/me",
      ],
      to: "/listenlist/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "我收藏的声音听单",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "subscribe.manage-open",
      from: "/subscribe",
      to: "/subscribe-manage",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "批量处理",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "subscribe.add-open",
      from: "/subscribe",
      to: "/search",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "添加订阅→搜索",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "history.player-open",
      from: [
        "/history",
        "/me",
      ],
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "历史行→播放",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "history.manage-open",
      from: "/history",
      to: "/history-manage",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "管理最近收听",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "local.player-open",
      from: [
        "/local",
        "/me",
      ],
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "本地行→播放",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "purchased.album-open",
      from: [
        "/purchased",
        "/me",
      ],
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "已购专辑行",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "albums",
        paramMapping: {
          id: "id",
        },
        labelField: "title",
      },
    },
    {
      id: "messages.detail-open",
      from: [
        "/messages",
        "/me",
      ],
      to: "/message/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "消息会话",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
      dataSource: {
        ref: "messages",
        paramMapping: {
          id: "id",
        },
        labelField: "name",
      },
    },
    {
      id: "msgdetail.source-open",
      from: "/message/:id",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "互动卡跳源",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.edit-open",
      from: "/profile",
      to: "/profile-edit",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "编辑资料",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.badges-open",
      from: "/profile",
      to: "/badges",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "勋章墙",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.card-open",
      from: "/profile",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "动态专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "badges.share-open",
      from: "/badges",
      to: "/badges",
      search: {
        panel: "share",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "勋章分享",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "listenlist.play",
      from: "/listenlist/:id",
      to: "/player",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "听单单集播放",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "member.purchase-open",
      from: [
        "/member",
        "/player",
      ],
      to: "/member-purchase",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "续费/开通",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "member.superlisten-open",
      from: "/member",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "超前听专辑",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "purchase.confirm",
      from: "/member-purchase",
      to: "/pay-success",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "确认协议并开通→模拟成功",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "childmember.album-open",
      from: "/child-member",
      to: "/album/:id",
      search: {},
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "儿童专辑卡",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "sound.share-open",
      from: "/sound/:id",
      to: "/sound/:id",
      search: {
        panel: "share",
      },
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "声音详情分享",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "album.moremenu-open",
      from: "/album/:id",
      to: "/album/:id",
      search: {
        panel: "moremenu",
      },
      searchParams: {},
      mode: "push",
      params: {
        id: "string",
      },
      label: "专辑顶栏更多菜单",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "home.vip-open",
      from: "/",
      to: "/member-purchase",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "首页VIP促销条",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.listen-open",
      from: "/profile",
      to: "/history",
      search: {},
      searchParams: {},
      mode: "push",
      params: {},
      label: "收听时长→收听列表",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.fans-open",
      from: "/profile",
      to: "/relations",
      search: {
        tab: "fans",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "粉丝列表",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
    {
      id: "profile.follows-open",
      from: "/profile",
      to: "/relations",
      search: {
        tab: "follows",
      },
      searchParams: {},
      mode: "push",
      params: {},
      label: "关注列表",
      ui: {
        placement: "content",
        icon: "card",
        gesture: "tap",
      },
    },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];

/**
 * 微博 声明式导航 —— 由 docs/weibo-replication/spec.json v1.0.1 编译。
 * nav → transitions;state → uiStates[].actions;纯返回/关闭/取消 → system.back(bindBack,不建声明,pipeline v3 §11)。
 * 弹层(＋菜单/评论面板/分享面板/取关sheet等)走 searchParams,符合 module-contract「URL 驱动 UI」。
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;
const ds = (ref: string, param: string, labelField?: string) =>
  ({ ref, paramMapping: { [param]: 'id' }, labelField }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'weibo',
  routes: [
    // ---------------- 首页信息流 ----------------
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页信息流')],
      uiStates: [
        {
          id: 'weibo.home.base', search: {}, description: '首页信息流(tab=推荐/关注,channel 切频道)',
          actions: [
            { id: 'home.tab.select.target', label: '推荐/关注大字tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.channel.select.target', label: '频道chips(热门/世界杯/同城/实时/榜单)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.card.follow.toggle', label: '卡片+关注', behavior: 'toggle', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'home.card.like.toggle', label: '卡片点赞', behavior: 'toggle', scope: 'item', paramsSchema: { statusId: 'string' } },
            { id: 'home.card.fold.stub', label: '卡片∨折叠(暂未开放)', behavior: 'other' },
            { id: 'home.feed.refresh', label: '下拉刷新(横幅:热门微博已更新)', behavior: 'modify' },
            { id: 'home.redpacket.stub', label: '顶栏红包(暂未开放)', behavior: 'other' },
            { id: 'home.floatRedpacket.close', label: '红包挂件×', behavior: 'close' },
            { id: 'home.floatRedpacket.stub', label: '红包挂件(暂未开放)', behavior: 'other' },
            { id: 'tabbar.home.scrollTop', label: '首页Tab再点回顶', behavior: 'other' },
            { id: 'home.plusMenu.toggle', label: '右上＋菜单开/收', behavior: 'toggle' },
            { id: 'home.followGroups.toggle', label: '关注▾分组面板开/收', behavior: 'toggle' },
          ],
        },
        {
          id: 'weibo.home.plusMenu', search: { plus: 'open' }, description: '＋下拉菜单(写微博/相册/打卡/签到点评/直播)',
          actions: [
            { id: 'home.plusMenu.stub', label: '相册/打卡/签到点评/直播(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'weibo.home.followGroups', search: { groups: 'open' }, description: '关注分组下拉面板',
          actions: [
            { id: 'home.followGroups.select.target', label: '选分组过滤关注流', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string', channel: 'string' },
      description: '首页:超话入口/推荐·关注/频道chips/微博卡片流/＋菜单',
    },
    // ---------------- 登录 ----------------
    {
      path: '/login',
      component: 'LoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.login.base', search: {}, description: '账号快捷登录页',
          actions: [
            { id: 'login.quick.submit', label: '以此账号登录', behavior: 'submit' },
            { id: 'login.other.open', label: '以其他方式登录→一键登录页', behavior: 'open' },
          ],
        },
        {
          id: 'weibo.login.onekey', search: { view: 'onekey' }, description: '一键登录页(logo/脱敏手机号/协议/第三方图标)',
          actions: [
            { id: 'login.agreement.toggle', label: '协议勾选框', behavior: 'toggle' },
            { id: 'login.onekey.agreementGate', label: '未勾协议点登录→弹协议弹窗', behavior: 'open' },
            { id: 'login.onekey.submit', label: '本机号码一键登录', behavior: 'submit' },
            { id: 'login.thirdparty.stub', label: '邮箱/微信/QQ/扫一扫(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'weibo.login.agreement', search: { view: 'onekey', agree: 'open' }, description: '「用户协议与隐私条款」弹窗',
          actions: [
            { id: 'login.agreement.confirm', label: '同意并登录', behavior: 'submit' },
            { id: 'login.agreement.reject', label: '不同意', behavior: 'close' },
          ],
        },
      ],
      queryParams: {},
      description: '登录(账号快捷/一键登录/协议弹窗)',
    },
    {
      path: '/login/sms',
      component: 'LoginSmsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.loginsms.base', search: {}, description: '身份验证-输手机号(数字键盘)',
          actions: [
            { id: 'loginsms.phone.input', label: '手机号输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'loginsms.phone.next', label: '下一步→验证码', behavior: 'submit' },
          ],
        },
        {
          id: 'weibo.loginsms.code', search: { step: 'code' }, description: '输验证码(60s倒计时)',
          actions: [
            { id: 'loginsms.code.input', label: '验证码输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'loginsms.code.submit', label: '确认→登录成功', behavior: 'submit' },
            { id: 'loginsms.code.resend', label: '重新获取验证码', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '身份验证(手机号+验证码)',
    },
    // ---------------- 视频(浅版) ----------------
    {
      path: '/video',
      component: 'VideoPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('video-feed', '竖版视频流')],
      uiStates: [
        {
          id: 'weibo.video.base', search: {}, description: '视频流浅版',
          actions: [
            { id: 'video.feed.next', label: '上滑切换视频', behavior: 'other' },
            { id: 'video.like.toggle', label: '右侧赞', behavior: 'toggle', scope: 'item', paramsSchema: { videoId: 'string' } },
            { id: 'video.follow.toggle', label: '博主+关注', behavior: 'toggle', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'video.misc.stub', label: '抢首评/转发/…/下一章/顶部tab(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '视频流(浅版,深互动 wontfix)',
    },
    // ---------------- 发现/热搜 ----------------
    {
      path: '/discover',
      component: 'DiscoverPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('discover-feed', '发现页流')],
      uiStates: [
        {
          id: 'weibo.discover.base', search: {}, description: '发现页(热搜榜+频道chips+热点流)',
          actions: [
            { id: 'discover.channel.select.target', label: '频道chips(热点/星品/热转/V发布/世界杯)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'discover.briefing.stub', label: '热搜简报(暂未开放)', behavior: 'other' },
            { id: 'discover.channelMore.stub', label: '☰更多频道(暂未开放)', behavior: 'other' },
            { id: 'discover.camera.stub', label: '拍照搜索(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { channel: 'string' },
      description: '发现/热搜页',
    },
    {
      path: '/discover/hot',
      component: 'HotFullPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('hot-list', '完整热搜榜')],
      uiStates: [{ id: 'weibo.hotfull.base', search: {}, description: '完整热搜榜(1~60)' }],
      queryParams: {},
      description: '完整热搜榜单页',
    },
    // ---------------- 搜索 ----------------
    {
      path: '/search',
      component: 'SearchLandingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-landing', '搜索中间页')],
      uiStates: [
        {
          id: 'weibo.search.base', search: {}, description: '搜索中间页(历史/猜你想搜;输入出联想)',
          actions: [
            { id: 'search.input.type', label: '输入关键词(联想)', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.history.clear', label: '清空搜索历史', behavior: 'modify' },
            { id: 'search.tools.stub', label: '智搜开关/拍照/语音(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索中间页',
    },
    {
      path: '/search/result',
      component: 'SearchResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-result', '搜索结果流')],
      uiStates: [
        {
          id: 'weibo.searchresult.base', search: {}, description: '搜索结果(q=词;tab=综合/智搜/实时/用户/视频/图片/关注/热门/全网/话题/超话/地点;话题词带头卡)',
          actions: [
            { id: 'searchResult.tab.select.target', label: '结果tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'searchResult.realtimeSort.toggle', label: '实时tab 互动/时间排序', behavior: 'toggle' },
            { id: 'searchResult.follow.toggle', label: '结果卡+关注', behavior: 'toggle', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'searchResult.filterChip.select.target', label: '筛选chips(关键词态)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'searchResult.aisearch.stub', label: '问智搜/追问(暂未开放)', behavior: 'other' },
            { id: 'searchResult.share.open', label: '分享面板(…全功能/底部精简)', behavior: 'open' },
          ],
        },
        {
          id: 'weibo.searchresult.share', search: { share: 'open' }, description: '分享面板',
          actions: [
            { id: 'searchResult.share.copyLink', label: '复制链接(toast已复制)', behavior: 'other' },
            { id: 'searchResult.share.stub', label: '其余渠道/功能(暂未开放)', behavior: 'other' },
            { id: 'searchResult.share.close', label: '取消/遮罩收起', behavior: 'close' },
          ],
        },
      ],
      queryParams: { q: 'string', tab: 'string', mode: 'string' },
      description: '搜索结果页(含话题页形态)',
    },
    // ---------------- 微博详情 ----------------
    {
      path: '/status/:id',
      component: 'StatusDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('status-detail', '详情+评论区')],
      uiStates: [
        {
          id: 'weibo.status.base', search: {}, description: '微博详情(tab=转发/评论/赞)',
          actions: [
            { id: 'status.like.toggle', label: '底栏赞(动画+计数)', behavior: 'toggle', paramsSchema: { statusId: 'string' } },
            { id: 'status.tab.select.target', label: '互动tab 转发/评论/赞', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'status.commentSort.toggle', label: '评论排序 热度/时间', behavior: 'toggle' },
            { id: 'status.author.follow.toggle', label: '博主+关注(悬浮条同步)', behavior: 'toggle', paramsSchema: { userId: 'string' } },
            { id: 'status.followBar.close', label: '悬浮关注条×', behavior: 'close' },
            { id: 'status.comment.like.toggle', label: '评论点赞', behavior: 'toggle', scope: 'item', paramsSchema: { commentId: 'string' } },
            { id: 'status.favorite.toggle', label: '收藏(博主行右侧星标)', behavior: 'toggle', paramsSchema: { statusId: 'string' } },
            { id: 'status.share.stub', label: '分享行 微信/朋友圈/QQ/保存图片/智搜(暂未开放)', behavior: 'other' },
            { id: 'status.moreMenu.stub', label: '右上…(暂未开放)', behavior: 'other' },
            { id: 'status.recoFollow.toggle', label: '关注推荐卡+关注', behavior: 'toggle', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'status.relatedVideo.stub', label: '相关视频卡(暂未开放)', behavior: 'other' },
            { id: 'status.commentPanel.open', label: '底部评论框→评论输入面板', behavior: 'open' },
            { id: 'status.replyPanel.open', label: '评论正文→回复输入面板', behavior: 'open', scope: 'item', paramsSchema: { commentId: 'string' } },
          ],
        },
        {
          id: 'weibo.status.commentPanel', search: { panel: 'comment' }, description: '评论输入面板(半屏)',
          actions: [
            { id: 'commentPanel.text.input', label: '评论文字输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'commentPanel.comment.submit', label: '发送评论/回复', behavior: 'submit' },
            { id: 'commentPanel.alsoRepost.toggle', label: '同时转发勾选', behavior: 'toggle' },
            { id: 'commentPanel.emoji.insert', label: 'emoji插入', behavior: 'other' },
            { id: 'commentPanel.tools.stub', label: '图片/@/+(暂未开放)', behavior: 'other' },
            { id: 'commentPanel.panel.close', label: '遮罩收起(丢弃未发送)', behavior: 'close' },
          ],
        },
      ],
      queryParams: { tab: 'string', cid: 'string' },
      description: '微博详情页(评论面板走 ?panel=comment&cid=)',
    },
    {
      path: '/status/:id/replies/:cid',
      component: 'ReplyDetailPage',
      params: { id: 'string', cid: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('reply-list', '回复列表')],
      uiStates: [
        {
          id: 'weibo.replies.base', search: {}, description: 'N条回复全屏页',
          actions: [
            { id: 'replyDetail.replyPanel.open', label: '底部回复条→输入面板', behavior: 'open' },
            { id: 'replyDetail.like.toggle', label: '回复点赞', behavior: 'toggle', scope: 'item', paramsSchema: { commentId: 'string' } },
            { id: 'replyDetail.sort.toggle', label: '按热度/时间', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: { panel: 'string' },
      description: '回复详情页',
    },
    {
      path: '/repost/:id',
      component: 'RepostComposePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.repost.base', search: {}, description: '转发微博编辑页',
          actions: [
            { id: 'repost.text.input', label: '转发语输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'repost.topicChip.insert', label: '推荐话题chip插入', behavior: 'other' },
            { id: 'repost.send.submit', label: '发送转发', behavior: 'submit' },
            { id: 'repost.alsoComment.toggle', label: '同时评论勾选', behavior: 'toggle' },
            { id: 'repost.tools.stub', label: '图片/GIF/表情/+/超话(暂未开放)', behavior: 'other' },
            { id: 'repost.cancel.draftDialog', label: '取消(有内容)→是否保存草稿', behavior: 'open' },
          ],
        },
        { id: 'weibo.repost.draftDialog', search: { dialog: 'draft' }, description: '是否保存草稿弹窗' },
      ],
      queryParams: {},
      description: '转发微博(全屏编辑)',
    },
    {
      path: '/status/:id/image/:idx',
      component: 'ImageViewerPage',
      params: { id: 'string', idx: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('image-viewer', '大图横滑', 'horizontal')],
      uiStates: [
        {
          id: 'weibo.imageviewer.base', search: {}, description: '图片大图查看',
          actions: [
            { id: 'imageViewer.page.swipe', label: '左右滑切图', behavior: 'other' },
            { id: 'imageViewer.save.stub', label: '保存(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '图片查看器',
    },
    // ---------------- 发博 ----------------
    {
      path: '/compose',
      component: 'ComposePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.compose.base', search: {}, description: '发微博(q 预填话题;draft 回填草稿)',
          actions: [
            { id: 'compose.text.input', label: '正文输入(计数/发送钮亮起)', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'compose.send.submit', label: '发送(toast发送成功回来源页)', behavior: 'submit' },
            { id: 'compose.location.select.target', label: '位置推荐chip选中', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'compose.location.remove', label: '已选位置×移除', behavior: 'modify' },
            { id: 'compose.location.expand', label: '添加位置chip展开/收起推荐条', behavior: 'toggle' },
            { id: 'compose.tools.stub', label: 'GIF/+(暂未开放);表情=浅版面板', behavior: 'other' },
            { id: 'compose.declaration.stub', label: '内容声明(暂未开放)', behavior: 'other' },
            { id: 'compose.tagRow.close', label: '标签行×收起', behavior: 'close' },
            { id: 'compose.image.remove', label: '图片缩略×移除', behavior: 'modify', scope: 'item', paramsSchema: { imageIndex: 'number' } },
            { id: 'compose.cancel.draftDialog', label: '取消(有内容)→是否保存草稿', behavior: 'open' },
          ],
        },
        { id: 'weibo.compose.draftDialog', search: { dialog: 'draft' }, description: '是否保存草稿弹窗' },
      ],
      queryParams: { topic: 'string', draft: 'string' },
      description: '发微博页',
    },
    {
      path: '/compose/topic',
      component: 'TopicPickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('topic-list', '话题列表')],
      uiStates: [
        {
          id: 'weibo.topicpicker.base', search: {}, description: '#话题选择页(左分类右列表)',
          actions: [
            { id: 'topicPicker.category.select.target', label: '左侧分类', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'topicPicker.topic.insert', label: '话题行→插入正文并关闭', behavior: 'submit', scope: 'item', paramsSchema: { topic: 'string' } },
            { id: 'topicPicker.search.input', label: '话题搜索过滤', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: { from: 'string' },
      description: '话题选择页(from=compose|repost)',
    },
    {
      path: '/compose/mention',
      component: 'MentionPickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('contact-list', '联系人列表')],
      uiStates: [
        {
          id: 'weibo.mentionpicker.base', search: {}, description: '@联系人选择页',
          actions: [
            { id: 'mentionPicker.user.insert', label: '联系人行→插入@并关闭', behavior: 'submit', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'mentionPicker.search.input', label: '联系人搜索过滤', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'mentionPicker.index.jump', label: '字母索引跳转', behavior: 'other' },
          ],
        },
      ],
      queryParams: { from: 'string' },
      description: '@联系人选择页',
    },
    {
      path: '/compose/supertopic',
      component: 'SupertopicPickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('stpicker-list', '超话列表')],
      uiStates: [
        {
          id: 'weibo.stpicker.base', search: {}, description: '超话选择页',
          actions: [
            { id: 'stPicker.category.select.target', label: '左侧分类', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'stPicker.supertopic.insert', label: '超话行→插入◇名并关闭(公开态)', behavior: 'submit', scope: 'item', paramsSchema: { supertopicId: 'string' } },
          ],
        },
        {
          id: 'weibo.stpicker.syncDialog', search: { sync: 'confirm' }, description: '同步发布超话帖弹窗(非公开可见范围时)',
          actions: [
            { id: 'stPicker.visibilityDialog.confirm', label: '确定→插入+可见范围改公开', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '超话选择页',
    },
    {
      path: '/compose/images',
      component: 'ImagePickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('image-grid', '相册网格')],
      uiStates: [
        {
          id: 'weibo.imagepicker.base', search: {}, description: '图片选择页(内置素材库)',
          actions: [
            { id: 'imagePicker.item.toggle', label: '图片格勾选(橙色序号)', behavior: 'toggle', scope: 'item', paramsSchema: { imageId: 'string' } },
            { id: 'imagePicker.select.confirm', label: '下一步(N)→回填缩略图', behavior: 'submit' },
            { id: 'imagePicker.misc.stub', label: '相机/制作视频/原图(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '图片选择页',
    },
    {
      path: '/compose/visibility',
      component: 'VisibilityPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.visibility.base', search: {}, description: '选择分享范围(公开/粉丝/好友圈/仅自己可见)',
          actions: [
            { id: 'visibility.option.select.target', label: '范围单选并返回', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { from: 'string' },
      description: '选择分享范围',
    },
    // ---------------- 超话 ----------------
    {
      path: '/supertopic/square',
      component: 'SupertopicSquarePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('square-feed', '超话社区流')],
      uiStates: [
        {
          id: 'weibo.stsquare.base', search: {}, description: '超话社区(我的超话横滑+一键签到+帖子流)',
          actions: [
            { id: 'supertopicSquare.signAll.submit', label: '一键签到', behavior: 'submit' },
            { id: 'supertopicSquare.create.stub', label: '创建(暂未开放)', behavior: 'other' },
            { id: 'supertopicSquare.rank.stub', label: '榜单卡/超友趣卡(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '超话社区页',
    },
    {
      path: '/supertopic/:id',
      component: 'SupertopicDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('supertopic-feed', '超话帖子流')],
      uiStates: [
        {
          id: 'weibo.supertopic.base', search: {}, description: '超话主页(tab=详情/热门/最新/名人动态)',
          actions: [
            { id: 'supertopic.signin.submit', label: '签到→连签N天挂件', behavior: 'submit', paramsSchema: { supertopicId: 'string' } },
            { id: 'supertopic.tab.select.target', label: 'tab切换(超友趣/追星纪念=toast)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'supertopic.follow.toggle', label: '关注/加入超话', behavior: 'toggle', paramsSchema: { supertopicId: 'string' } },
            { id: 'supertopic.bottom.stub', label: '底部群聊/我的LV(暂未开放)', behavior: 'other' },
            { id: 'supertopic.misc.stub', label: '日程表查看/找搭子/搜索/分享(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '超话主页',
    },
    {
      path: '/supertopic/:id/compose',
      component: 'SupertopicComposePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'weibo.stcompose.base', search: {}, description: '超话发帖页(版块chips/同步到微博)',
          actions: [
            { id: 'stCompose.text.input', label: '正文输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'stCompose.section.select.target', label: '版块chips单选', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'stCompose.syncWeibo.toggle', label: '同步到微博勾选', behavior: 'toggle' },
            { id: 'stCompose.tools.stub', label: '图片/#/GIF/表情/+(暂未开放)', behavior: 'other' },
            { id: 'stCompose.send.submit', label: '发送→帖子入最新流', behavior: 'submit' },
            { id: 'stCompose.cancel.draftDialog', label: '取消(有内容)→草稿弹窗', behavior: 'open' },
          ],
        },
        { id: 'weibo.stcompose.draftDialog', search: { dialog: 'draft' }, description: '是否保存草稿弹窗' },
      ],
      queryParams: {},
      description: '超话发帖页',
    },
    // ---------------- 消息 ----------------
    {
      path: '/message',
      component: 'MessagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('message-list', '会话列表')],
      uiStates: [
        {
          id: 'weibo.message.base', search: {}, description: '消息页(tab=动态/消息)',
          actions: [
            { id: 'message.tab.select.target', label: '动态/消息tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'message.gearMenu.toggle', label: '⚙菜单开/收', behavior: 'toggle' },
            { id: 'message.badge.clearAll', label: '🧹清全部未读', behavior: 'modify' },
            { id: 'message.notifyBanner.dismiss', label: '通知横幅 去开启(toast)/×消失', behavior: 'close' },
            { id: 'message.misc.stub', label: '发现群/搜索(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'weibo.message.gearMenu', search: { menu: 'gear' }, description: '⚙下拉菜单(消息设置/发起聊天)' },
      ],
      queryParams: { tab: 'string' },
      description: '消息页',
    },
    {
      path: '/message/notice/:type',
      component: 'NoticePage',
      params: { type: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('notice-list', '互动通知列表')],
      uiStates: [
        {
          id: 'weibo.notice.base', search: {}, description: '互动通知(@我的/评论/赞)',
          actions: [
            { id: 'notice.filter.stub', label: '筛选▼(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '互动通知页',
    },
    {
      path: '/message/chat/:id',
      component: 'ChatPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('chat-messages', '会话消息流')],
      uiStates: [
        {
          id: 'weibo.chat.base', search: {}, description: '私信会话(陌生人=留言限制态)',
          actions: [
            { id: 'chat.text.input', label: '消息输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'chat.message.send', label: '发送→蓝气泡+会话置顶', behavior: 'submit' },
            { id: 'chat.emoji.open', label: '表情面板(浅版)', behavior: 'toggle' },
            { id: 'chat.tools.stub', label: '⭐/＋/🔈(暂未开放)', behavior: 'other' },
            { id: 'chat.card.stub', label: '摘要卡(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '私信会话页',
    },
    {
      path: '/message/settings',
      component: 'MessageSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('msg-settings', '消息设置列表')],
      uiStates: [
        {
          id: 'weibo.msgsettings.base', search: {}, description: '消息设置',
          actions: [
            { id: 'msgSettings.item.stub', label: '设置行(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '消息设置页',
    },
    {
      path: '/message/new',
      component: 'NewChatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('newchat-list', '联系人列表')],
      uiStates: [
        {
          id: 'weibo.newchat.base', search: {}, description: '发起聊天(单选联系人)',
          actions: [
            { id: 'newChat.group.stub', label: '新建群/已有群(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '发起聊天页',
    },
    // ---------------- 个人 ----------------
    {
      path: '/user/:id',
      component: 'ProfileOtherPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('profile-other', '他人主页')],
      uiStates: [
        {
          id: 'weibo.profileother.base', search: {}, description: '他人主页(tab=动态/微博/视频号/相册)',
          actions: [
            { id: 'profileOther.follow.submit', label: '+关注→toast关注成功+推荐区', behavior: 'submit', paramsSchema: { userId: 'string' } },
            { id: 'profileOther.followedMenu.open', label: '已关注→弹菜单', behavior: 'open' },
            { id: 'profileOther.tab.select.target', label: 'tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'profileOther.counts.stub', label: '粉丝/关注计数(暂未开放)', behavior: 'other' },
            { id: 'profileOther.more.stub', label: '右上…/搜索(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'weibo.profileother.followedMenu', search: { menu: 'followed' }, description: '已关注菜单(特别关注/分组/备注/取消关注)',
          actions: [
            { id: 'profileOther.unfollow.submit', label: '取消关注', behavior: 'submit', paramsSchema: { userId: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '他人主页',
    },
    {
      path: '/me/profile',
      component: 'ProfileSelfPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('profile-self', '自己主页')],
      uiStates: [
        {
          id: 'weibo.profileself.base', search: {}, description: '自己主页(tab=精选/微博/相册)',
          actions: [
            { id: 'profileSelf.tab.select.target', label: 'tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'profileSelf.edit.stub', label: '编辑资料/定时发博/筛选/＋(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '自己的主页',
    },
    {
      path: '/me/follows',
      component: 'FollowsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('follows-list', '关注列表')],
      uiStates: [
        {
          id: 'weibo.follows.base', search: {}, description: '关注列表(tab=关注的人/经常访问/推荐/超话)',
          actions: [
            { id: 'follows.tab.select.target', label: 'tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'follows.unfollowSheet.open', label: '已关注/互相关注→底部sheet', behavior: 'open', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'follows.refollow.submit', label: '✓回关(无确认)', behavior: 'submit', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'follows.follow.submit', label: '+关注(经常访问/推荐)', behavior: 'submit', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'follows.supertopicRow.follow', label: '+关注超话挂行', behavior: 'toggle', scope: 'item', paramsSchema: { supertopicId: 'string' } },
            { id: 'follows.widgetGuide.dismiss', label: '小组件引导-暂不添加', behavior: 'close' },
            { id: 'follows.search.input', label: '搜全部关注', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'follows.misc.stub', label: '四宫格/批量管理/发现用户(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'weibo.follows.unfollowSheet', search: { sheet: 'unfollow' }, description: '取消关注sheet',
          actions: [
            { id: 'follows.unfollowConfirm.open', label: 'sheet取消关注→二次确认弹窗', behavior: 'open' },
          ],
        },
        {
          id: 'weibo.follows.unfollowConfirm', search: { sheet: 'unfollow', confirm: 'open' }, description: '「确定不再关注?」弹窗',
          actions: [
            { id: 'follows.unfollow.submit', label: '确定→变✓回关', behavior: 'submit', paramsSchema: { userId: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string', uid: 'string' },
      description: '关注列表页',
    },
    {
      path: '/me/fans',
      component: 'FansPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('fans-list', '粉丝列表')],
      uiStates: [
        {
          id: 'weibo.fans.base', search: {}, description: '粉丝列表(tab=新的好友/全部粉丝)',
          actions: [
            { id: 'fans.tab.select.target', label: 'tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'fans.refollow.submit', label: '✓回关', behavior: 'submit', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'fans.recoFollow.submit', label: '推荐区+关注', behavior: 'submit', scope: 'item', paramsSchema: { userId: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '粉丝列表页',
    },
    // ---------------- 我 ----------------
    {
      path: '/me',
      component: 'MinePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('mine-scroll', '我页滚动区')],
      uiStates: [
        {
          id: 'weibo.mine.base', search: {}, description: '「我」页',
          actions: [
            { id: 'mine.visitors.stub', label: '访客计数(暂未开放)', behavior: 'other' },
            { id: 'mine.grid.stub', label: '宫格 相册/钱包/微博购/创作中心/粉丝头条(暂未开放)', behavior: 'other' },
            { id: 'mine.recoFollow.toggle', label: '为你推荐+关注', behavior: 'toggle', scope: 'item', paramsSchema: { userId: 'string' } },
            { id: 'mine.marketing.stub', label: '会员banner/任务/钱包/超友趣等(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '「我」页',
    },
    {
      path: '/me/posts',
      component: 'MyPostsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('myposts-list', '我的微博列表')],
      uiStates: [
        {
          id: 'weibo.myposts.base', search: {}, description: '我的微博(tab=全部/原创/视频/文章/图片)',
          actions: [
            { id: 'myPosts.tab.select.target', label: 'tab过滤', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'myPosts.misc.stub', label: '搜索/筛选/⚙(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '我的微博列表页',
    },
    {
      path: '/me/likes',
      component: 'MyLikesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('mylikes-list', '赞/收藏列表')],
      uiStates: [
        {
          id: 'weibo.mylikes.base', search: {}, description: '我的赞/收藏(tab=赞/收藏/视频/文章/问答/图片)',
          actions: [
            { id: 'myLikes.tab.select.target', label: 'tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'myLikes.deleted.remove', label: '已删除微博-删除', behavior: 'modify', scope: 'item', paramsSchema: { statusId: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '我的赞/收藏页',
    },
    {
      path: '/me/history',
      component: 'HistoryPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('history-list', '浏览记录')],
      uiStates: [{ id: 'weibo.history.base', search: {}, description: '浏览记录' }],
      queryParams: {},
      description: '浏览记录页',
    },
    {
      path: '/me/drafts',
      component: 'DraftsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('drafts-list', '草稿列表')],
      uiStates: [
        {
          id: 'weibo.drafts.base', search: {}, description: '草稿箱',
          actions: [
            { id: 'drafts.item.delete', label: '草稿删除', behavior: 'modify', scope: 'item', paramsSchema: { draftId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '草稿箱页',
    },
    {
      path: '/me/settings',
      component: 'SettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('settings-list', '设置列表')],
      uiStates: [
        {
          id: 'weibo.settings.base', search: {}, description: '设置页',
          actions: [
            { id: 'settings.logoutSheet.open', label: '退出当前账号→sheet', behavior: 'open' },
            { id: 'settings.item.stub', label: '其余设置项(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'weibo.settings.logoutSheet', search: { logout: 'confirm' }, description: '退出sheet',
          actions: [
            { id: 'settings.logout.submit', label: '退出→未登录首页', behavior: 'submit' },
            { id: 'settings.logoutSheet.close', label: '取消/遮罩收起', behavior: 'close' },
          ],
        },
      ],
      queryParams: {},
      description: '设置页',
    },
    {
      path: '/me/settings/account',
      component: 'AccountSettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('account-list', '账号管理列表')],
      uiStates: [{ id: 'weibo.account.base', search: {}, description: '账号管理',
        actions: [{ id: 'account.item.stub', label: '账号项(暂未开放)', behavior: 'other' }] }],
      queryParams: {}, description: '账号管理页',
    },
    {
      path: '/me/settings/security',
      component: 'SecuritySettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('security-list', '账号与安全列表')],
      uiStates: [{ id: 'weibo.security.base', search: {}, description: '账号与安全',
        actions: [
          { id: 'security.item.stub', label: '安全项(暂未开放)', behavior: 'other' },
          { id: 'security.loginProtect.toggle', label: '登录保护', behavior: 'toggle' },
          { id: 'security.accountProtect.toggle', label: '账号安全锁', behavior: 'toggle' },
        ] }],
      queryParams: {}, description: '账号与安全页',
    },
    {
      path: '/me/settings/notification',
      component: 'NotificationSettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('notif-list', '通知设置列表')],
      uiStates: [{ id: 'weibo.notif.base', search: {}, description: '通知设置',
        actions: [
          { id: 'notif.push.toggle', label: '推送总开关', behavior: 'toggle' },
          { id: 'notif.comment.toggle', label: '评论通知', behavior: 'toggle' },
          { id: 'notif.like.toggle', label: '赞通知', behavior: 'toggle' },
          { id: 'notif.at.toggle', label: '@通知', behavior: 'toggle' },
          { id: 'notif.dm.toggle', label: '私信通知', behavior: 'toggle' },
          { id: 'notif.fans.toggle', label: '粉丝通知', behavior: 'toggle' },
          { id: 'notif.dnd.toggle', label: '夜间免打扰', behavior: 'toggle' },
        ] }],
      queryParams: {}, description: '通知设置页',
    },
    {
      path: '/me/settings/navbar',
      component: 'NavBarSettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('navbar-list', '导航栏设置列表')],
      uiStates: [{ id: 'weibo.navbar.base', search: {}, description: '自定义导航栏',
        actions: [{ id: 'navbar.tab.select.target', label: '第二个标签', behavior: 'select', paramsSchema: { target: 'string' } }] }],
      queryParams: {}, description: '自定义导航栏页',
    },
    {
      path: '/me/settings/teen',
      component: 'TeenModePage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('teen-list', '未成年人模式')],
      uiStates: [{ id: 'weibo.teen.base', search: {}, description: '未成年人模式',
        actions: [{ id: 'teen.mode.toggle', label: '开启未成年人模式', behavior: 'toggle' }] }],
      queryParams: {}, description: '未成年人模式页',
    },
    {
      path: '/me/settings/care',
      component: 'CareModePage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('care-list', '关爱模式')],
      uiStates: [{ id: 'weibo.care.base', search: {}, description: '关爱模式',
        actions: [{ id: 'care.mode.toggle', label: '开启关爱模式', behavior: 'toggle' }] }],
      queryParams: {}, description: '关爱模式页',
    },
    {
      path: '/me/settings/help',
      component: 'HelpCenterPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('help-list', '客服中心')],
      uiStates: [{ id: 'weibo.help.base', search: {}, description: '客服中心',
        actions: [
          { id: 'help.faq.toggle', label: 'FAQ 展开', behavior: 'toggle' },
          { id: 'help.contact.stub', label: '人工客服/反馈(暂未开放)', behavior: 'other' },
        ] }],
      queryParams: {}, description: '客服中心页',
    },
    {
      path: '/me/settings/about',
      component: 'AboutSettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('about-list', '关于微博')],
      uiStates: [{ id: 'weibo.about.base', search: {}, description: '关于微博',
        actions: [
          { id: 'about.checkUpdate.submit', label: '检查更新', behavior: 'submit' },
          { id: 'about.item.stub', label: '协议/介绍(暂未开放)', behavior: 'other' },
        ] }],
      queryParams: {}, description: '关于微博页',
    },
    {
      path: '/me/settings/storage',
      component: 'StorageSettingsPage',
      params: {}, entryPoint: 'none',
      scrollContainers: [sc('storage-list', '存储空间')],
      uiStates: [{ id: 'weibo.storage.base', search: {}, description: '存储空间',
        actions: [
          { id: 'storage.clearCache.submit', label: '清理全部缓存', behavior: 'submit' },
          { id: 'storage.item.stub', label: '按天清理(暂未开放)', behavior: 'other' },
        ] }],
      queryParams: {}, description: '存储空间页',
    },
    {
      path: '/me/settings/privacy',
      component: 'PrivacySettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('privacy-list', '隐私设置列表')],
      uiStates: [
        {
          id: 'weibo.privacy.base', search: {}, description: '隐私设置',
          actions: [
            { id: 'privacy.visibility.select.target', label: '谁可以看我的微博', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'privacy.findByPhone.toggle', label: '手机号可被搜索', behavior: 'toggle' },
            { id: 'privacy.showLikes.toggle', label: '公开我的赞', behavior: 'toggle' },
            { id: 'privacy.allowStrangerDM.toggle', label: '允许陌生人私信', behavior: 'toggle' },
            { id: 'privacy.showRegion.toggle', label: '展示IP属地', behavior: 'toggle' },
            { id: 'privacy.publicFollowing.toggle', label: '公开关注列表', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '隐私设置页',
    },
    {
      path: '/me/settings/block',
      component: 'BlockSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('block-list', '屏蔽设置列表')],
      uiStates: [
        {
          id: 'weibo.block.base', search: {}, description: '屏蔽设置',
          actions: [
            { id: 'block.ads.toggle', label: '智能屏蔽广告', behavior: 'toggle' },
            { id: 'block.commentFilter.toggle', label: '过滤不友善评论', behavior: 'toggle' },
            { id: 'block.word.remove', label: '移除屏蔽词', behavior: 'modify', scope: 'item', paramsSchema: { word: 'string' } },
            { id: 'block.user.remove', label: '解除屏蔽用户', behavior: 'modify', scope: 'item', paramsSchema: { userId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '屏蔽设置页',
    },
    {
      path: '/me/settings/general',
      component: 'GeneralSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('general-list', '通用设置列表')],
      uiStates: [
        {
          id: 'weibo.general.base', search: {}, description: '通用设置',
          actions: [
            { id: 'general.fontSize.select.target', label: '字体大小', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'general.darkMode.select.target', label: '深色模式', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'general.videoAutoplay.select.target', label: '视频自动播放', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'general.trafficReminder.toggle', label: '非Wi-Fi播放提醒', behavior: 'toggle' },
            { id: 'general.clearCache.submit', label: '清理缓存', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '通用设置页',
    },
    {
      path: '/member',
      component: 'MemberPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('member-scroll', '会员权益')],
      uiStates: [
        {
          id: 'weibo.member.base', search: {}, description: '微博会员展示页',
          actions: [
            { id: 'member.purchase.stub', label: '开通(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '微博会员页',
    },
  ],
  transitions: [
    // ---- TabBar(chrome.tabbar) ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '首页 Tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.video-open', from: '*', to: '/video', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '视频 Tab', ui: { placement: 'tabbar', icon: 'video', gesture: 'tap' } },
    { id: 'tabbar.discover-open', from: '*', to: '/discover', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '发现 Tab', ui: { placement: 'tabbar', icon: 'search', gesture: 'tap' } },
    { id: 'tabbar.message-open', from: '*', to: '/message', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '消息 Tab', ui: { placement: 'tabbar', icon: 'mail', gesture: 'tap' } },
    { id: 'tabbar.me-open', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '我 Tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },

    // ---- 登录 ----
    { id: 'home.login-open', from: ['/', '/me'], to: '/login', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '未登录态左上「登录」', ui: { placement: 'topbar', icon: 'user', gesture: 'tap' } },
    { id: 'login.sms-open', from: '/login', to: '/login/sms', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '其他手机号码登录', ui: { placement: 'content', icon: 'phone', gesture: 'tap' } },
    { id: 'loginsms.home-open', from: '/login/sms', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '验证码登录成功→首页', ui: { placement: 'none', icon: 'home', gesture: 'tap' } },
    { id: 'settings.home-open', from: '/me/settings', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '退出登录→未登录首页', ui: { placement: 'none', icon: 'home', gesture: 'tap' } },

    // ---- 首页 ----
    { id: 'home.supertopicSquare-open', from: '/', to: '/supertopic/square', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '左上「超话」入口', ui: { placement: 'topbar', icon: 'hash', gesture: 'tap' } },
    { id: 'home.compose-open', from: { path: '/', search: { plus: 'open' } }, to: '/compose', search: { plus: null }, searchParams: {}, mode: 'push', params: {},
      label: '＋菜单-写微博', ui: { placement: 'content', icon: 'compose', gesture: 'tap' } },
    { id: 'home.status-open', from: '/', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '微博卡片→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('statuses', 'id', 'text') },
    { id: 'home.status-open-tab', from: '/', to: '/status/:id', search: {}, searchParams: { tab: 'string' }, mode: 'push', params: { id: 'string' },
      label: '卡片转发/评论图标→详情对应tab', ui: { placement: 'content', icon: 'comment', gesture: 'tap' } },
    { id: 'home.user-open', from: ['/', '/discover', '/supertopic/square'], to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '卡片头像/昵称→他人主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' }, dataSource: ds('users', 'id', 'name') },

    // ---- 发现/搜索 ----
    { id: 'discover.search-open', from: '/discover', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '发现页搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'discover.hotword-open', from: '/discover', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '热搜词条→结果页', ui: { placement: 'content', icon: 'hot', gesture: 'tap' } },
    { id: 'discover.hotFull-open', from: '/discover', to: '/discover/hot', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '更多热搜→完整榜单', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'discover.status-open', from: '/discover', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '发现页信息流卡片', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('statuses', 'id', 'text') },
    { id: 'hotFull.hotword-open', from: '/discover/hot', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '榜单词条→结果页', ui: { placement: 'content', icon: 'hot', gesture: 'tap' } },
    { id: 'search.submit-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '搜索按钮/回车/联想词', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'search.history-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '搜索历史词条', ui: { placement: 'content', icon: 'clock', gesture: 'tap' } },
    { id: 'search.hotword-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '猜你想搜词条', ui: { placement: 'content', icon: 'hot', gesture: 'tap' } },
    { id: 'search.suggestUser-open', from: '/search', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '联想用户行→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'searchResult.status-open', from: '/search/result', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '结果博文卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('statuses', 'id', 'text') },
    { id: 'searchResult.user-open', from: '/search/result', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '用户tab行→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'searchResult.topic-open', from: '/search/result', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '话题tab词条→话题态结果页', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'searchResult.supertopic-open', from: '/search/result', to: '/supertopic/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '超话tab行→超话主页', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'searchResult.compose-open', from: '/search/result', to: '/compose', search: {}, searchParams: { topic: 'string' }, mode: 'push', params: {},
      label: '底部讨论→发博(预填话题)', ui: { placement: 'content', icon: 'compose', gesture: 'tap' } },
    { id: 'searchResult.search-reopen', from: '/search/result', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '搜索框再聚焦', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'searchResult.query-clear', from: '/search/result', to: '/search', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '×清除词→中间页', ui: { placement: 'topbar', icon: 'close', gesture: 'tap' } },

    // ---- 详情 ----
    { id: 'status.repost-open', from: '/status/:id', to: '/repost/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '底栏转发→编辑页', ui: { placement: 'content', icon: 'repost', gesture: 'tap' } },
    { id: 'status.replies-open', from: '/status/:id', to: '/status/:id/replies/:cid', search: {}, searchParams: {}, mode: 'push', params: { id: 'string', cid: 'string' },
      label: '共N条回复→全屏', ui: { placement: 'content', icon: 'comment', gesture: 'tap' } },
    { id: 'status.searchword-open', from: '/status/:id', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '大家都在搜chips', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'status.topiclink-open', from: '/status/:id', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '正文话题蓝链', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'status.user-open', from: '/status/:id', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '博主头像/昵称→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'status.image-open', from: '/status/:id', to: '/status/:id/image/:idx', search: {}, searchParams: {}, mode: 'push', params: { id: 'string', idx: 'string' },
      label: '图片→大图查看', ui: { placement: 'content', icon: 'image', gesture: 'tap' } },

    // ---- 转发编辑页 ----
    { id: 'repost.mention-open', from: '/repost/:id', to: '/compose/mention', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {},
      label: '工具@→联系人', ui: { placement: 'content', icon: 'at', gesture: 'tap' } },
    { id: 'repost.topic-open', from: '/repost/:id', to: '/compose/topic', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {},
      label: '工具#→话题', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'repost.visibility-open', from: '/repost/:id', to: '/compose/visibility', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {},
      label: '公开→分享范围', ui: { placement: 'content', icon: 'lock', gesture: 'tap' } },

    // ---- 发博 ----
    { id: 'compose.topic-open', from: '/compose', to: '/compose/topic', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '工具#→话题选择', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'compose.mention-open', from: '/compose', to: '/compose/mention', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '工具@→联系人选择', ui: { placement: 'content', icon: 'at', gesture: 'tap' } },
    { id: 'compose.image-open', from: '/compose', to: '/compose/images', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '工具图片→相册', ui: { placement: 'content', icon: 'image', gesture: 'tap' } },
    { id: 'compose.image-add', from: '/compose', to: '/compose/images', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '虚线+格→相册', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    { id: 'compose.supertopic-open', from: '/compose', to: '/compose/supertopic', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '选项条超话→超话选择', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'compose.visibility-open', from: '/compose', to: '/compose/visibility', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '选项条公开→分享范围', ui: { placement: 'content', icon: 'lock', gesture: 'tap' } },

    // ---- 超话 ----
    { id: 'supertopicSquare.status-open', from: '/supertopic/square', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '社区帖子卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'supertopicSquare.supertopic-open', from: '/supertopic/square', to: '/supertopic/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '我的超话卡→主页', ui: { placement: 'content', icon: 'hash', gesture: 'tap' }, dataSource: ds('supertopics', 'id', 'name') },
    { id: 'supertopicSquare.postSupertopic-open', from: '/supertopic/square', to: '/supertopic/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '帖子◇超话名前缀→主页', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'supertopicSquare.search-open', from: '/supertopic/square', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '社区搜索图标', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'supertopic.compose-open', from: '/supertopic/:id', to: '/supertopic/:id/compose', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '我来发一帖→超话发帖', ui: { placement: 'content', icon: 'compose', gesture: 'tap' } },
    { id: 'supertopic.status-open', from: '/supertopic/:id', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '超话帖子卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'supertopic.user-open', from: '/supertopic/:id', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '帖子作者头像→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'stCompose.mention-open', from: '/supertopic/:id/compose', to: '/compose/mention', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {},
      label: '工具@/#/图片(复用compose子页)', ui: { placement: 'content', icon: 'at', gesture: 'tap' } },

    // ---- 消息 ----
    { id: 'message.atme-open', from: '/message', to: '/message/notice/:type', search: {}, searchParams: {}, mode: 'push', params: { type: 'string' },
      label: '@我的 行', ui: { placement: 'content', icon: 'at', gesture: 'tap' } },
    { id: 'message.comments-open', from: '/message', to: '/message/notice/:type', search: {}, searchParams: {}, mode: 'push', params: { type: 'string' },
      label: '评论 行', ui: { placement: 'content', icon: 'comment', gesture: 'tap' } },
    { id: 'message.likes-open', from: '/message', to: '/message/notice/:type', search: {}, searchParams: {}, mode: 'push', params: { type: 'string' },
      label: '赞 行', ui: { placement: 'content', icon: 'like', gesture: 'tap' } },
    { id: 'message.chat-open', from: '/message', to: '/message/chat/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '会话行→私信', ui: { placement: 'content', icon: 'chat', gesture: 'tap' }, dataSource: ds('chats', 'id', 'name') },
    { id: 'message.settings-open', from: { path: '/message', search: { menu: 'gear' } }, to: '/message/settings', search: { menu: null }, searchParams: {}, mode: 'push', params: {},
      label: '⚙菜单-消息设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'message.newChat-open', from: { path: '/message', search: { menu: 'gear' } }, to: '/message/new', search: { menu: null }, searchParams: {}, mode: 'push', params: {},
      label: '⚙菜单-发起聊天', ui: { placement: 'content', icon: 'chat', gesture: 'tap' } },
    { id: 'notice.status-open', from: '/message/notice/:type', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '通知行→对应博文', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'newChat.chat-open', from: '/message/new', to: '/message/chat/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '选联系人→聊天', ui: { placement: 'content', icon: 'chat', gesture: 'tap' } },

    // ---- 个人域 ----
    { id: 'profileOther.chat-open', from: '/user/:id', to: '/message/chat/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '私信按钮→会话', ui: { placement: 'content', icon: 'chat', gesture: 'tap' } },
    { id: 'profileOther.status-open', from: '/user/:id', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '微博tab卡片→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'profileOther.supertopic-open', from: '/user/:id', to: '/supertopic/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '参与的超话行→超话主页', ui: { placement: 'content', icon: 'hash', gesture: 'tap' } },
    { id: 'profileSelf.drafts-open', from: '/me/profile', to: '/me/drafts', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '草稿箱入口', ui: { placement: 'content', icon: 'draft', gesture: 'tap' } },
    { id: 'profileSelf.status-open', from: '/me/profile', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '自己微博卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'follows.user-open', from: '/me/follows', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '用户行→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'fans.user-open', from: '/me/fans', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '粉丝行→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },

    // ---- 我页 ----
    { id: 'mine.profile-open', from: '/me', to: '/me/profile', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '头像/昵称→自己主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'mine.myPosts-open', from: '/me', to: '/me/posts', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '计数微博→我的微博', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'mine.follows-open', from: '/me', to: '/me/follows', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '计数关注→关注列表', ui: { placement: 'content', icon: 'users', gesture: 'tap' } },
    { id: 'mine.fans-open', from: '/me', to: '/me/fans', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '计数粉丝→粉丝列表', ui: { placement: 'content', icon: 'users', gesture: 'tap' } },
    { id: 'mine.likes-open', from: '/me', to: '/me/likes', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '宫格赞/收藏', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'mine.drafts-open', from: '/me', to: '/me/drafts', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '宫格草稿箱', ui: { placement: 'content', icon: 'draft', gesture: 'tap' } },
    { id: 'mine.history-open', from: '/me', to: '/me/history', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '宫格浏览记录', ui: { placement: 'content', icon: 'clock', gesture: 'tap' } },
    { id: 'mine.settings-open', from: '/me', to: '/me/settings', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '⚙设置', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },
    { id: 'settings.privacy-open', from: '/me/settings', to: '/me/settings/privacy', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '隐私设置', ui: { placement: 'content', icon: 'lock', gesture: 'tap' } },
    { id: 'settings.block-open', from: '/me/settings', to: '/me/settings/block', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '屏蔽设置', ui: { placement: 'content', icon: 'shield', gesture: 'tap' } },
    { id: 'settings.general-open', from: '/me/settings', to: '/me/settings/general', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '通用设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'settings.account-open', from: '/me/settings', to: '/me/settings/account', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '账号管理', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'settings.security-open', from: '/me/settings', to: '/me/settings/security', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '账号与安全', ui: { placement: 'content', icon: 'shield', gesture: 'tap' } },
    { id: 'settings.notification-open', from: '/me/settings', to: '/me/settings/notification', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '通知设置', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'settings.navbar-open', from: '/me/settings', to: '/me/settings/navbar', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '自定义导航栏', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'settings.teen-open', from: '/me/settings', to: '/me/settings/teen', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '未成年人模式', ui: { placement: 'content', icon: 'shield', gesture: 'tap' } },
    { id: 'settings.care-open', from: '/me/settings', to: '/me/settings/care', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '关爱模式', ui: { placement: 'content', icon: 'heart', gesture: 'tap' } },
    { id: 'settings.help-open', from: '/me/settings', to: '/me/settings/help', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '客服中心', ui: { placement: 'content', icon: 'help', gesture: 'tap' } },
    { id: 'settings.about-open', from: '/me/settings', to: '/me/settings/about', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '关于微博', ui: { placement: 'content', icon: 'info', gesture: 'tap' } },
    { id: 'settings.storage-open', from: '/me/settings', to: '/me/settings/storage', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '存储空间', ui: { placement: 'content', icon: 'database', gesture: 'tap' } },
    { id: 'settings.member-open', from: '/me/settings', to: '/member', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '会员专属设置→会员页', ui: { placement: 'content', icon: 'crown', gesture: 'tap' } },
    { id: 'mine.supertopic-open', from: '/me', to: '/supertopic/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '超话社区横滑卡', ui: { placement: 'content', icon: 'hash', gesture: 'tap' }, dataSource: ds('supertopics', 'id', 'name') },
    { id: 'mine.visitedUser-open', from: '/me', to: '/user/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '访问记录头像→主页', ui: { placement: 'content', icon: 'avatar', gesture: 'tap' } },
    { id: 'myPosts.status-open', from: '/me/posts', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '博文卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'myLikes.status-open', from: '/me/likes', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '博文卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'history.status-open', from: '/me/history', to: '/status/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '记录卡→详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'drafts.compose-open', from: '/me/drafts', to: '/compose', search: {}, searchParams: { draft: 'string' }, mode: 'push', params: {},
      label: '草稿行→回填发博', ui: { placement: 'content', icon: 'compose', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];

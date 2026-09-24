# BilibiliV2 Use Cases

### UC-BILI-01: 打开视频详情
- Transition ID: `video.open`
- 触发元素: `data-trigger="video.open"`
- 触发方式: 点击首页、热门、动态、搜索、收藏中的视频卡片
- 前置条件: 位于任意页面且存在视频卡片
- 主成功场景: 点击视频卡片后进入 `/video/:videoId`
- 判题条件: 当前路径为 `/video/<id>` 且页面展示标题、播放器和互动区
- Priority: P0

### UC-BILI-02: 切换主 Tab
- Transition ID: `tab.home` / `tab.hot` / `tab.dynamic` / `tab.message` / `tab.me`
- 触发元素: 底部 Tab 的 `data-trigger`
- 触发方式: 点击底部导航项
- 前置条件: App 已打开
- 主成功场景: 页面内容切换，底部高亮随路径更新
- 判题条件: 当前路径等于目标 Tab 路径
- Priority: P0

### UC-BILI-03: 搜索视频
- Transition ID: `search.open`
- Action ID: `search.query.input`
- 触发元素: 顶栏搜索按钮、搜索输入框、搜索按钮
- 触发方式: 点击搜索入口，输入关键词并点击搜索
- 主成功场景: 搜索历史记录新增关键词，结果列表按标题和标签过滤
- 判题条件: `searchHistory[0]` 等于输入关键词
- Priority: P0

### UC-BILI-04: 点赞/投币/收藏视频
- Action ID: `video.like.toggle` / `video.coin.add` / `video.favorite.toggle`
- 触发元素: 视频详情页互动按钮
- 触发方式: 点击按钮
- 主成功场景: store 中对应 id 列表变化，计数同步更新
- 判题条件: `likedVideoIds`、`coinedVideoIds`、`favoriteVideoIds` 包含或移除目标视频
- Priority: P0

### UC-BILI-05: 发送评论
- Action ID: `video.comment.submit`
- 触发元素: 视频详情页评论发送按钮
- 触发方式: 输入评论文本并点击发送
- 主成功场景: 评论列表新增本人评论，视频评论数增加
- 判题条件: `comments[0].userId === "me"`
- Priority: P0

### UC-BILI-06: 关注 UP 主
- Transition ID: `user.open`
- Action ID: `user.follow.toggle`
- 触发元素: UP 主头像/名字、UP 主空间关注按钮
- 触发方式: 点击视频详情中的 UP 主信息进入空间，再点击关注
- 主成功场景: `followedUserIds` 加入或移除目标 UP 主
- Priority: P1

### UC-BILI-07: 发布动态
- Transition ID: `publish.open`
- Action ID: `publish.dynamic.submit`
- 触发元素: 底部发布按钮、发布页提交按钮
- 触发方式: 点击发布，输入文本，点击发布
- 主成功场景: 动态流新增本人动态
- 判题条件: `dynamics[0].userId === "me"`
- Priority: P1

### UC-BILI-08: 消息全部已读
- Action ID: `message.readAll.submit`
- 触发元素: 消息页右上角“已读”
- 触发方式: 点击按钮
- 主成功场景: 所有消息 unread 归零
- Priority: P1

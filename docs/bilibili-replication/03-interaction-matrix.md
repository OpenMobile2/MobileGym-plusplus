# Interaction Matrix

| UC | Use Case | Entry Route | Trigger | Transition / Action ID | Target Route | Status |
|---|---|---|---|---|---|---|
| UC-BILI-01 | 打开视频详情 | `*` | 点击视频卡片 | `video.open` | `/video/:videoId` | ✅ |
| UC-BILI-02 | 切换首页 | `*` | 点击底部首页 | `tab.home` | `/` | ✅ |
| UC-BILI-02 | 切换热门 | `*` | 点击底部热门 | `tab.hot` | `/hot` | ✅ |
| UC-BILI-02 | 切换动态 | `*` | 点击底部动态 | `tab.dynamic` | `/dynamic` | ✅ |
| UC-BILI-02 | 切换消息 | `*` | 点击消息入口或底部消息 | `tab.message` | `/message` | ✅ |
| UC-BILI-02 | 切换我的 | `*` | 点击底部我的 | `tab.me` | `/me` | ✅ |
| UC-BILI-03 | 打开搜索 | `*` | 点击顶栏搜索 | `search.open` | `/search` | ✅ |
| UC-BILI-03 | 输入搜索 | `/search` | 输入框/搜索按钮 | `search.query.input` | `/search` | ✅ |
| UC-BILI-04 | 点赞视频 | `/video/:videoId` | 点击点赞 | `video.like.toggle` | 原地 | ✅ |
| UC-BILI-04 | 投币视频 | `/video/:videoId` | 点击投币 | `video.coin.add` | 原地 | ✅ |
| UC-BILI-04 | 收藏视频 | `/video/:videoId` | 点击收藏 | `video.favorite.toggle` | 原地 | ✅ |
| UC-BILI-05 | 发送评论 | `/video/:videoId` | 输入评论并点击发送 | `video.comment.submit` | 原地 | ✅ |
| UC-BILI-06 | 打开 UP 主空间 | `*` | 点击 UP 主信息 | `user.open` | `/user/:userId` | ✅ |
| UC-BILI-06 | 关注 UP 主 | `/user/:userId` | 点击关注 | `user.follow.toggle` | 原地 | ✅ |
| UC-BILI-07 | 打开发布页 | `*` | 点击底部发布 | `publish.open` | `/publish` | ✅ |
| UC-BILI-07 | 发布动态 | `/publish` | 输入文本并点击发布 | `publish.dynamic.submit` | `/dynamic` | ✅ |
| UC-BILI-08 | 全部已读 | `/message` | 点击右上角已读 | `message.readAll.submit` | 原地 | ✅ |

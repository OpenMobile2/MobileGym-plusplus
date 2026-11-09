# 瑞幸生成素材记录

- 生成日期：2026-07-26
- 模型：`gpt-image-2`
- 接口：TokenHub 的 OpenAI 兼容 Image API
- 提示词：`gpt-image-2-prompts.jsonl`
- 输出：1 张首页活动图、6 张饮品图、5 张即享商品图，共 12 张 PNG
- 安全约束：仅向图片接口发送文字提示词，不上传 `luckin_images` 或视觉对比截图；图片不包含真实商标、文字或水印
- 本地凭据：仓库根目录 `.env`，已被 `.gitignore` 排除，禁止提交或复制到文档
- 接入位置：`components/ui.tsx` 的 `PRODUCT_IMAGES`，以及 `pages/MainPages.tsx` 的首页与商品详情头图
- 生成后必须重跑瑞幸定向 TypeScript、运行时 P0 链路和视觉对比截图

# 个人技术博客 - 设计规格说明书

> 日期：2026-06-02
> 状态：已确认

## 1. 项目概述

一个个人技术博客网站，用于每日学习总结和知识点分享。核心工作流：**飞书写作 → 粘贴到发布助手 → AI 整理 → 一键发布到 GitHub Pages**。

## 2. 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 博客前端 | VitePress | 静态站点生成，Markdown 渲染 |
| 发布工具 | Vue 3 + Vite SPA | 粘贴飞书内容 + AI 整理 + 发布 |
| AI 代理 | Cloudflare Workers | 调用 DeepSeek API |
| AI 模型 | DeepSeek | 内容整理、摘要生成、对话 |
| CI/CD | GitHub Actions | 自动构建部署 |
| 托管 | GitHub Pages | 博客 + 发布工具静态托管 |
| 认证 | 无（URL 隐藏） | 发布工具不公开链接 |

## 3. 项目结构

```
ty_blog/
├── blog/                        # VitePress 公开博客
│   ├── .vitepress/              # VitePress 配置（主题、导航、插件）
│   ├── posts/                   # 文章 Markdown 文件（Git 托管的内容源）
│   │   ├── 2026-06-02-xxx.md
│   │   └── ...
│   ├── public/                  # 静态资源（图片等）
│   ├── index.md                 # 首页
│   └── about.md                 # 关于页
├── admin/                       # 发布助手 SPA
│   ├── src/
│   │   ├── App.vue              # 主布局
│   │   ├── main.ts
│   │   ├── components/
│   │   │   ├── PasteArea.vue    # 粘贴区域（飞书内容输入）
│   │   │   ├── PreviewPanel.vue # AI 整理结果预览
│   │   │   ├── AiActions.vue    # AI 操作按钮组
│   │   │   └── PublishModal.vue # 发布确认弹窗
│   │   ├── api/
│   │   │   ├── worker.ts        # Workers API 调用
│   │   │   └── github.ts        # GitHub API 调用（提交文章）
│   │   └── utils/
│   │       └── config.ts        # 配置（API 地址等）
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── worker/                      # Cloudflare Workers
│   ├── src/
│   │   └── index.ts             # 路由处理
│   ├── wrangler.toml            # Workers 配置
│   └── package.json
├── .github/workflows/
│   └── deploy.yml               # 自动构建部署
└── docs/
    └── superpowers/
        └── specs/               # 设计文档
```

## 4. 功能规格

### 4.1 VitePress 博客

**首页：**
- 个人简介（头像、一句话介绍、社交链接）
- 最新文章列表（分页，每页 10 篇）
- 按标签筛选文章
- 深色模式切换

**文章页：**
- Markdown 渲染（代码高亮 Shiki、数学公式 KaTeX）
- 标签展示
- 阅读时间估算
- AI 摘要区域（文章顶部，可折叠）
- 上下篇导航

**其他页面：**
- 关于页
- 标签聚合页
- RSS 订阅

### 4.2 发布助手（Admin SPA）

**布局：** 左右分栏
- 左侧：粘贴区域 + AI 操作按钮
- 右侧：预览面板 + 手动微调 + 发布按钮

**功能流程：**

1. 用户将飞书文档导出为 Markdown，粘贴到左侧区域
2. 点击「AI 整理」按钮，触发 Cloudflare Workers `/api/organize`
3. Workers 调用 DeepSeek API 进行：
   - Markdown 格式化排版
   - 生成 200 字左右摘要
   - 提取 3-5 个标签
   - 建议与已有文章的知识关联
4. 结果展示在右侧预览面板
5. 用户可手动微调 Markdown、摘要、标签
6. 点击「发布」，通过 GitHub API 将 Markdown 文件提交到 `blog/posts/YYYY-MM-DD-slug.md`
7. GitHub Actions 自动构建部署

### 4.3 AI 代理（Cloudflare Workers）

**端点：**

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/organize` | 接收原始 Markdown，返回整理后的内容 |
| POST | `/api/chat` | 对当前文章进行对话提问 |

**请求格式：**

```
POST /api/organize
{
  "content": "飞书导出的原始 Markdown",
  "preferences": {
    "tagStyle": "technical",  // 标签风格偏好
    "language": "zh-CN"
  }
}

Response:
{
  "markdown": "整理后的 Markdown",
  "summary": "200字摘要",
  "tags": ["JavaScript", "Async", "Promise"],
  "relatedSuggestions": ["之前相关的文章标题或建议"]
}
```

```
POST /api/chat
{
  "articleContent": "当前文章内容",
  "question": "用户的问题"
}

Response:
{
  "answer": "AI 回答"
}
```

**安全：** DeepSeek API Key 存储在 Workers 环境变量中，不外泄。

### 4.4 CI/CD

- 触发条件：`blog/` 目录有变更
- 流程：Checkout → Setup Node.js → 安装依赖 → `vitepress build` → 部署到 GitHub Pages
- 使用 `peaceiris/actions-gh-pages` action

## 5. 数据流

```
飞书写作（Markdown 导出）
      │
      ▼
┌──────────┐    POST /api/organize    ┌──────────────┐    DeepSeek API
│ 发布助手  │ ───────────────────────→ │ CF Workers    │ ──────────────→
│ (Admin)  │ ←─────────────────────── │               │ ←──────────────
└────┬─────┘    {markdown, tags...}   └──────────────┘
     │
     │ GitHub API (PUT 文件内容)
     ▼
┌──────────┐
│ Git Repo │ ──→ GitHub Actions ──→ GitHub Pages (VitePress)
└──────────┘
```

## 6. 非功能需求

- **性能：** VitePress 构建 < 30s，页面 Lighthouse Score > 90
- **安全：** API Key 仅存 Workers 环境变量，前端无敏感信息泄漏
- **可维护性：** monorepo 单仓库管理，各模块独立 package.json
- **成本：** 全部使用免费服务（GitHub Pages、GitHub Actions、Cloudflare Workers 免费层、DeepSeek 免费额度）

## 7. 不包含的功能（明确排除）

- 评论系统
- SEO 专项优化（VitePress 默认支持基础 SEO 已足够）
- 用户系统 / 登录系统
- 分析统计（Google Analytics 等）
- 邮件订阅

# 个人技术博客 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的个人技术博客系统：VitePress 静态博客 + Vue3 发布助手 + Cloudflare Workers AI 代理。

**Architecture:** Monorepo 三模块结构。blog/ 为 VitePress 静态站点；admin/ 为发布助手 SPA（粘贴飞书内容 → AI 整理 → 发布）；worker/ 为 Cloudflare Workers AI 代理（调用 DeepSeek API）。所有模块独立 package.json，通过 GitHub Actions 自动部署。

**Tech Stack:** VitePress, Vue 3 + Vite, TypeScript, Cloudflare Workers, DeepSeek API, GitHub Pages, GitHub Actions

---

## 文件结构总览

```
ty_blog/
├── .gitignore
├── README.md
├── blog/
│   ├── package.json
│   ├── .vitepress/
│   │   └── config.ts          # 主题/导航/插件配置
│   ├── posts/
│   │   └── .gitkeep
│   ├── public/
│   │   └── admin/              # admin 构建产物放这里
│   ├── index.md                # 首页（文章列表）
│   └── about.md                # 关于页
├── admin/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── App.vue             # 左右分栏主布局
│       ├── style.css           # 全局样式
│       ├── components/
│       │   ├── PasteArea.vue   # 飞书内容粘贴区
│       │   ├── PreviewPanel.vue# AI 整理结果预览+编辑
│       │   ├── AiActions.vue   # AI 操作按钮组
│       │   └── ChatPanel.vue   # AI 对话面板
│       ├── api/
│       │   ├── worker.ts       # Workers API 调用
│       │   └── github.ts       # GitHub API 提交
│       └── types/
│           └── index.ts        # 共享类型定义
├── worker/
│   ├── package.json
│   ├── wrangler.toml
│   └── src/
│       └── index.ts            # 路由 + DeepSeek 调用
└── .github/workflows/
    └── deploy.yml
```

---

### Task 1: 项目初始化 - Git 仓库与根目录配置

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: 创建 .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.output/
.vitepress/dist/
.vitepress/cache/
.env
.DS_Store
*.log
EOF
```

- [ ] **Step 2: 创建 README.md**

```bash
cat > README.md << 'EOF'
# ty_blog

个人技术博客 — 飞书写作 → AI 整理 → 一键发布。

## 结构

- `blog/` — VitePress 静态博客
- `admin/` — 发布助手 SPA
- `worker/` — Cloudflare Workers AI 代理

## 使用

1. 在飞书写笔记，导出 Markdown
2. 打开发布助手页面，粘贴内容
3. AI 整理排版、生成摘要和标签
4. 一键发布到 GitHub Pages
EOF
```

- [ ] **Step 3: 初始化 Git 仓库并提交**

```bash
git init
git add .gitignore README.md
git commit -m "chore: init project scaffold"
```

---

### Task 2: VitePress 博客初始化

**Files:**
- Create: `blog/package.json`
- Create: `blog/.vitepress/config.ts`
- Create: `blog/index.md`
- Create: `blog/about.md`
- Create: `blog/posts/.gitkeep`

- [ ] **Step 1: 创建 blog/package.json**

```json
{
  "name": "ty-blog",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.4.0",
    "markdown-it-mathjax3": "^4.3.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd blog && npm install
```

- [ ] **Step 3: 创建 blog/.vitepress/config.ts**

```typescript
import { defineConfig, type SiteConfig } from 'vitepress'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

function generateRSS(config: SiteConfig) {
  const { pages } = config
  const posts = pages
    .filter(p => p.startsWith('/posts/') && p !== '/posts/')
    .map(p => ({
      title: p.replace('/posts/', '').replace('.html', ''),
      url: p,
      date: '',
    }))

  const items = posts.map(p =>
    `<item>
      <title>${p.title}</title>
      <link>https://YOUR_USERNAME.github.io/ty_blog${p.url}</link>
      <guid>https://YOUR_USERNAME.github.io/ty_blog${p.url}</guid>
    </item>`
  ).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>ty_blog</title>
  <link>https://YOUR_USERNAME.github.io/ty_blog</link>
  <description>个人技术博客 - 每日学习总结与分享</description>
  <language>zh-CN</language>
  ${items}
</channel>
</rss>`

  writeFileSync(join(config.outDir, 'rss.xml'), rss)
}

export default defineConfig({
  title: 'ty_blog',
  description: '个人技术博客 - 每日学习总结与分享',
  lang: 'zh-CN',
  base: '/ty_blog/',
  markdown: {
    math: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  buildEnd: generateRSS,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '标签', link: '/tags' },
      { text: '关于', link: '/about' },
    ],
    search: {
      provider: 'local',
    },
    darkModeSwitchLabel: '深色模式',
    sidebar: false,
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' },
    ],
  },
})
```

- [ ] **Step 4: 创建 blog/index.md（首页）**

```markdown
---
layout: home

hero:
  name: "ty_blog"
  text: "每日学习 · 持续积累"
  tagline: 记录技术成长路上的每一个知识点
  actions:
    - theme: brand
      text: 浏览文章
      link: /posts/
    - theme: alt
      text: 关于我
      link: /about
---

<script setup>
import { data as posts } from './.vitepress/theme/posts.data.ts'
</script>

## 最新文章

<ul>
  <li v-for="post of posts" :key="post.url">
    <a :href="post.url">{{ post.frontmatter.date }} — {{ post.frontmatter.title }}</a>
    <span v-if="post.frontmatter.tags" style="color: #888; font-size: 0.85em;">
      | {{ post.frontmatter.tags.join(', ') }}
    </span>
  </li>
</ul>
```

- [ ] **Step 5: 创建 blog/.vitepress/theme/posts.data.ts（文章数据加载器）**

```typescript
import { createContentLoader } from 'vitepress'

export default createContentLoader('posts/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(raw) {
    return raw
      .filter(page => page.url !== '/posts/')
      .map(page => ({
        url: page.url,
        frontmatter: page.frontmatter,
      }))
      .sort((a, b) => {
        const dateA = a.frontmatter.date || ''
        const dateB = b.frontmatter.date || ''
        return dateB.localeCompare(dateA)
      })
  },
})
```

- [ ] **Step 6: 创建 blog/about.md**

```markdown
# 关于我

👋 你好，我是 [你的名字]。

这里记录我的每日技术学习笔记、思考和总结。

## 关于这个博客

- ✍️ 在飞书中写作
- 🤖 AI 辅助整理和总结
- 🚀 一键发布到 GitHub Pages
```

- [ ] **Step 7: 创建 posts 目录并保留**

```bash
mkdir -p blog/posts && touch blog/posts/.gitkeep
```

- [ ] **Step 8: 验证博客能启动**

```bash
cd blog && npx vitepress dev
```
预期：浏览器打开 http://localhost:5173 能看到首页

- [ ] **Step 9: 提交**

```bash
git add blog/ && git commit -m "feat: init VitePress blog scaffold"
```

---

### Task 3: VitePress 文章配置与样式

**Files:**
- Create: `blog/posts/hello-world.md`
- Modify: `blog/.vitepress/config.ts`

- [ ] **Step 1: 创建示例文章 blog/posts/hello-world.md**

```markdown
---
title: Hello World — 博客上线
date: 2026-06-02
tags:
  - 随笔
summary: 第一篇测试文章，验证博客系统正常运行。
---

# Hello World

这是我的第一篇博客文章 🎉

## 代码测试

```javascript
const greeting = 'Hello, World!'
console.log(greeting)
```

## 数学公式测试

$$
E = mc^2
$$
```

- [ ] **Step 2: 为 VitePress 配置添加文章列表页面**

修改 `blog/.vitepress/config.ts`，在 `themeConfig` 中增加：

```typescript
// 在 nav 之前，确保已有标签页面路由
// 完整 config.ts 已在 Task 2 中定义，此处无需额外修改
```

- [ ] **Step 3: 验证文章页面渲染**

```bash
cd blog && npx vitepress dev
```
访问 http://localhost:5173/posts/hello-world 确认渲染正常

- [ ] **Step 4: 提交**

```bash
git add blog/posts/hello-world.md && git commit -m "feat: add sample post and verify rendering"
```

---

### Task 3.5: VitePress — 标签页与 RSS

**Files:**
- Create: `blog/tags.md`
- Create: `blog/.vitepress/theme/tags.data.ts`

- [ ] **Step 1: 创建标签数据加载器 blog/.vitepress/theme/tags.data.ts**

```typescript
import { createContentLoader } from 'vitepress'

interface TaggedPost {
  url: string
  title: string
  date: string
}

export default createContentLoader('posts/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(raw) {
    const tagMap = new Map<string, TaggedPost[]>()
    raw
      .filter(page => page.url !== '/posts/')
      .forEach(page => {
        const tags: string[] = page.frontmatter.tags || []
        tags.forEach(tag => {
          if (!tagMap.has(tag)) tagMap.set(tag, [])
          tagMap.get(tag)!.push({
            url: page.url,
            title: page.frontmatter.title || '',
            date: page.frontmatter.date || '',
          })
        })
      })
    // Sort posts within each tag by date descending
    for (const [, posts] of tagMap) {
      posts.sort((a, b) => b.date.localeCompare(a.date))
    }
    return Array.from(tagMap.entries())
      .map(([tag, posts]) => ({ tag, count: posts.length, posts }))
      .sort((a, b) => b.count - a.count)
  },
})
```

- [ ] **Step 2: 创建标签页 blog/tags.md**

```markdown
---
layout: page
---

<script setup>
import { data as tags } from './.vitepress/theme/tags.data.ts'
</script>

# 🏷️ 标签

<div class="tag-cloud">
  <span
    v-for="{ tag, count, posts } in tags"
    :key="tag"
    class="tag-item"
  >
    <strong>{{ tag }}</strong> ({{ count }})
    <ul>
      <li v-for="post in posts" :key="post.url">
        <a :href="post.url">{{ post.date }} — {{ post.title }}</a>
      </li>
    </ul>
  </span>
</div>

<style>
.tag-cloud {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-item {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 12px 16px;
}

.tag-item strong {
  font-size: 16px;
  color: var(--vp-c-brand);
}

.tag-item ul {
  margin-top: 8px;
  padding-left: 16px;
}

.tag-item li {
  font-size: 14px;
  line-height: 1.8;
}
</style>
```

- [ ] **Step 3: 提交**

```bash
git add blog/tags.md blog/.vitepress/theme/tags.data.ts && git commit -m "feat: add tags page and tag data loader"
```

---

### Task 4: Cloudflare Workers 初始化

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.toml`
- Create: `worker/tsconfig.json`

- [ ] **Step 1: 创建 worker/package.json**

```json
{
  "name": "ty-blog-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240529.0",
    "wrangler": "^3.58.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd worker && npm install
```

- [ ] **Step 3: 创建 worker/wrangler.toml**

```toml
name = "ty-blog-worker"
main = "src/index.ts"
compatibility_date = "2024-06-01"

[vars]
DEEPSEEK_API_KEY = ""  # 部署时通过 wrangler secret 设置
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

[[kv_namespaces]]
binding = "KV_STORE"
id = ""  # 部署时创建
```

- [ ] **Step 4: 创建 worker/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 提交**

```bash
git add worker/ && git commit -m "feat: init Cloudflare Worker scaffold"
```

---

### Task 5: Cloudflare Workers — AI 接口实现

**Files:**
- Create: `worker/src/index.ts`

- [ ] **Step 1: 创建 worker/src/index.ts**

```typescript
export interface Env {
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
}

interface OrganizeRequest {
  content: string
  preferences?: {
    tagStyle?: string
    language?: string
  }
}

interface ChatRequest {
  articleContent: string
  question: string
}

const SYSTEM_PROMPT_ORGANIZE = `你是一个技术博客编辑助手。用户会提供一篇从飞书导出的 Markdown 文章，请做以下处理：

1. **格式化排版**：修正飞书导出可能存在的格式问题（多余空行、标题层级混乱、代码块标记缺失等）。保持原文知识点不变。
2. **生成摘要**：写一段 150-200 字的中文摘要，概括文章核心内容。
3. **提取标签**：提取 3-5 个技术标签，用英文小写（如 javascript, react, css）。
4. **知识关联**：如果文中知识点与常见技术概念有关联，简要建议（如 "可与 Promise 规范对比理解"）。

请只返回一个合法的 JSON 对象，不要加 markdown 代码块标记：
{
  "markdown": "整理后的完整 Markdown",
  "summary": "150-200字摘要",
  "tags": ["tag1", "tag2", "tag3"],
  "relatedSuggestions": ["关联建议1", "关联建议2"]
}`

const SYSTEM_PROMPT_CHAT = `你是一个技术学习助手。根据用户提供的文章内容，回答用户的问题。回答应该：
1. 基于文章内容，不要编造文外信息
2. 用中文回答，简洁准确
3. 如果文章没有涉及问题，诚实说明`

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function callDeepSeek(
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0].message.content
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Route: /api/organize
    if (path === '/api/organize' && request.method === 'POST') {
      try {
        const body: OrganizeRequest = await request.json()
        if (!body.content || body.content.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'content is required' }),
            { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
          )
        }

        const userMessage = body.content
        const aiResponse = await callDeepSeek(
          env.DEEPSEEK_API_KEY,
          env.DEEPSEEK_BASE_URL,
          SYSTEM_PROMPT_ORGANIZE,
          userMessage
        )

        // Parse the JSON response from AI
        const result = JSON.parse(aiResponse)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        )
      }
    }

    // Route: /api/chat
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const body: ChatRequest = await request.json()
        if (!body.question || body.question.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'question is required' }),
            { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
          )
        }

        const userMessage = `文章内容：\n\n${body.articleContent}\n\n问题：${body.question}`
        const answer = await callDeepSeek(
          env.DEEPSEEK_API_KEY,
          env.DEEPSEEK_BASE_URL,
          SYSTEM_PROMPT_CHAT,
          userMessage
        )

        return new Response(JSON.stringify({ answer }), {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        )
      }
    }

    // 404 for unmatched routes
    return new Response(
      JSON.stringify({ error: 'not found' }),
      { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  },
}
```

- [ ] **Step 2: 验证 Worker 能在本地启动**

```bash
cd worker && npx wrangler dev
```
预期：Worker 在 localhost:8787 启动

- [ ] **Step 3: 测试 /api/organize 端点**

```bash
curl -X POST http://localhost:8787/api/organize \
  -H "Content-Type: application/json" \
  -d '{"content":"# 测试文章\n\n这是一篇测试文章。"}'
```
预期：返回 JSON（可能因无 API Key 报错，确认路由正确即可）

- [ ] **Step 4: 提交**

```bash
git add worker/src/index.ts && git commit -m "feat: implement Worker AI endpoints (/api/organize, /api/chat)"
```

---

### Task 6: Admin SPA — 项目初始化

**Files:**
- Create: `admin/package.json`
- Create: `admin/vite.config.ts`
- Create: `admin/tsconfig.json`
- Create: `admin/index.html`
- Create: `admin/src/main.ts`
- Create: `admin/src/style.css`

- [ ] **Step 1: 创建 admin/package.json**

```json
{
  "name": "ty-blog-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **Step 2: 创建 admin/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/ty_blog/admin/',
  build: {
    outDir: '../blog/public/admin',
    emptyOutDir: true,
  },
})
```

- [ ] **Step 3: 创建 admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 admin/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>发布助手 - ty_blog</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: 创建 admin/src/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
```

- [ ] **Step 6: 创建 admin/src/style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #f8f9fa;
  --card-bg: #ffffff;
  --text: #1a1a2e;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --success: #10b981;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

#app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  background: var(--card-bg);
}

textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

- [ ] **Step 7: 安装依赖并验证**

```bash
cd admin && npm install && npx vite
```
预期：空白页面在 http://localhost:5173 正常打开

- [ ] **Step 8: 提交**

```bash
git add admin/ && git commit -m "feat: init admin SPA scaffold (Vue 3 + Vite)"
```

---

### Task 7: Admin — 类型定义与 API 层

**Files:**
- Create: `admin/src/types/index.ts`
- Create: `admin/src/api/worker.ts`
- Create: `admin/src/api/github.ts`
- Create: `admin/src/utils/config.ts`

- [ ] **Step 1: 创建 admin/src/types/index.ts**

```typescript
export interface OrganizeRequest {
  content: string
  preferences?: {
    tagStyle?: string
    language?: string
  }
}

export interface OrganizeResponse {
  markdown: string
  summary: string
  tags: string[]
  relatedSuggestions: string[]
}

export interface ChatRequest {
  articleContent: string
  question: string
}

export interface ChatResponse {
  answer: string
}

export interface ArticleMeta {
  title: string
  slug: string
  markdown: string
  summary: string
  tags: string[]
  date: string
}

export interface ApiError {
  error: string
}
```

- [ ] **Step 2: 创建 admin/src/utils/config.ts**

```typescript
export const config = {
  // Cloudflare Workers 地址 — 部署后替换为实际 URL
  workerUrl: 'https://ty-blog-worker.YOUR_SUBDOMAIN.workers.dev',

  // GitHub 仓库信息 — 使用前替换
  githubRepo: 'YOUR_USERNAME/ty_blog',
  githubBranch: 'main',
  // GitHub Personal Access Token — 在页面中手动输入，不写死在代码里
}
```

- [ ] **Step 3: 创建 admin/src/api/worker.ts**

```typescript
import type { OrganizeRequest, OrganizeResponse, ChatRequest, ChatResponse, ApiError } from '../types'
import { config } from '../utils/config'

export async function organizeArticle(
  content: string
): Promise<OrganizeResponse> {
  const body: OrganizeRequest = {
    content,
    preferences: { tagStyle: 'technical', language: 'zh-CN' },
  }

  const response = await fetch(`${config.workerUrl}/api/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: ApiError = await response.json()
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function chatWithArticle(
  articleContent: string,
  question: string
): Promise<ChatResponse> {
  const body: ChatRequest = { articleContent, question }

  const response = await fetch(`${config.workerUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: ApiError = await response.json()
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  return response.json()
}
```

- [ ] **Step 4: 创建 admin/src/api/github.ts**

```typescript
import type { ArticleMeta } from '../types'

function buildFileName(slug: string, date: string): string {
  return `${date}-${slug}.md`
}

function buildFrontmatter(meta: ArticleMeta): string {
  const tagsYaml = meta.tags.map(t => `  - ${t}`).join('\n')
  return `---
title: "${meta.title}"
date: ${meta.date}
tags:
${tagsYaml}
summary: "${meta.summary}"
---
`
}

export interface PublishParams {
  token: string
  repo: string
  branch: string
  article: ArticleMeta
}

export async function publishArticle(params: PublishParams): Promise<void> {
  const { token, repo, branch, article } = params
  const fileName = buildFileName(article.slug, article.date)
  const filePath = `blog/posts/${fileName}`
  const content = buildFrontmatter(article) + '\n' + article.markdown

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`

  // 检查文件是否已存在
  const existingSha = await getFileSha(token, repo, filePath, branch)

  const body: Record<string, string> = {
    message: `feat: publish "${article.title}"`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  }
  if (existingSha) {
    body.sha = existingSha
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json() as { message?: string }
    throw new Error(err.message || `GitHub API error ${response.status}`)
  }
}

async function getFileSha(
  token: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (response.status === 404) return null
  if (!response.ok) return null

  const data = await response.json() as { sha?: string }
  return data.sha || null
}
```

- [ ] **Step 5: 提交**

```bash
git add admin/src/types/ admin/src/api/ admin/src/utils/ && git commit -m "feat: add admin types, API layer (worker + github)"
```

---

### Task 8: Admin — App.vue 主布局与组件框架

**Files:**
- Create: `admin/src/App.vue`

- [ ] **Step 1: 创建 admin/src/App.vue（主布局）**

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ArticleMeta, OrganizeResponse } from './types'
import PasteArea from './components/PasteArea.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import AiActions from './components/AiActions.vue'
import ChatPanel from './components/ChatPanel.vue'
import { organizeArticle } from './api/worker'
import { publishArticle } from './api/github'

const rawContent = ref('')
const isLoading = ref(false)
const error = ref('')
const showChat = ref(false)

const article = reactive<ArticleMeta>({
  title: '',
  slug: '',
  markdown: '',
  summary: '',
  tags: [],
  date: new Date().toISOString().slice(0, 10),
})

const ghToken = ref(localStorage.getItem('gh_token') || '')
const ghRepo = ref(localStorage.getItem('gh_repo') || '')

function saveGhSettings() {
  localStorage.setItem('gh_token', ghToken.value)
  localStorage.setItem('gh_repo', ghRepo.value)
}

async function handleOrganize() {
  if (!rawContent.value.trim()) {
    error.value = '请先粘贴内容'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const result: OrganizeResponse = await organizeArticle(rawContent.value)
    article.markdown = result.markdown
    article.summary = result.summary
    article.tags = result.tags
    // 从 markdown 第一个 # 标题提取 title 和 slug
    const titleMatch = result.markdown.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      article.title = titleMatch[1].trim()
      article.slug = article.title
        .replace(/[^\w一-鿿]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 60)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'AI 整理失败'
  } finally {
    isLoading.value = false
  }
}

async function handlePublish() {
  if (!article.markdown) {
    error.value = '没有可发布的内容'
    return
  }
  if (!ghToken.value || !ghRepo.value) {
    error.value = '请先设置 GitHub Token 和仓库名'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    await publishArticle({
      token: ghToken.value,
      repo: ghRepo.value,
      branch: 'main',
      article: { ...article },
    })
    error.value = '' // clear — success!
    alert('发布成功！GitHub Actions 正在自动部署...')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发布失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app-header">
    <h1>🚀 发布助手</h1>
    <div class="gh-settings">
      <input
        v-model="ghRepo"
        type="text"
        placeholder="GitHub 仓库 (user/repo)"
        @change="saveGhSettings"
      />
      <input
        v-model="ghToken"
        type="password"
        placeholder="GitHub Token"
        @change="saveGhSettings"
      />
    </div>
  </div>

  <div v-if="error" class="error-bar">{{ error }}</div>

  <div class="main-layout">
    <div class="left-panel">
      <PasteArea v-model="rawContent" />
      <AiActions
        :loading="isLoading"
        :has-content="!!rawContent.trim()"
        :has-result="!!article.markdown"
        @organize="handleOrganize"
        @toggle-chat="showChat = !showChat"
        @publish="handlePublish"
      />
      <ChatPanel
        v-if="showChat"
        :article-content="article.markdown"
      />
    </div>
    <div class="right-panel">
      <PreviewPanel
        :article="article"
        @update:markdown="article.markdown = $event"
        @update:title="article.title = $event"
        @update:slug="article.slug = $event"
        @update:summary="article.summary = $event"
        @update:tags="article.tags = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.app-header h1 {
  font-size: 24px;
}

.gh-settings {
  display: flex;
  gap: 8px;
}

.gh-settings input {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  width: 200px;
}

.gh-settings input:focus {
  outline: none;
  border-color: var(--primary);
}

.error-bar {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-bottom: 16px;
  font-size: 14px;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: calc(100vh - 140px);
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add admin/src/App.vue && git commit -m "feat: add admin App.vue main layout with state management"
```

---

### Task 9: Admin — PasteArea 组件

**Files:**
- Create: `admin/src/components/PasteArea.vue`

- [ ] **Step 1: 创建 admin/src/components/PasteArea.vue**

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    emit('update:modelValue', text)
  } catch {
    // Clipboard API not available — user pastes manually
  }
}
</script>

<template>
  <div class="paste-area">
    <div class="paste-header">
      <h3>📋 粘贴飞书内容</h3>
      <button class="btn-sm" @click="handlePaste">📎 读取剪贴板</button>
    </div>
    <textarea
      :value="modelValue"
      @input="onInput"
      placeholder="将飞书文档导出为 Markdown，粘贴到这里..."
      rows="15"
    ></textarea>
    <div class="char-count">{{ modelValue.length }} 字</div>
  </div>
</template>

<style scoped>
.paste-area {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}

.paste-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.paste-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.btn-sm:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add admin/src/components/PasteArea.vue && git commit -m "feat: add PasteArea component"
```

---

### Task 10: Admin — AiActions 组件

**Files:**
- Create: `admin/src/components/AiActions.vue`

- [ ] **Step 1: 创建 admin/src/components/AiActions.vue**

```vue
<script setup lang="ts">
defineProps<{
  loading: boolean
  hasContent: boolean
  hasResult: boolean
}>()

const emit = defineEmits<{
  organize: []
  'toggle-chat': []
  publish: []
}>()
</script>

<template>
  <div class="ai-actions">
    <button
      class="btn-primary"
      :disabled="loading || !hasContent"
      @click="emit('organize')"
    >
      {{ loading ? '⏳ 整理中...' : '🤖 AI 整理' }}
    </button>
    <button
      class="btn-secondary"
      :disabled="!hasResult"
      @click="emit('toggle-chat')"
    >
      💬 对话提问
    </button>
    <button
      class="btn-publish"
      :disabled="loading || !hasResult"
      @click="emit('publish')"
    >
      🚀 发布
    </button>
  </div>
</template>

<style scoped>
.ai-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  flex: 1;
  background: var(--primary);
  color: #fff;
  padding: 12px 16px;
  font-size: 15px;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 12px 16px;
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-publish {
  background: var(--success);
  color: #fff;
  padding: 12px 20px;
  font-size: 15px;
}

.btn-publish:hover:not(:disabled) {
  filter: brightness(1.1);
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add admin/src/components/AiActions.vue && git commit -m "feat: add AiActions component"
```

---

### Task 11: Admin — PreviewPanel 组件

**Files:**
- Create: `admin/src/components/PreviewPanel.vue`

- [ ] **Step 1: 创建 admin/src/components/PreviewPanel.vue**

```vue
<script setup lang="ts">
import type { ArticleMeta } from '../types'

defineProps<{
  article: ArticleMeta
}>()

const emit = defineEmits<{
  'update:markdown': [value: string]
  'update:title': [value: string]
  'update:slug': [value: string]
  'update:summary': [value: string]
  'update:tags': [value: string[]]
}>()

function onTagsInput(e: Event) {
  const target = e.target as HTMLInputElement
  const tags = target.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
  emit('update:tags', tags)
}
</script>

<template>
  <div class="preview-panel">
    <h3>📄 预览 & 编辑</h3>

    <div v-if="!article.markdown" class="empty-state">
      <p>点击「AI 整理」后，结果会显示在这里</p>
    </div>

    <template v-else>
      <div class="field">
        <label>标题</label>
        <input
          :value="article.title"
          @input="emit('update:title', ($event.target as HTMLInputElement).value)"
          type="text"
        />
      </div>

      <div class="field">
        <label>Slug（文件名）</label>
        <input
          :value="article.slug"
          @input="emit('update:slug', ($event.target as HTMLInputElement).value)"
          type="text"
        />
      </div>

      <div class="field">
        <label>标签（逗号分隔）</label>
        <input
          :value="article.tags.join(', ')"
          @input="onTagsInput"
          type="text"
        />
      </div>

      <div class="field">
        <label>摘要</label>
        <textarea
          :value="article.summary"
          @input="emit('update:summary', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="summary-input"
        ></textarea>
      </div>

      <div class="field">
        <label>正文</label>
        <textarea
          :value="article.markdown"
          @input="emit('update:markdown', ($event.target as HTMLTextAreaElement).value)"
          rows="20"
        ></textarea>
      </div>
    </template>
  </div>
</template>

<style scoped>
.preview-panel {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  height: 100%;
  overflow-y: auto;
}

.preview-panel h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: var(--card-bg);
  padding-bottom: 8px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px 20px;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.field input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--bg);
}

.field input[type="text"]:focus {
  outline: none;
  border-color: var(--primary);
}

.summary-input {
  font-family: inherit !important;
  font-size: 14px !important;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add admin/src/components/PreviewPanel.vue && git commit -m "feat: add PreviewPanel component"
```

---

### Task 12: Admin — ChatPanel 组件

**Files:**
- Create: `admin/src/components/ChatPanel.vue`

- [ ] **Step 1: 创建 admin/src/components/ChatPanel.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { chatWithArticle } from '../api/worker'

const props = defineProps<{
  articleContent: string
}>()

const question = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant'; text: string }>>([])
const isChatting = ref(false)

async function send() {
  if (!question.value.trim() || !props.articleContent) return
  const q = question.value.trim()
  messages.value.push({ role: 'user', text: q })
  question.value = ''
  isChatting.value = true

  try {
    const result = await chatWithArticle(props.articleContent, q)
    messages.value.push({ role: 'assistant', text: result.answer })
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      text: '抱歉，请求失败：' + (e instanceof Error ? e.message : '未知错误'),
    })
  } finally {
    isChatting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="chat-panel">
    <h4>💬 AI 学习助手</h4>
    <div class="chat-messages">
      <div v-if="messages.length === 0" class="chat-hint">
        对当前文章内容提问，AI 会根据文章回答
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['chat-msg', msg.role]"
      >
        <strong>{{ msg.role === 'user' ? '你' : 'AI' }}:</strong>
        {{ msg.text }}
      </div>
      <div v-if="isChatting" class="chat-msg assistant">
        <em>思考中...</em>
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="question"
        type="text"
        placeholder="输入你的问题..."
        @keydown="handleKeydown"
        :disabled="isChatting"
      />
      <button @click="send" :disabled="isChatting || !question.trim()">
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.chat-panel h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.chat-messages {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--bg);
  border-radius: var(--radius);
}

.chat-hint {
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 12px;
}

.chat-msg {
  padding: 6px 8px;
  margin-bottom: 6px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.chat-msg.user {
  background: #e0e7ff;
}

.chat-msg.assistant {
  background: #f3f4f6;
}

.chat-msg strong {
  font-size: 12px;
  margin-right: 6px;
}

.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
}

.chat-input input:focus {
  outline: none;
  border-color: var(--primary);
}

.chat-input button {
  background: var(--primary);
  color: #fff;
  padding: 8px 14px;
}

.chat-input button:hover:not(:disabled) {
  background: var(--primary-hover);
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add admin/src/components/ChatPanel.vue && git commit -m "feat: add ChatPanel component"
```

---

### Task 13: Admin — 构建配置与验证

**Files:**
- Create: `admin/src/vite-env.d.ts`

- [ ] **Step 1: 创建 admin/src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 2: 构建 Admin SPA**

```bash
cd admin && npm run build
```
预期：构建产物输出到 `blog/public/admin/`，无 TypeScript 错误

- [ ] **Step 3: 验证 Admin 在 VitePress dev server 中可访问**

```bash
cd blog && npx vitepress dev
```
访问 http://localhost:5173/admin/ 确认 Admin 页面可以正常加载

- [ ] **Step 4: 提交**

```bash
git add admin/src/vite-env.d.ts blog/public/admin/ && git commit -m "feat: build admin SPA, verify integration with VitePress"
```

---

### Task 14: GitHub Actions 部署配置

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 .github/workflows/deploy.yml**

```yaml
name: Deploy Blog

on:
  push:
    branches:
      - main
    paths:
      - 'blog/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    concurrency:
      group: pages
      cancel-in-progress: true

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install blog dependencies
        run: |
          cd blog
          npm ci

      - name: Build admin SPA
        run: |
          cd admin
          npm ci
          npm run build

      - name: Build VitePress
        run: |
          cd blog
          npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: blog/.vitepress/dist
          publish_branch: gh-pages
```

- [ ] **Step 2: 提交**

```bash
git add .github/ && git commit -m "feat: add GitHub Actions deploy workflow"
```

---

### Task 15: 本地端到端验证

**目标：** 在本地验证完整工作流。

- [ ] **Step 1: 验证 VitePress 博客构建**

```bash
cd blog && npm run build
```
预期：构建成功，输出在 `blog/.vitepress/dist/`

- [ ] **Step 2: 验证 Admin SPA 构建并嵌入博客**

```bash
cd admin && npm run build
ls blog/public/admin/index.html
```
预期：Admin 产物在 blog/public/admin/ 下

- [ ] **Step 3: 启动 Worker 本地开发服务器**

```bash
cd worker && npx wrangler dev &
```

- [ ] **Step 4: 测试 Worker 端点（模拟 Admin 调用）**

```bash
# 测试 /api/organize
curl -s -X POST http://localhost:8787/api/organize \
  -H "Content-Type: application/json" \
  -d '{"content":"# 测试\n\n这是内容"}' | jq .

# 测试 /api/chat
curl -s -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"articleContent":"# 测试文章\n\nJavaScript 是单线程语言。","question":"JavaScript 为什么是单线程的？"}' | jq .
```

- [ ] **Step 5: 验证 Admin SPA 在浏览器中可用**

```bash
cd blog && npx vitepress dev
```
在浏览器中：
1. 访问 http://localhost:5173 — 确认博客首页正常
2. 访问 http://localhost:5173/admin/ — 确认 Admin 页面正常
3. 粘贴一段 Markdown，确认布局显示正确

- [ ] **Step 6: 提交所有遗留文件**

```bash
git add -A && git commit -m "chore: final integration verification"
```

---

## 部署前检查清单

部署到生产环境前需要手动完成以下步骤：

1. **创建 GitHub 仓库**并推送代码
2. **启用 GitHub Pages**：Settings → Pages → Source: `gh-pages` branch
3. **创建 GitHub Personal Access Token**（repo 权限），用于 Admin 调用 GitHub API
4. **部署 Cloudflare Worker**：
   ```bash
   cd worker
   npx wrangler deploy
   npx wrangler secret put DEEPSEEK_API_KEY
   ```
5. **更新 `admin/src/utils/config.ts`** 中的 `workerUrl` 为实际 Workers 域名
6. **重新构建 Admin**：`cd admin && npm run build`
7. **推送代码**触发首次部署

---

## 平台复检

- [x] VitePress 博客 — 首页、文章页、标签、关于、RSS、深色模式
- [x] 发布助手 — 粘贴、AI 整理、预览编辑、对话、发布
- [x] Cloudflare Workers — `/api/organize`, `/api/chat`
- [x] GitHub Actions — 自动构建部署
- [x] 安全 — API Key 仅存 Workers 环境变量

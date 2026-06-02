---
layout: home

hero:
  name: "ty_blog"
  text: "每日学习 · 持续积累"
  tagline: 记录技术成长路上的每一个知识点
  actions:
    - theme: brand
      text: 浏览文章
      link: /
    - theme: alt
      text: 标签分类
      link: /tags
    - theme: alt
      text: 关于我
      link: /about
---

<script setup>
import { data as posts } from './.vitepress/theme/posts.data.ts'
import { withBase } from 'vitepress'
</script>

## 最新文章

<div v-if="posts && posts.length > 0" class="post-list">
  <a v-for="post of posts" :key="post.url" :href="withBase(post.url)" class="post-card">
    <div class="post-card-date">{{ post.frontmatter.date }}</div>
    <div class="post-card-title">{{ post.frontmatter.title }}</div>
    <p v-if="post.frontmatter.summary" class="post-card-summary">{{ post.frontmatter.summary }}</p>
    <div v-if="post.frontmatter.tags" class="post-card-tags">
      <span v-for="tag in post.frontmatter.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
  </a>
</div>
<p v-else class="empty-hint">暂无文章，从 Admin 发布第一篇吧 🚀</p>

<style>
.post-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
}

.post-card {
  display: block;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.post-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.post-card-date {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.post-card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.post-card:hover .post-card-title {
  color: var(--vp-c-brand);
}

.post-card-summary {
  margin-top: 10px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card-tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
}

.empty-hint {
  margin-top: 40px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 15px;
}
</style>

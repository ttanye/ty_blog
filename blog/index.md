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

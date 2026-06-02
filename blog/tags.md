---
layout: page
---

<script setup>
import { data as tags } from './.vitepress/theme/tags.data.ts'
import { withBase } from 'vitepress'
</script>

# 🏷️ 标签

<div class="tag-cloud">
  <div
    v-for="{ tag, count, posts } in tags"
    :key="tag"
    class="tag-item"
  >
    <strong>{{ tag }}</strong> ({{ count }})
    <ul>
      <li v-for="post in posts" :key="post.url">
        <a :href="withBase(post.url)">{{ post.date }} — {{ post.title }}</a>
      </li>
    </ul>
  </div>
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

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

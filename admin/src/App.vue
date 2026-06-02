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

const deepseekKey = ref(localStorage.getItem('deepseek_key') || '')
const ghToken = ref(localStorage.getItem('gh_token') || '')
const ghRepo = ref(localStorage.getItem('gh_repo') || '')

function saveSettings() {
  localStorage.setItem('deepseek_key', deepseekKey.value)
  localStorage.setItem('gh_token', ghToken.value)
  localStorage.setItem('gh_repo', ghRepo.value)
}

async function handleOrganize() {
  if (!rawContent.value.trim()) {
    error.value = '请先粘贴内容'
    return
  }
  if (!deepseekKey.value) {
    error.value = '请先设置 DeepSeek API Key'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const result: OrganizeResponse = await organizeArticle(rawContent.value, deepseekKey.value)
    article.markdown = result.markdown
    article.summary = result.summary
    article.tags = result.tags
    // Extract title from first # heading in markdown
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
    error.value = ''
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
        v-model="deepseekKey"
        type="password"
        placeholder="DeepSeek API Key"
        @change="saveSettings"
      />
      <input
        v-model="ghRepo"
        type="text"
        placeholder="GitHub 仓库 (user/repo)"
        @change="saveSettings"
      />
      <input
        v-model="ghToken"
        type="password"
        placeholder="GitHub Token"
        @change="saveSettings"
      />
      <button class="save-btn" @click="saveSettings">保存</button>
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
        :api-key="deepseekKey"
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

.save-btn {
  padding: 6px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  cursor: pointer;
}

.save-btn:hover {
  opacity: 0.85;
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

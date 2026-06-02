<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ArticleMeta, OrganizeResponse } from './types'
import PasteArea from './components/PasteArea.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import AiActions from './components/AiActions.vue'
import ChatPanel from './components/ChatPanel.vue'
import { organizeArticle } from './api/worker'
import { publishArticle, deleteArticle } from './api/github'

// --- Auth gate ---
const ADMIN_PASSWORD = '050625'
const authenticated = ref(sessionStorage.getItem('admin_auth') === '1')
const loginPassword = ref('')
const loginError = ref('')

function handleLogin() {
  if (loginPassword.value === ADMIN_PASSWORD) {
    authenticated.value = true
    sessionStorage.setItem('admin_auth', '1')
    loginError.value = ''
  } else {
    loginError.value = '密码错误，请重试'
    loginPassword.value = ''
  }
}

// --- App state ---
const rawContent = ref('')
const isLoading = ref(false)
const error = ref('')
const showChat = ref(false)
const lastPublishedFile = ref(localStorage.getItem('last_published_file') || '')

const article = reactive<ArticleMeta>({
  title: '',
  slug: '',
  markdown: '',
  summary: '',
  tags: [],
  date: new Date().toISOString().slice(0, 16).replace('T', ' '),
})

const aiApiKey = ref(localStorage.getItem('ai_api_key') || '')
const aiBaseUrl = ref(localStorage.getItem('ai_base_url') || 'https://api.deepseek.com')
const aiModel = ref(localStorage.getItem('ai_model') || 'deepseek-chat')
const ghToken = ref(localStorage.getItem('gh_token') || '')
const ghRepo = ref(localStorage.getItem('gh_repo') || '')

function saveSettings() {
  localStorage.setItem('ai_api_key', aiApiKey.value)
  localStorage.setItem('ai_base_url', aiBaseUrl.value)
  localStorage.setItem('ai_model', aiModel.value)
  localStorage.setItem('gh_token', ghToken.value)
  localStorage.setItem('gh_repo', ghRepo.value)
}

async function handleOrganize() {
  if (!rawContent.value.trim()) {
    error.value = '请先粘贴内容'
    return
  }
  if (!aiApiKey.value) {
    error.value = '请先设置 AI API Key'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const result: OrganizeResponse = await organizeArticle(rawContent.value, aiApiKey.value, aiBaseUrl.value, aiModel.value)
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
    const fileName = `${article.date.slice(0, 10)}-${article.slug}.md`
    lastPublishedFile.value = `blog/posts/${fileName}`
    localStorage.setItem('last_published_file', lastPublishedFile.value)
    alert(`发布成功！文件: ${fileName}\nGitHub Actions 正在自动部署...`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发布失败'
  } finally {
    isLoading.value = false
  }
}

async function handleDelete() {
  if (!lastPublishedFile.value) {
    error.value = '没有可删除的文件，请先输入文件路径'
    return
  }
  if (!ghToken.value || !ghRepo.value) {
    error.value = '请先设置 GitHub Token 和仓库名'
    return
  }
  if (!confirm(`确认删除 ${lastPublishedFile.value}？此操作不可撤销。`)) return
  isLoading.value = true
  error.value = ''
  try {
    await deleteArticle({
      token: ghToken.value,
      repo: ghRepo.value,
      branch: 'main',
      filePath: lastPublishedFile.value,
    })
    lastPublishedFile.value = ''
    localStorage.removeItem('last_published_file')
    alert('删除成功！')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Login gate -->
  <div v-if="!authenticated" class="login-gate">
    <div class="login-card">
      <h1>🔐 发布助手</h1>
      <p class="login-desc">此页面仅限博主使用，请输入密码</p>
      <input
        v-model="loginPassword"
        type="password"
        placeholder="请输入访问密码"
        @keyup.enter="handleLogin"
      />
      <button @click="handleLogin">验证进入</button>
      <p v-if="loginError" class="login-error">{{ loginError }}</p>
    </div>
  </div>

  <!-- Admin UI -->
  <template v-else>
  <div class="app-header">
    <h1>🚀 发布助手</h1>
    <div class="gh-settings">
      <input
        v-model="aiBaseUrl"
        type="text"
        placeholder="API 地址"
        @change="saveSettings"
      />
      <input
        v-model="aiModel"
        type="text"
        placeholder="模型名"
        @change="saveSettings"
      />
      <input
        v-model="aiApiKey"
        type="password"
        placeholder="AI API Key"
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
        :api-key="aiApiKey"
        :base-url="aiBaseUrl"
        :model="aiModel"
      />
      <div class="delete-section">
        <div class="delete-header">🗑️ 删除文章</div>
        <div class="delete-row">
          <input
            v-model="lastPublishedFile"
            type="text"
            placeholder="文件路径 (如 blog/posts/2024-01-01-slug.md)"
          />
          <button
            class="delete-btn"
            :disabled="isLoading || !lastPublishedFile"
            @click="handleDelete"
          >确认删除</button>
        </div>
      </div>
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
</template>

<style scoped>
.login-gate {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-card h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.login-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.login-card input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 16px;
  text-align: center;
  margin-bottom: 12px;
}

.login-card input:focus {
  outline: none;
  border-color: var(--primary);
}

.login-card button {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}

.login-card button:hover {
  background: var(--primary-hover);
}

.login-error {
  color: #dc2626;
  font-size: 14px;
  margin-top: 8px;
}



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

.delete-section {
  padding: 16px;
  background: #fef2f2;
  border-radius: var(--radius);
  border: 2px solid #fecaca;
}

.delete-header {
  font-size: 15px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 10px;
}

.delete-row {
  display: flex;
  gap: 8px;
}

.delete-section input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #fecaca;
  border-radius: var(--radius);
  font-size: 13px;
  background: #fff;
}

.delete-section input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.delete-btn {
  padding: 8px 18px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.delete-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

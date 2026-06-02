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

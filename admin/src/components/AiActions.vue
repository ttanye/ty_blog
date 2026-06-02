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

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

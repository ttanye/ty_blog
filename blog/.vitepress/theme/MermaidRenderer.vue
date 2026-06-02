<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import mermaid from 'mermaid'

const route = useRoute()
const { Layout } = DefaultTheme

mermaid.initialize({ startOnLoad: false })

async function renderMermaid() {
  await nextTick()
  const blocks = document.querySelectorAll('pre > code.language-mermaid')
  for (const block of blocks) {
    const pre = block.parentElement
    if (!pre || pre.querySelector('.mermaid-rendered')) continue
    try {
      const svg = await mermaid.render(
        'mermaid-' + Math.random().toString(36).slice(2, 8),
        block.textContent || ''
      )
      const div = document.createElement('div')
      div.className = 'mermaid-rendered'
      div.innerHTML = svg.svg
      div.style.cssText = 'display:flex;justify-content:center;margin:20px 0'
      pre.replaceWith(div)
    } catch {
      // Leave as raw code block on error
      pre.querySelector('code')?.classList.add('mermaid-parse-error')
    }
  }
}

onMounted(renderMermaid)
watch(() => route.path, () => setTimeout(renderMermaid, 50))
</script>

<template>
  <Layout />
</template>

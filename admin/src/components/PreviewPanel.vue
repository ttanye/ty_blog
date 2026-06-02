<script setup lang="ts">
import type { ArticleMeta } from '../types'
defineProps<{ article: ArticleMeta }>()
defineEmits<{
  'update:markdown': [value: string]
  'update:title': [value: string]
  'update:slug': [value: string]
  'update:summary': [value: string]
  'update:tags': [value: string[]]
}>()
</script>
<template><div>PreviewPanel stub</div></template>

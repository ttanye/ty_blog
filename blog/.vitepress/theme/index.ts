import DefaultTheme from 'vitepress/theme'
import MermaidRenderer from './MermaidRenderer.vue'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout: MermaidRenderer,
} satisfies Theme

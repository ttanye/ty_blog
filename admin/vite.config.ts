import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/ty_blog/admin/',
  build: {
    outDir: '../blog/public/admin',
    emptyOutDir: true,
  },
})

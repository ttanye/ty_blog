import { defineConfig, type SiteConfig } from 'vitepress'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

function generateRSS(config: SiteConfig) {
  const { pages } = config
  const posts = pages
    .filter(p => p.startsWith('/posts/') && p !== '/posts/')
    .map(p => ({
      title: p.replace('/posts/', '').replace('.html', ''),
      url: p,
      date: '',
    }))

  const items = posts.map(p =>
    `<item>
      <title>${p.title}</title>
      <link>https://YOUR_USERNAME.github.io/ty_blog${p.url}</link>
      <guid>https://YOUR_USERNAME.github.io/ty_blog${p.url}</guid>
    </item>`
  ).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>ty_blog</title>
  <link>https://YOUR_USERNAME.github.io/ty_blog</link>
  <description>个人技术博客 - 每日学习总结与分享</description>
  <language>zh-CN</language>
  ${items}
</channel>
</rss>`

  writeFileSync(join(config.outDir, 'rss.xml'), rss)
}

export default defineConfig({
  title: 'ty_blog',
  description: '个人技术博客 - 每日学习总结与分享',
  lang: 'zh-CN',
  base: '/ty_blog/',
  markdown: {
    math: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  buildEnd: generateRSS,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '标签', link: '/tags' },
      { text: '关于', link: '/about' },
    ],
    search: {
      provider: 'local',
    },
    darkModeSwitchLabel: '深色模式',
    sidebar: false,
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' },
    ],
  },
})

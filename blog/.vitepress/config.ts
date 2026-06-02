import { defineConfig, type SiteConfig } from 'vitepress'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Escape special XML characters to prevent XML injection. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateRSS(config: SiteConfig) {
  const { pages } = config

  // Resolve GitHub username from CI environment or use a sensible default.
  // GITHUB_REPOSITORY is set by GitHub Actions as "owner/repo".
  const githubRepo = process.env.GITHUB_REPOSITORY
  const githubUsername = githubRepo ? githubRepo.split('/')[0] : 'YOUR_USERNAME'
  // TODO: Replace 'YOUR_USERNAME' above if not deploying via GitHub Actions.
  const baseUrl = `https://${escapeXml(githubUsername)}.github.io/ty_blog`

  // Use build time for pubDate since SiteConfig.pages only carries URL strings
  // and frontmatter data is not accessible from the buildEnd hook.
  const buildDate = new Date().toUTCString()

  const posts = pages
    .filter(p => p.startsWith('/posts/') && p !== '/posts/')
    .map(p => ({
      title: p.replace('/posts/', '').replace('.html', ''),
      url: p,
    }))

  const items = posts.map(p =>
    `<item>
      <title>${escapeXml(p.title)}</title>
      <link>${baseUrl}${escapeXml(p.url)}</link>
      <guid>${baseUrl}${escapeXml(p.url)}</guid>
      <pubDate>${buildDate}</pubDate>
    </item>`
  ).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml('ty_blog')}</title>
  <link>${baseUrl}</link>
  <description>${escapeXml('个人技术博客 - 每日学习总结与分享')}</description>
  <language>zh-CN</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
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
      { text: '发布', link: '/admin/index.html' },
    ],
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

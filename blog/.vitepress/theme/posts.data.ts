import { createContentLoader } from 'vitepress'

function formatDate(d: unknown): string {
  if (!d) return ''
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d).slice(0, 10)
}

export default createContentLoader('posts/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(raw) {
    return raw
      .filter(page => page.url !== '/posts/')
      .map(page => ({
        url: page.url,
        frontmatter: {
          ...page.frontmatter,
          date: formatDate(page.frontmatter.date),
        },
      }))
      .sort((a, b) => {
        return formatDate(b.frontmatter.date).localeCompare(formatDate(a.frontmatter.date))
      })
  },
})

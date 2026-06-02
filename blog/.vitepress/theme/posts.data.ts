import { createContentLoader } from 'vitepress'

export default createContentLoader('posts/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(raw) {
    return raw
      .filter(page => page.url !== '/posts/')
      .map(page => ({
        url: page.url,
        frontmatter: page.frontmatter,
      }))
      .sort((a, b) => {
        const dateA = a.frontmatter.date || ''
        const dateB = b.frontmatter.date || ''
        return dateB.localeCompare(dateA)
      })
  },
})

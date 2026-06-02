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
        // frontmatter date may be a YAML Date or a string
        const dateA = String(a.frontmatter.date || '')
        const dateB = String(b.frontmatter.date || '')
        return dateB.localeCompare(dateA)
      })
  },
})

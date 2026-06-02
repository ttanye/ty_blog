import { createContentLoader } from 'vitepress'

interface TaggedPost {
  url: string
  title: string
  date: string
}

export default createContentLoader('posts/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(raw) {
    const tagMap = new Map<string, TaggedPost[]>()
    raw
      .filter(page => page.url !== '/posts/')
      .forEach(page => {
        const tags: string[] = page.frontmatter.tags || []
        tags.forEach(tag => {
          if (!tagMap.has(tag)) tagMap.set(tag, [])
          tagMap.get(tag)!.push({
            url: page.url,
            title: page.frontmatter.title || '',
            date: page.frontmatter.date || '',
          })
        })
      })
    // Sort posts within each tag by date descending
    for (const [, posts] of tagMap) {
      posts.sort((a, b) => b.date.localeCompare(a.date))
    }
    return Array.from(tagMap.entries())
      .map(([tag, posts]) => ({ tag, count: posts.length, posts }))
      .sort((a, b) => b.count - a.count)
  },
})

import type { ArticleMeta } from '../types'

function buildFileName(slug: string, date: string): string {
  return `${date}-${slug}.md`
}

function escapeYaml(str: string): string {
  // If the string contains double quotes or special YAML chars, use a
  // plain scalar on a single line for summaries; fallback to quoted with
  // escaped double quotes.
  return str.replace(/"/g, '\\"')
}

function buildFrontmatter(meta: ArticleMeta): string {
  const tagsYaml = meta.tags.map(t => `  - ${t}`).join('\n')
  return `---
title: "${escapeYaml(meta.title)}"
date: ${meta.date}
tags:
${tagsYaml}
summary: "${escapeYaml(meta.summary)}"
---
`
}

export interface PublishParams {
  token: string
  repo: string
  branch: string
  article: ArticleMeta
}

export async function publishArticle(params: PublishParams): Promise<void> {
  const { token, repo, branch, article } = params
  const fileName = buildFileName(article.slug, article.date)
  const filePath = `blog/posts/${fileName}`
  const content = buildFrontmatter(article) + '\n' + article.markdown

  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`

  // Check if file already exists (for updating)
  const existingSha = await getFileSha(token, repo, filePath, branch)

  const body: Record<string, string> = {
    message: `feat: publish "${article.title}"`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  }
  if (existingSha) {
    body.sha = existingSha
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json() as { message?: string }
    throw new Error(err.message || `GitHub API error ${response.status}`)
  }
}

async function getFileSha(
  token: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (response.status === 404) return null
  if (!response.ok) return null

  const data = await response.json() as { sha?: string }
  return data.sha || null
}

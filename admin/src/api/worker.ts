import type { OrganizeRequest, OrganizeResponse, ChatRequest, ChatResponse, ApiError } from '../types'
import { config } from '../utils/config'

export async function organizeArticle(
  content: string
): Promise<OrganizeResponse> {
  const body: OrganizeRequest = {
    content,
    preferences: { tagStyle: 'technical', language: 'zh-CN' },
  }

  const response = await fetch(`${config.workerUrl}/api/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: ApiError = await response.json()
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function chatWithArticle(
  articleContent: string,
  question: string
): Promise<ChatResponse> {
  const body: ChatRequest = { articleContent, question }

  const response = await fetch(`${config.workerUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: ApiError = await response.json()
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  return response.json()
}

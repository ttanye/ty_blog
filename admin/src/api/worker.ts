import type { OrganizeResponse, ChatResponse, ApiError } from '../types'
import { config } from '../utils/config'

const SYSTEM_PROMPT_ORGANIZE = `你是一个技术博客编辑助手。用户会提供一篇从飞书导出的 Markdown 文章，请做以下处理：

1. **格式化排版**：修正飞书导出可能存在的格式问题（多余空行、标题层级混乱、代码块标记缺失等）。保持原文知识点不变。
2. **生成摘要**：写一段 150-200 字的中文摘要，概括文章核心内容。
3. **提取标签**：提取 3-5 个技术标签，用英文小写（如 javascript, react, css）。
4. **知识关联**：如果文中知识点与常见技术概念有关联，简要建议（如 "可与 Promise 规范对比理解"）。

请只返回一个合法的 JSON 对象，不要加 markdown 代码块标记：
{
  "markdown": "整理后的完整 Markdown",
  "summary": "150-200字摘要",
  "tags": ["tag1", "tag2", "tag3"],
  "relatedSuggestions": ["关联建议1", "关联建议2"]
}`

const SYSTEM_PROMPT_CHAT = `你是一个技术学习助手。根据用户提供的文章内容，回答用户的问题。回答应该：
1. 基于文章内容，不要编造文外信息
2. 用中文回答，简洁准确
3. 如果文章没有涉及问题，诚实说明`

async function callDeepSeek(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${config.deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0].message.content
}

export async function organizeArticle(
  content: string,
  apiKey: string
): Promise<OrganizeResponse> {
  if (!content.trim()) {
    throw new Error('content is required')
  }

  const aiResponse = await callDeepSeek(apiKey, SYSTEM_PROMPT_ORGANIZE, content)

  // Parse the JSON response from AI
  const result = JSON.parse(aiResponse)
  return result as OrganizeResponse
}

export async function chatWithArticle(
  articleContent: string,
  question: string,
  apiKey: string
): Promise<ChatResponse> {
  if (!question.trim()) {
    throw new Error('question is required')
  }

  const userMessage = `文章内容：\n\n${articleContent}\n\n问题：${question}`
  const answer = await callDeepSeek(apiKey, SYSTEM_PROMPT_CHAT, userMessage)

  return { answer }
}

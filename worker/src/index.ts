export interface Env {
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
}

interface OrganizeRequest {
  content: string
  preferences?: {
    tagStyle?: string
    language?: string
  }
}

interface ChatRequest {
  articleContent: string
  question: string
}

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

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function callDeepSeek(
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Route: /api/organize
    if (path === '/api/organize' && request.method === 'POST') {
      try {
        const body: OrganizeRequest = await request.json()
        if (!body.content || body.content.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'content is required' }),
            { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
          )
        }

        const userMessage = body.content
        const aiResponse = await callDeepSeek(
          env.DEEPSEEK_API_KEY,
          env.DEEPSEEK_BASE_URL,
          SYSTEM_PROMPT_ORGANIZE,
          userMessage
        )

        // Parse the JSON response from AI
        const result = JSON.parse(aiResponse)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        )
      }
    }

    // Route: /api/chat
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const body: ChatRequest = await request.json()
        if (!body.question || body.question.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'question is required' }),
            { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
          )
        }

        const userMessage = `文章内容：\n\n${body.articleContent}\n\n问题：${body.question}`
        const answer = await callDeepSeek(
          env.DEEPSEEK_API_KEY,
          env.DEEPSEEK_BASE_URL,
          SYSTEM_PROMPT_CHAT,
          userMessage
        )

        return new Response(JSON.stringify({ answer }), {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
        )
      }
    }

    // 404 for unmatched routes
    return new Response(
      JSON.stringify({ error: 'not found' }),
      { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  },
}

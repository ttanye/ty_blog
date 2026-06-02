import type { OrganizeResponse, ChatResponse } from '../types'

/** Parse AI response using delimiter markers — avoids all JSON escaping issues */
function parseDelimited(text: string): OrganizeResponse {
  const get = (tag: string): string => {
    const m = text.match(new RegExp(`===${tag}===\\n?([\\s\\S]*?)(?=\\n?===|$)`, 'i'))
    return m ? m[1].trim() : ''
  }
  return {
    markdown: get('MARKDOWN'),
    summary: get('SUMMARY'),
    tags: get('TAGS').split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
    relatedSuggestions: get('RELATED').split('\n').map(s => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
  }
}

const SYSTEM_PROMPT_ORGANIZE = `你是一位资深技术导师兼博客编辑。用户会提供一份学习笔记（从飞书导出），请将这些零散的知识点，扩展成一篇结构完整、内容充实的博客文章。

**要求：**

1. **知识扩展与补充（最重要）**：
   - 不要只是复制粘贴用户的笔记，要在每个知识点基础上做深入扩展
   - 补充关键背景知识、原理说明、底层机制
   - 给出实际开发中的使用场景和最佳实践
   - 对比相似概念的异同（如 rowspan vs colspan）
   - 加入常见误区或注意事项
   - 可以补充代码示例来加深理解

2. **可视化图表（Mermaid）**：
   - 如果知识点适合用图表表达，请生成 1-2 个 Mermaid 图表
   - 用 markdown 代码块包裹，语言标识为 mermaid（即三个反引号 + mermaid）
   - 思维导图（mindmap）适合展示知识体系结构，示例语法：
     mindmap 缩进表示层级，root 为根节点
   - 流程图（graph TD）适合展示步骤、关系和对比，示例语法：
     用 A-->B 表示流程，用 {条件} 表示分支判断
   - 也可用时序图（sequenceDiagram）展示调用顺序
   - 图表要简洁清晰，不要过于复杂
   - 注意：Mermaid 代码块内的文字不要使用双引号，改用单引号或不用引号

3. **文章结构**：
   - 使用合适的标题层级（h2/h3/h4），逻辑清晰
   - 开头写一段引言，说明今天学的内容及其重要性
   - 图表穿插在相关知识点附近，不要堆在一起
   - 结尾写一段总结，提炼核心要点

4. **生成摘要**：写一段 150-200 字的中文摘要，概括文章的精华内容。

5. **提取标签**：3-5 个英文技术标签（小写，如 javascript, html-table, css-grid）。

6. **知识关联**：建议 1-2 个可以对比学习或进阶学习的相关知识点。

**重要**：请严格按照以下分隔符格式输出，不要加任何额外的解释或代码块标记：

===MARKDOWN===
（这里放扩展后的完整 Markdown 文章，可以包含任意代码块和图表，无需转义）

===SUMMARY===
（150-200字中文摘要，单行纯文本）

===TAGS===
tag1, tag2, tag3

===RELATED===
- 关联建议1
- 关联建议2`

const SYSTEM_PROMPT_CHAT = `你是一个技术学习助手。根据用户提供的文章内容，回答用户的问题。回答应该：
1. 基于文章内容，不要编造文外信息
2. 用中文回答，简洁准确
3. 如果文章没有涉及问题，诚实说明`

async function callAI(
  apiKey: string,
  baseUrl: string,
  model: string,
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
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 8192,
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
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<OrganizeResponse> {
  if (!content.trim()) {
    throw new Error('content is required')
  }

  const aiResponse = await callAI(apiKey, baseUrl, model, SYSTEM_PROMPT_ORGANIZE, content)

  // Parse the AI response using delimiter markers
  const result = parseDelimited(aiResponse)

  // Validate required fields
  if (!result.markdown || !result.summary) {
    throw new Error(
      `AI 返回内容不完整（markdown或summary缺失），请重试。\n\n响应开头: ${aiResponse.slice(0, 300)}`
    )
  }

  return result
}

export async function chatWithArticle(
  articleContent: string,
  question: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<ChatResponse> {
  if (!question.trim()) {
    throw new Error('question is required')
  }

  const userMessage = `文章内容：\n\n${articleContent}\n\n问题：${question}`
  const answer = await callAI(apiKey, baseUrl, model, SYSTEM_PROMPT_CHAT, userMessage)

  return { answer }
}

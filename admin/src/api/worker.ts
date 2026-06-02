import type { OrganizeResponse, ChatResponse } from '../types'
import { config } from '../utils/config'

/** Strip markdown code blocks from AI response before JSON parsing */
function extractJson(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    return codeBlock[1].trim()
  }
  // Try to find the first { and last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text
}

/** Try to fix common JSON errors from AI responses */
function tryParseJson(text: string): unknown {
  // First try direct parse
  try { return JSON.parse(text) } catch {}

  // Try fixing unescaped newlines in string values
  try {
    const fixed = text.replace(/(?<=:\s*")([\s\S]*?)(?=")/g, (match) =>
      match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    )
    return JSON.parse(fixed)
  } catch {}

  // Try fixing unescaped backslashes
  try {
    const fixed = text.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    return JSON.parse(fixed)
  } catch {}

  throw new Error('JSON parse failed after all repair attempts')
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

**重要**：请你只返回一个合法的 JSON 对象，不要加 markdown 代码块标记：
{
  "markdown": "扩展后的完整 Markdown 文章",
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
  apiKey: string
): Promise<OrganizeResponse> {
  if (!content.trim()) {
    throw new Error('content is required')
  }

  const aiResponse = await callDeepSeek(apiKey, SYSTEM_PROMPT_ORGANIZE, content)

  // Parse the JSON response from AI (handle markdown-wrapped and malformed JSON)
  const jsonStr = extractJson(aiResponse)
  let result: OrganizeResponse
  try {
    result = tryParseJson(jsonStr) as OrganizeResponse
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    throw new Error(
      `AI 返回格式无法解析（${msg}），请重试。\n\n响应前200字符: ${aiResponse.slice(0, 200)}...\n\n响应最后200字符: ...${aiResponse.slice(-200)}`
    )
  }

  // Validate required fields
  if (!result.markdown || !result.summary || !result.tags) {
    throw new Error('AI 返回内容不完整，请重试')
  }

  return result
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

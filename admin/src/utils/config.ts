// AI 模型配置 — 支持所有 OpenAI 兼容 API
// 换模型只需改下面三行，重新构建即可
export const aiConfig = {
  baseUrl: 'https://api.deepseek.com',     // API 地址
  model: 'deepseek-chat',                   // 模型名称
  maxTokens: 8192,                          // 最大输出 token
}

// DeepSeek:  https://api.deepseek.com       模型 deepseek-chat
// Moonshot:  https://api.moonshot.cn        模型 moonshot-v1-8k
// 智谱:      https://open.bigmodel.cn/api/paas/v4  模型 glm-4-flash
// 通义千问:  https://dashscope.aliyuncs.com/compatible-mode/v1  模型 qwen-plus
// OpenAI:    https://api.openai.com         模型 gpt-4o-mini

// GitHub 仓库配置
export const githubConfig = {
  repo: 'ttanye/ty_blog',
  branch: 'main',
}

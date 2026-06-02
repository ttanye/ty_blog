export interface OrganizeRequest {
  content: string
  preferences?: {
    tagStyle?: string
    language?: string
  }
}

export interface OrganizeResponse {
  markdown: string
  summary: string
  tags: string[]
  relatedSuggestions: string[]
}

export interface ChatRequest {
  articleContent: string
  question: string
}

export interface ChatResponse {
  answer: string
}

export interface ArticleMeta {
  title: string
  slug: string
  markdown: string
  summary: string
  tags: string[]
  date: string
}

export interface ApiError {
  error: string
}

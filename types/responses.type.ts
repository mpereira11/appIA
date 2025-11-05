export interface GeminiResponse {
  candidates: Candidate[]
  usageMetadata: UsageMetadata;
  modelVersion: string
  responseId: string
}

export interface Candidate {
  content: Content
  finishReason: string
  index: number
}

export interface Content {
  parts: Part[]
  role: string
}

export interface Part {
  text: string
}

export interface UsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
  promptTokensDetails: PromptTokensDetails[]
  thoughtsTokenDetails: number
}

export interface PromptTokensDetails {
  modality: string
  tokenCount: number
}

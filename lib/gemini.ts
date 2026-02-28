import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const MODEL = "gemini-2.5-pro"

const GENERATION_CONFIG = {
  temperature: 0.3,
  maxOutputTokens: 8192,
}

// Cliente único com as configurações fixas
const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: GENERATION_CONFIG,
})

export async function chamarGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt)
  return result.response.text()
}

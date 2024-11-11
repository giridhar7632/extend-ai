export const ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 8080
export const READER_URL = process.env.READER_URL
export const READER_API_KEY = process.env.READER_API_KEY
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY
export const PROMPT_TEMPLATE = process.env.PROMPT_TEMPLATE?.replace(/\\n/g, '\n')
export const GEMINI_MODEL = process.env.GEMINI_MODEL
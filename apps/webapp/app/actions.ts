'use server'

import { GEMINI_API_KEY, GEMINI_MODEL, PROMPT_TEMPLATE, READER_API_KEY, READER_URL } from "@/utils/config"
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseSummary } from "@/utils/helpers"

export const getContent = async (url: string) => {
    const txt = await fetch(READER_URL as string, {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: {
            Authorization: `Bearer ${READER_API_KEY}`,
            'Content-Type': 'application/json',
        },
    })

    if (!txt.ok) {
        throw new Error('Failed to fetch content')
    }

    return await txt.text()
}

export const getSummary = async (url: string) => {
    const content = await getContent(url)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model:  GEMINI_MODEL as string})

    const prompt = PROMPT_TEMPLATE?.replace("[CONTENT]", content)
    if (!prompt) {
        throw new Error('Failed to generate prompt')
    }

    const result = await model.generateContent(prompt)
    return parseSummary(result.response.text())
}
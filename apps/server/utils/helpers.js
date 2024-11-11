import { GEMINI_API_KEY, PROMPT_TEMPLATE, READER_API_KEY, READER_URL } from './config.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const parseSummary = (summary) => {
    const cleanedSummary = summary.replace(/```json\n|```/g, "");
    return JSON.parse(cleanedSummary);
}

export const getContent = async (url, res) => {
    const txt = await fetch(READER_URL, {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: {
            Authorization: `Bearer ${READER_API_KEY}`,
            'Content-Type': 'application/json',
        },
    })

    if (!txt.ok) return res.status(500).json({ error: 'Failed to fetch content' })

    return await txt.text()
}

export const getSummary = async (url, res) => {
    const content = await getContent(url, res)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = PROMPT_TEMPLATE.replace("[CONTENT]", content)

    const result = await model.generateContent(prompt)
    return result.response.text()
}

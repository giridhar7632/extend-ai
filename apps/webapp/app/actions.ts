'use server'

import { EXPIRY_TIME, GEMINI_API_KEY, GEMINI_MODEL, PROMPT_TEMPLATE, READER_API_KEY, READER_URL } from "@/lib/config"
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCurrentTime, getUrlData, insertUrlData, parseSummary } from "@/lib/utils"
import { db } from '@/lib/firestore';

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
    const data = await getUrlData(db, url);
    if (data && data.updatedAt > getCurrentTime() - EXPIRY_TIME){
      return { ...data, updatedAt: new Date(data.updatedAt._seconds), cached: true };
    }

    const content = await getContent(url)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model:  GEMINI_MODEL as string})

    const prompt = PROMPT_TEMPLATE?.replace("[CONTENT]", content)
    if (!prompt) {
        throw new Error('Failed to generate prompt')
    }

    
    const result = await model.generateContent(prompt)
    const parsedResult = parseSummary(result.response.text())
    insertUrlData(db, url, parsedResult)
    
    return parsedResult
}
'use server'

import { EXPIRY_TIME, GEMINI_API_KEY, GEMINI_MODEL, PROMPT_TEMPLATE, READER_API_KEY, READER_URL } from '@/lib/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCurrentTime, hashUrl, parseSummary } from '@/lib/utils'
import { db } from '@/lib/firestore'
import { SummarySchema } from '@/lib/types'
import * as fs from 'fs'

export const getContent = async (url: string) => {
    const data = await getReaderData(url)
    if (data && data.updatedAt > getCurrentTime() - EXPIRY_TIME) {
        return data.content
    }

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

    const content = await txt.text()
    insertReaderData(url, content)

    return content
}

export const getSummary = async (url: string): Promise<SummarySchema> => {
    const data = await getUrlData(url)
    if (data && data.updatedAt > getCurrentTime() - EXPIRY_TIME) {
        return { ...data, updatedAt: new Date(data.updatedAt._seconds), cached: true }
    }

    const content = await getContent(url)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL as string })

    const prompt = PROMPT_TEMPLATE?.replace('[CONTENT]', content)
    if (!prompt) {
        throw new Error('Failed to generate prompt')
    }

    const result = await model.generateContent(prompt)
    const parsedResult = parseSummary(result.response.text())
    insertUrlData(url, parsedResult)

    return parsedResult
}

export async function insertReaderData(url: string, content: string) {
    try {
        const urlHash = hashUrl(url)
        const urlRef = db.doc(`reader/${urlHash}`)
        await urlRef.set({ content, updatedAt: new Date() })
    } catch (error) {
        console.error('Error inserting reader data:', error)
    }
}

export async function getReaderData(url: string) {
    const urlHash = hashUrl(url)
    const doc = await db.collection('reader').doc(urlHash).get()

    if (doc.exists) {
        return doc.data()
    } else {
        return null
    }
}

export async function insertUrlData(url: string, urlRecord: SummarySchema) {
    try {
        const urlHash = hashUrl(url)
        const urlRef = db.doc(`urls/${urlHash}`)
        await urlRef.set({ ...urlRecord, updatedAt: new Date() })
    } catch (error) {
        console.error('Error inserting URL data:', error)
    }
}

export async function getUrlData(url: string) {
    const urlHash = hashUrl(url)
    const doc = await db.collection('urls').doc(urlHash).get()

    if (doc.exists) {
        const data = doc.data()

        if (data?.updatedAt) {
            data.updatedAt = data.updatedAt.toDate()
        }

        return data
    } else {
        return null
    }
}

export async function writeFileToDisk(fileName: string, data: string) {
    fs.writeFile(fileName, data, (err) => {
        console.error('Error writing file:', err)
    })
}

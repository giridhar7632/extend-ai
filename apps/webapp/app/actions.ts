'use server'

import { EXPIRY_TIME, GEMINI_API_KEY, GEMINI_MODEL, PROMPT_TEMPLATE, READER_API_KEY, READER_URL, SUMMARY_PROMPT_TEMPLATE } from '@/lib/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCurrentTime, hashUrl, parseSummary } from '@/lib/utils'
import { db } from '@/lib/firestore'
import { ExtractedData, SummarySchema } from '@/lib/types'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'
import * as fs from 'fs'
import { extractArticleDetailsFromString } from '@/lib/chrome-utils'

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
    const articleData = extractArticleDetailsFromString(content, false)
    insertReaderData(url, articleData)

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

export async function insertReaderData(url: string, articleData: ExtractedData) {
    try {
        const urlHash = hashUrl(url)
        const urlRef = db.doc(`reader/${urlHash}`)
        await urlRef.set({ ...articleData, updatedAt: new Date() })
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

export const getSummaryFromReader = async (url: string): Promise<SummarySchema> => {
    const data = await getUrlData(url)
    if (data && data.updatedAt > getCurrentTime() - EXPIRY_TIME) {
        return { ...data, updatedAt: new Date(data.updatedAt._seconds), cached: true }
    }

    const { title, image, description, content, date } = await scrapeClientRenderedContent(url)
    if(!content) {
        throw new Error('Unable to fetch content')
    }

    fs.writeFile('content.txt', content, (err) => {
        console.error('Error writing file:', err)
    })

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL as string })

    const prompt = SUMMARY_PROMPT_TEMPLATE?.replace('[CONTENT]', content)
    if (!prompt) {
        throw new Error('Failed to generate prompt')
    }

    const result = await model.generateContent(prompt)
    const parsedResult = parseSummary(result.response.text())
    await insertReaderData(url, { title, image, description, content, publishDate: date })
    await insertUrlData(url, { title, image, description, date, ...parsedResult})

    return { title, image, description, date,...parsedResult }
}

export const scrapeClientRenderedContent = async (url: string) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const pageContent = await page.content()
    const $ = cheerio.load(pageContent)

    const getMetaTag = (name: string) => $(`meta[name="${name}"]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content') || $(`meta[name="twitter:${name}"]`).attr('content')
    // let articleContent = $('article').text().trim() || $('main').text().trim();
    // articleContent = articleContent.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');

    let markdown = "";

    /**
     * Recursively traverse the DOM and convert elements to Markdown
     * @param {*} element - The Cheerio element to process
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(element: any) {
        $(element).children().each((_, child) => {
            const tag = $(child)?.get(0)?.tagName;

            if (/h[1-6]/.test(tag as string)) {
                // Handle headings
                const level = Number(tag?.slice(1)) || 0;
                markdown += `${'#'.repeat(level)} ${$(child).text().trim()}\n\n`;
            } else if (tag === 'p') {
                // Handle paragraphs
                markdown += `${$(child).text().trim()}\n\n`;
            } else if (tag === 'ul') {
                // Handle unordered lists
                $(child).find('li').each((_, li) => {
                    markdown += `- ${$(li).text().trim()}\n`;
                });
                markdown += '\n';
            } else if (tag === 'ol') {
                // Handle ordered lists
                $(child).find('li').each((index, li) => {
                    markdown += `${index + 1}. ${$(li).text().trim()}\n`;
                });
                markdown += '\n';
            } else if (tag === 'pre' && $(child).find('code').length > 0) {
                // we don't need codeblocks
                // const codeContent = $(child).find('code').text().trim();
                // markdown += `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
            } else if (tag === 'code') {
                // Handle inline code
                const inlineCode = $(child).text().trim();
                markdown += `\`${inlineCode}\`\n\n`;
            } else if (tag === 'a') {
                // we don't need links
                // const href = $(child).attr('href');
                // const text = $(child).text().trim();
                // if (href) {
                //     markdown += `[${text}](${href})\n\n`;
                // }
            } else {
                // Recursively traverse nested elements
                traverse(child);
            }
        });
    }

    // Start traversal from the main content area
    const mainContent = $('article').length > 0 ? $('article') : $('main');
    if (mainContent.length > 0) {
        traverse(mainContent);
    } else {
        console.error('No main content found.');
    }

    // Clean up unnecessary whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    const publishedDate =
            $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="published_date"]').attr('content') ||
            $('time[datetime]').attr('datetime') ||
            $('meta[name="date"]').attr('content') ||
            $('.published-date').text().trim();

    if (browser) await browser.close()
    
    return ({
        title: $('title').first().text(),
        date: publishedDate || "",
        image: getMetaTag('image') || "",
        description: getMetaTag('description') || "",
        author: getMetaTag('author') || "",
        content: markdown
    })
}
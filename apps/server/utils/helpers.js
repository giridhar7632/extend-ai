import { GEMINI_API_KEY, PROMPT_TEMPLATE, READER_API_KEY, READER_URL } from './config.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import getUrls from 'get-urls'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'

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

export const scrapeStaticContent = async (text) => {
    const urls = Array.from(getUrls(text))
    const requests = urls.map(async url => {
        const response = await fetch(url)
        const html = await response.text()
        const $ = cheerio.load(html)

        const getMetaTag = (name) => $(`meta[name="${name}"]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content') || $(`meta[name="twitter:${name}"]`).attr('content')
        let articleContent = $('article').text().trim() || $('main').text().trim();
        articleContent = articleContent.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
        const publishedDate =
            $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="published_date"]').attr('content') ||
            $('time[datetime]').attr('datetime') ||
            $('meta[name="date"]').attr('content') ||
            $('.published-date').text().trim();

        return ({
            url,
            title: $('title').first().text(),
            image: getMetaTag('image'),
            date: publishedDate,
            description: getMetaTag('description'),
            author: getMetaTag('author'),
            content: articleContent
        })
    })

    return await Promise.all(requests)
}

export const scrapeClientRenderedContent = async (url) => {
    let browser
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const pageContent = await page.content()
    const $ = cheerio.load(pageContent)

    const getMetaTag = (name) => $(`meta[name="${name}"]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content') || $(`meta[name="twitter:${name}"]`).attr('content')
    let articleContent = $('article').text().trim() || $('main').text().trim();
    articleContent = articleContent.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
    
    if (browser) await browser.close()
    
    return ({
        url,
        title: $('title').first().text(),
        image: getMetaTag('image'),
        description: getMetaTag('description'),
        author: getMetaTag('author'),
        content: articleContent
    })
}

async function scrapeAndConvertToMarkdown(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const html = await page.content();
    const $ = cheerio.load(html);

    let markdown = "";

    /**
     * Recursively traverse the DOM and convert elements to Markdown
     * @param {*} element - The Cheerio element to process
     */
    function traverse(element) {
        $(element).children().each((_, child) => {
            const tag = $(child).get(0).tagName;

            if (/h[1-6]/.test(tag)) {
                // Handle headings
                const level = tag.slice(1);
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

    await browser.close();
    return markdown;
}
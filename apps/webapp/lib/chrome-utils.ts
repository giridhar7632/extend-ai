// import { writeFileToDisk } from "@/app/actions";
import { MAX_MODEL_CHARS } from './config'
import { ExtractedData } from './types'

/*
 * Creates a summarization session. If the model has already been downloaded, this function will
 * create the session and return it. If the model needs to be downloaded, this function will
 * wait for the download to finish before resolving the promise.
 *
 * If a downloadProgressCallback is provided, the function will add the callback to the session
 * creation.
 *
 * The function expects the model availability to be either `readily` or `after-download`, so the
 * availability must be checked before calling it. If availability is `no`, the function will throw
 *  an error.
 */
export const createSummarizationSession = async (
    type: AISummarizerType,
    format: AISummarizerFormat,
    length: AISummarizerLength,
    downloadProgressListener?: (ev: DownloadProgressEvent) => void,
): Promise<AISummarizer> => {
    const canSummarize = await window.ai.summarizer!.capabilities()
    if (canSummarize.available === 'no') {
        throw new Error('AI Summarization is not supported')
    }

    let monitor = undefined
    if (downloadProgressListener) {
        monitor = (m: AICreateMonitor) => {
            m.addEventListener('downloadprogress', downloadProgressListener)
        }
    }

    const summarizationSession = await window.ai.summarizer!.create({ type, format, length, monitor })
    return summarizationSession
}

export function extractArticleDetailsFromString(data: string, shorten: boolean = true): ExtractedData {
    const titleRegex = /Title:\s*(.*?)(?=\n|$)/
    const publishDateRegex = /Published Time:\s*(\S+)/
    const descriptionRegex = /Description:\s*(\S+)/
    const mdContentRegex = /Markdown Content:\s*(.*)/s

    const titleMatch = data.match(titleRegex)
    const title = titleMatch ? titleMatch[1] : 'Untitled'

    const publishDateMatch = data.match(publishDateRegex)
    const publishDate = publishDateMatch ? publishDateMatch[1] : ''

    const descriptionMatch = data.match(descriptionRegex)
    const description = descriptionMatch ? descriptionMatch[1].trim() : ''

    const contentMatch = data.match(mdContentRegex)
    const markdown = contentMatch ? contentMatch[1].trim() : ''
    // writeFileToDisk('before_extraction.txt', markdown);

    let extractedContent = markdown.replace(/!\[.*?\]\(.*?\)/g, '') // remove images like ![alt](url)
    extractedContent = extractedContent.replace(/\[.*?\]\(.*?\)/g, '') // remove links like [text](url)
    // eslint-disable-next-line
    extractedContent = extractedContent.replace(/^[\-\_+#]+$/gm, '') // remove horizontal rules like --- or ***
    // extractedContent = extractedContent.replace(/\*\*[^*]+\*\*/g, '').replace(/__[^_]+__/g, '') // remove bold and italic markdown
    extractedContent = extractedContent
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim() // normalize multiple newlines into a single space
    extractedContent = extractedContent.replace(/```[\s\S]*?```/g, '') // remove codes like ```code block```
    extractedContent = extractedContent.replace(/`[^`]*`/g, '') // remove inline codes like `code`
    extractedContent = extractedContent.replace(/^#{1,6}\s?.*/gm, '') // remove all headers (anything like # Header, ## Subheader, etc.)

    if (extractedContent.length > 4000 && shorten) {
        // The underlying model has a context of 1,024 tokens, out of which 26 are used by the internal prompt,
        // leaving about 998 tokens for the input text. Each token corresponds, roughly, to about 4 characters, so 4,000
        // is used to trim the content that might be too long to summarize.
        extractedContent = extractedContent.substring(0, MAX_MODEL_CHARS) // truncate the content to 4000 characters
    }

    // writeFileToDisk('after_extraction.txt', extractedContent);

    return {
        title,
        publishDate,
        description,
        content: extractedContent,
    }
}

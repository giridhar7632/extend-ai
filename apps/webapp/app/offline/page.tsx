'use client'

import React, { useEffect, useState } from 'react'
import InputForm from '../InputForm'
import Link from 'next/link'
import { getContent, getUrlData, insertUrlData } from '../actions'
import { SummarySchema } from '@/lib/types'
import { createSummarizationSession, extractArticleDetailsFromString } from '@/lib/chrome-utils'
import { getCurrentTime } from '@/lib/utils'
import { EXPIRY_TIME } from '@/lib/config'

export default function OfflineUse() {
    const [isValidBrowser, setIsValidBrowser] = useState<boolean>(false)
    const [summarizationApiAvailable, setSummarizationApiAvailable] = useState<boolean>(false)
    useEffect(() => {
        if (navigator?.userAgent.includes('Chrome')) {
            setIsValidBrowser(true)
            if (typeof window !== 'undefined') {
                if (window.ai !== undefined && window.ai.summarizer !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    window.ai.summarizer.capabilities().then((capabilities: any) => {
                        console.log('capabilities', capabilities)
                        setSummarizationApiAvailable(capabilities !== 'no')
                    })
                }
            }
        }
    }, [])

    async function summarizeLink(url: string): Promise<SummarySchema> {
        if (summarizationApiAvailable) {
            const data = await getUrlData(url)
            if (data && data.updatedAt > getCurrentTime() - EXPIRY_TIME) {
                return { ...data, updatedAt: new Date(data.updatedAt._seconds), cached: true }
            }

            const content = await getContent(url)
            let session = await createSummarizationSession(
                'key-points' as AISummarizerType,
                'markdown' as AISummarizerFormat,
                'short' as AISummarizerLength,
            )
            const articleData = extractArticleDetailsFromString(content)
            let summary = await session.summarize(articleData.content)
            const returnData = {
                title: articleData.title,
                description: articleData.description,
                date: articleData.publishDate,
                key_points: summary
                    .split('\n')
                    .map((point: string) =>
                        point
                            .trim()
                            .replace(/^\*\s*/, '')
                            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'),
                    )
                    .filter((point: string) => point !== ''),
                cached: false,
                updatedAt: new Date(),
            }
            insertUrlData(url, returnData)
            return returnData
        } else {
            throw new Error('API not available')
        }
    }

    return (
        <div className="grid justify-items-center min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-1 flex-col gap-8 pt-20 w-[70%]">
                {!isValidBrowser ? (
                    <>
                        <h1 className="text-4xl font-bold text-center">Unsupported browser</h1>
                        <p className="text-center text-neutral-600">
                            You should use chrome (&gt;=129.0.6639.0) for offline mode.
                        </p>
                    </>
                ) : !summarizationApiAvailable ? (
                    <>
                        <h1 className="text-4xl font-bold text-center">API not available</h1>
                        <p className="text-center text-neutral-600">
                            Try upgrading your chrome (&gt;=129.0.6639.0) or check requirements.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold text-center">Extend-ai (chrome)</h1>
                        <InputForm type="online" formSubmit={summarizeLink} />
                    </>
                )}
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                <Link
                    className="flex items-center gap-2 italic underline underline-offset-4 hover:decoration-wavy hover:underline-offset-4"
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    use online mode
                </Link>
            </footer>
        </div>
    )
}

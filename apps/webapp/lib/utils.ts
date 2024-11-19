import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getCurrentTime() {
    return Date.now() / 1000
}

export function hashUrl(url: string) {
    return crypto.createHash('sha256').update(url).digest('hex')
}

export const parseSummary = (summary: string) => {
    const cleanedSummary = summary.replace(/```json\n|```/g, '')
    return JSON.parse(cleanedSummary)
}

export const errorHandler = (error: Error) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return Response.json({ error: 'malformatted id' }, { status: 400 })
    } else if (error.name === 'ValidationError') {
        return Response.json({ error: error.message }, { status: 400 })
    } else if (error.name === 'JsonWebTokenError') {
        return Response.json({ error: 'invalid token' }, { status: 401 })
    } else if (error.name === 'TokenExpiredError') {
        return Response.json({ error: 'token expired' }, { status: 401 })
    } else {
        return Response.json({ error: 'internal server error' }, { status: 500 })
    }
}

export function getBrowserInfo() {
    const userAgent = navigator.userAgent

    if (userAgent.includes('Chrome') && !userAgent.includes('Edge') && !userAgent.includes('OPR')) {
        return 'Chrome'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return 'Safari'
    } else if (userAgent.includes('Firefox')) {
        return 'Firefox'
    } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
        return 'Opera'
    } else if (userAgent.includes('Edge') || userAgent.includes('Edg')) {
        return 'Edge'
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
        return 'Internet Explorer'
    }

    return 'Unknown'
}

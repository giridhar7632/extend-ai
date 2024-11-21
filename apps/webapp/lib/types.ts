export interface ExtractedData {
    title: string
    publishDate?: string
    image?: string
    date?: string
    description?: string
    content: string
}

export type SummarySchema = {
    title?: string
    description?: string
    image?: string
    date?: string
    key_points?: string[]
    cached?: boolean
    updatedAt?: Date
}

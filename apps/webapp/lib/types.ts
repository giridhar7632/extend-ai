export interface ExtractedData {
    title: string
    publishDate: string
    description: string
    content: string
}

export type SummarySchema = {
    title?: string
    description?: string
    date?: string
    key_points?: string[]
    cached?: boolean
    updatedAt?: Date
}

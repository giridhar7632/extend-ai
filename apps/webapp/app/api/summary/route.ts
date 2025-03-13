import { NextRequest } from 'next/server'
import { getSummary } from '../../actions'
import { errorHandler } from '@/lib/utils'
 
async function handler(req: NextRequest) {
    try {
        let url = ""

        if(req.method === 'GET') {
          const searchParams = req.nextUrl.searchParams
          url = decodeURIComponent(searchParams.get('url')?.split('?')[0] || "")
        } else {
          const body = await req.json()
          url = body.url
        }
        if (!url) return Response.json({ message: 'Missing required data' }, { status: 400 })

        const content = await getSummary(url?.split('?')[0] as string)
        return Response.json(content, { status: 200 })
    } catch (error) {
        errorHandler(error as Error)
    }
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
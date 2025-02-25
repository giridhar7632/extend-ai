import 'dotenv/config'
import morgan from 'morgan'
import express from 'express'
import { PORT } from './utils/config.js'
import { errorHandler, unknownEndpoint } from './utils/middleware.js'
import { getContent, getSummary, parseSummary, scrapeClientRenderedContent } from './utils/helpers.js'
import cors from 'cors';

const app = express()
app.use(cors());
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
//     if (req.method === 'OPTIONS') {
//         return res.sendStatus(204); // Handle preflight request
//     }
    
//     next();
// });

app.use(express.json())
app.use(morgan('dev'))

app.get('/status', (_req, res) => {
    res.status(200).json({
        status: 'ok',
    })
})

app.all('/content', async (req, res) => {
    try {
        const url = req.method === 'GET' ? req.query.url : req.body.url
        if (!url) return res.status(400).json({ error: 'Missing required data' })

        const content = await getContent(url, res)
        res.status(200).json({ content })
    } catch (error) {
        errorHandler(error, res)
    }
})

app.all('/summary', async (req, res) => {
    try {
        const url = req.method === 'GET' ? req.query.url : req.body.url
        if (!url) return res.status(400).json({ error: 'Missing required data' })

        const summary = await getSummary(url, res)
        const parsedSummary = parseSummary(summary)
        res.status(200).json({ summary: parsedSummary })
    } catch (error) {
        errorHandler(error, res)
    }
})

app.all('/reader', async (req, res) => {
    try {
        const url = req.method === 'GET' ? req.query.url : req.body.url
        const content = await scrapeClientRenderedContent(url)

        res.status(200).json({ content })
    } catch (error) {
        errorHandler(error, res)
    }
})

app.use(unknownEndpoint)

app.listen(PORT, () => {
    console.log(`🚀 Server live on ${PORT}`)
})

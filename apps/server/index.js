import express from 'express'
import 'dotenv/config'
import { PORT } from './utils/constants.js'

const app = express()
app.use(express.json())

app.get('/status', (_req, res) => {
    res.status(200).json({
        status: 'ok',
    })
})

app.listen(PORT, () => {
    console.log(`🚀 Server live on ${PORT}`)
})

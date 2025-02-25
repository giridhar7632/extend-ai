export const unknownEndpoint = (_req, res) => {
    res.status(404).send({ error: 'unknown endpoint' })
}

export const errorHandler = (error, res) => {
    console.error(error)

    if (error.name === 'CastError') {
        return res.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'invalid token' })
    } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'token expired' })
    } else {
        return res.status(500).json({ error: 'internal server error' })
    }
}

import app from '../src/index'

export const config = { runtime: 'nodejs' }

export default async function handler(req: any, res: any) {
    const url = `https://${req.headers.host}${req.url}`
    const request = new Request(url, {
        method: req.method,
        headers: req.headers as any,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req
    })
    const response = await app.fetch(request)
    res.status(response.status)
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
}

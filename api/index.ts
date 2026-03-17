import app from '../src/index'

export const config = { runtime: 'nodejs' }

export default async function handler(req: any, res: any) {
    const url = `https://${req.headers.host}${req.url}`
    const isBodyMethod = !['GET', 'HEAD'].includes(req.method)

    const request = new Request(url, {
        method: req.method,
        headers: req.headers as any,
        body: isBodyMethod ? req : undefined,
        ...(isBodyMethod ? { duplex: 'half' } : {})
    } as any)

    const response = await app.fetch(request)
    res.status(response.status)
    response.headers.forEach((value: string, key: string) => res.setHeader(key, value))
    res.end(await response.text())
}

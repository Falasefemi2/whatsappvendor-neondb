import { handle } from 'hono/vercel'
import app from '../src/index'

console.log('1. imports loaded')

export const config = { runtime: 'nodejs' }

console.log('2. config set')

const handler = handle(app)

console.log('3. handler created')

export default handler

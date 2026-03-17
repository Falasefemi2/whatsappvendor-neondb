import { handle } from 'hono/vercel'
// Ensure this path is exactly correct relative to api/index.ts
import app from '../src/index.js'

export const config = { runtime: 'nodejs' }

// Re-exporting or explicitly using the handle
const handler = handle(app)

export default handler

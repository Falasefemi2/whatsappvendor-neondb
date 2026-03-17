import { handle } from 'hono/vercel'
// Ensure this path is exactly correct relative to api/index.ts
import app from '../src/index'

export const config = { runtime: 'node' }

// Re-exporting or explicitly using the handle
const handler = handle(app)

export default handler

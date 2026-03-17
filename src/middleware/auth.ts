import { MiddlewareHandler } from "hono"
import { verify } from "hono/jwt"
import { getCookie } from "hono/cookie"
import { eq } from "drizzle-orm"
import { users } from "../db/schema"
import { db } from "../db"
import { AppContext } from "../lib/types"

export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
    const token = getCookie(c, "token")
    if (!token) return c.json({ message: "Unauthorized" }, 401)

    const payload = await verify(token, Bun.env.JWT_SECRET!, "HS256")
    if (!payload) return c.json({ message: "Unauthorized" }, 401)

    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId as string),
        with: { vendor: true }
    })

    if (!user) return c.json({ message: "User not found" }, 401)

    c.set("user", user)
    await next()
}

import { MiddlewareHandler } from "hono"
import { AppContext } from "../lib/types"

export const adminMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
    const user = c.get("user")

    if (user.role !== "admin") {
        return c.json({ message: "Forbidden" }, 403)
    }

    await next()
}

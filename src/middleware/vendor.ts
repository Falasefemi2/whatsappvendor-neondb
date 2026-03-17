import { MiddlewareHandler } from "hono"
import { AppContext } from "../lib/types"

export const vendorMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
    const user = c.get("user")
    if (!user.vendor) return c.json({ message: "Vendor profile not found" }, 403)
    if (user.role !== "vendor") return c.json({ message: "Only vendors allowed" }, 403)
    await next()
}

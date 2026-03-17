import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { authMiddleware } from "../middleware/auth"
import { vendorMiddleware } from "../middleware/vendor"
import { getDashboardStats } from "../services/dashboard-service"
import type { AppContext } from "../lib/types"

const dashboard = new OpenAPIHono<AppContext>()

dashboard.openapi(
    createRoute({
        method: "get",
        path: "/stats",
        tags: ["Dashboard"],
        summary: "Get vendor dashboard stats",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        responses: {
            200: {
                description: "Dashboard stats",
                content: {
                    "application/json": {
                        schema: z.object({
                            totalProducts: z.number(),
                            activeProducts: z.number(),
                            totalVisits: z.number(),
                            recentVisits: z.number()
                        })
                    }
                }
            },
            404: {
                description: "Vendor not found",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() })
                    }
                }
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() })
                    }
                }
            }
        },
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const stats = await getDashboardStats(user.vendor.id)
            return c.json(stats, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

export default dashboard

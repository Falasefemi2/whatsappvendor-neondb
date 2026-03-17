import { and, count, eq, gte, lte } from "drizzle-orm"
import { db } from "../db"
import { products, storeVisits } from "../db/schema"

export const recordVisit = async (vendorId: string, ip: string) => {
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const endOfDay = new Date(now.setHours(23, 59, 59, 999))

    const existing = await db.query.storeVisits.findFirst({
        where: and(
            eq(storeVisits.vendorId, vendorId),
            eq(storeVisits.ip, ip),
            gte(storeVisits.visitedAt, startOfDay),
            lte(storeVisits.visitedAt, endOfDay)
        )
    })

    if (existing) return

    await db.insert(storeVisits).values({ vendorId, ip })
}

export const getDashboardStats = async (vendorId: string) => {
    // get last 7 days date
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // total products
    const [{ totalProducts }] = await db
        .select({ totalProducts: count() })
        .from(products)
        .where(eq(products.vendorId, vendorId))

    // active products
    const [{ activeProducts }] = await db
        .select({ activeProducts: count() })
        .from(products)
        .where(and(
            eq(products.vendorId, vendorId),
            eq(products.active, true)
        ))

    // total visits
    const [{ totalVisits }] = await db
        .select({ totalVisits: count() })
        .from(storeVisits)
        .where(eq(storeVisits.vendorId, vendorId))

    // visits last 7 days
    const [{ recentVisits }] = await db
        .select({ recentVisits: count() })
        .from(storeVisits)
        .where(and(
            eq(storeVisits.vendorId, vendorId),
            gte(storeVisits.visitedAt, sevenDaysAgo)
        ))

    return {
        totalProducts,
        activeProducts,
        totalVisits,
        recentVisits
    }
}

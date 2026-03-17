import type { users, vendors } from "../db/schema"

type User = typeof users.$inferSelect & {
    vendor: typeof vendors.$inferSelect | null
}

export type AppContext = {
    Variables: {
        user: User
    }
}

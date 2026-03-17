import "dotenv/config"
import { db } from "../db"
import { users } from "../db/schema"

async function seed() {

    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env")
    }

    const passwordHash = await Bun.password.hash(password)

    await db.insert(users).values({
        name: "Falase Femi",
        email,
        passwordHash,
        role: "admin"
    })

    console.log("Admin created")
}

seed()

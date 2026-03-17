import "dotenv/config"
import { db } from "../db"
import { users } from "../db/schema"
import bcrypt from 'bcryptjs'

async function seed() {

    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env")
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await db.insert(users).values({
        name: "Falase Femi",
        email,
        passwordHash,
        role: "admin"
    })

    console.log("Admin created")
}

seed()

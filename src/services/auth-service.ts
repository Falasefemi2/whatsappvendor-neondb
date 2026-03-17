import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, vendors } from "../db/schema";
import { sendApprovalEmail, sendApprovalPendingEmail } from "../lib/mailer";
import { sign } from "hono/jwt";

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    storeName: string;
    phone: string;
    // slug: string;
}

const generateSlug = (storeName: string) => {
    return storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

const checkEmailExists = async (email: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    })
    return !!user
}

const hashPassword = async (password: string) => {
    return await Bun.password.hash(password);
}

export const registerVendor = async (payload: RegisterPayload) => {
    const { name, email, password, storeName, phone } = payload
    const emailExists = await checkEmailExists(email);
    if (emailExists) throw new Error("Email already in use")

    const passwordHash = await hashPassword(password);
    const slug = generateSlug(storeName);

    await db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({
            name,
            email,
            passwordHash,
            role: "vendor"
        }).returning()
        await tx.insert(vendors).values({
            userId: user.id,
            storeName: storeName,
            phone: phone,
            logoUrl: null,
            slug: slug
        })
    })
    await sendApprovalPendingEmail(name, email, slug)
}

export const loginVendor = async (email: string, password: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
            vendor: true
        }
    })
    if (!user) throw new Error("Invalid credentials")

    const validPassword = await Bun.password.verify(password, user.passwordHash)
    if (!validPassword) throw new Error("Invalid credentials")
    if (user.role !== "admin" && !user.vendor?.approved) {
        throw new Error("Account pending approval")
    }
    const token = await sign(
        { userId: user.id, role: user.role },
        Bun.env.JWT_SECRET!,
        "HS256"
    )

    return { token, user }
}

export const getCurrentUser = async (userId: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: { vendor: true }
    })
    if (!user) throw new Error("User not found")
    return user
}

export const getAllVendors = async () => {
    return await db.query.vendors.findMany({
        with: { user: true }
    })
}

export const getPendingVendors = async () => {
    return await db.query.vendors.findMany({
        where: eq(vendors.approved, false),
        with: { user: true }
    })
}

export const getApprovedVendors = async () => {
    return await db.query.vendors.findMany({
        where: eq(vendors.approved, true),
        with: { user: true }
    })
}

export const approveVendor = async (vendorId: string) => {
    const [vendor] = await db
        .update(vendors)
        .set({
            approved: true,
            approvedAt: new Date()
        })
        .where(eq(vendors.id, vendorId))
        .returning()

    if (!vendor) throw new Error("Vendor not found")

    const user = await db.query.users.findFirst({
        where: eq(users.id, vendor.userId)
    })

    if (user) {
        await sendApprovalEmail(user.name, user.email, vendor.slug)
    }

    return vendor
}

export const getVendorBySlug = async (slug: string) => {
    const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.slug, slug),
        with: {
            products: {
                with: { images: true }
            }
        }
    })

    if (!vendor) throw new Error("Store not found")
    return vendor
}

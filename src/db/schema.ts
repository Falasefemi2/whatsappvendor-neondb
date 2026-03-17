import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    numeric,
    integer
} from "drizzle-orm/pg-core"

import { relations } from "drizzle-orm"

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 50 }).default("vendor").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const vendors = pgTable("vendors", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    logoUrl: text("logo_url"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    approved: boolean("approved").default(false).notNull(),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").default(0),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const productImages = pgTable("product_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
})

export const storeVisits = pgTable("store_visits", {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendors.id, { onDelete: "cascade" }),
    ip: varchar("ip", { length: 45 }).notNull().default("unknown"),
    visitedAt: timestamp("visited_at").defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one }) => ({
    vendor: one(vendors)
}))


export const vendorsRelations = relations(vendors, ({ one, many }) => ({
    user: one(users, {
        fields: [vendors.userId],
        references: [users.id],
    }),

    products: many(products),

    visits: many(storeVisits)
}))


export const productsRelations = relations(products, ({ one, many }) => ({
    vendor: one(vendors, {
        fields: [products.vendorId],
        references: [vendors.id],
    }),

    images: many(productImages)
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.productId],
        references: [products.id],
    })
}))

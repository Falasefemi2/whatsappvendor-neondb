import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { authMiddleware } from "../middleware/auth"
import { vendorMiddleware } from "../middleware/vendor"
import {
    createProduct,
    deleteProduct,
    getProductById,
    getVendorProducts,
    toggleProductActive,
    updateProduct,
} from "../services/product-service"
import type { AppContext } from "../lib/types"

const product = new OpenAPIHono<AppContext>()

const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.string(),
    quantity: z.number().nullable(),
    active: z.boolean(),
    images: z.array(z.object({ url: z.string() }))
})

const updatedProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.string(),
    quantity: z.number().nullable(),
    active: z.boolean(),
    vendorId: z.string(),
    createdAt: z.string()
})

const errorSchema = z.object({ message: z.string() })

// GET SINGLE PRODUCT
product.openapi(
    createRoute({
        method: "get",
        path: "/{id}",
        tags: ["Products"],
        summary: "Get product by ID",
        request: {
            params: z.object({ id: z.string() })
        },
        responses: {
            200: {
                description: "Product details",
                content: { "application/json": { schema: productSchema } }
            },
            404: {
                description: "Product not found",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const { id } = c.req.valid("param")
            const data = await getProductById(id)
            return c.json(data, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 404)
        }
    }
)

// GET VENDOR PRODUCTS
product.openapi(
    createRoute({
        method: "get",
        path: "/",
        tags: ["Products"],
        summary: "Get all products for logged in vendor",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        responses: {
            200: {
                description: "List of vendor products",
                content: { "application/json": { schema: z.array(productSchema) } }
            },
            404: {
                description: "Vendor not found",
                content: { "application/json": { schema: errorSchema } }
            },
            400: {
                description: "Bad request",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const data = await getVendorProducts(user.vendor.id)
            return c.json(data, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// CREATE PRODUCT
product.openapi(
    createRoute({
        method: "post",
        path: "/",
        tags: ["Products"],
        summary: "Create a new product with images",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: z.object({
                            name: z.string().min(1),
                            description: z.string().optional(),
                            price: z.string(),
                            quantity: z.string(),
                            images: z.any()
                        })
                    }
                }
            }
        },
        responses: {
            201: {
                description: "Product created",
                content: { "application/json": { schema: z.object({ message: z.string() }) } }
            },
            404: {
                description: "Vendor not found",
                content: { "application/json": { schema: errorSchema } }
            },
            400: {
                description: "Bad request",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const formData = await c.req.formData()
            const name = formData.get("name") as string
            const description = formData.get("description") as string
            const price = Number(formData.get("price"))
            const quantity = Number(formData.get("quantity"))
            const images = formData.getAll("images") as File[]
            if (!name || !price || !images.length) {
                return c.json({ message: "Name, price and images are required" }, 400)
            }
            await createProduct({ name, description, price, quantity, vendorId: user.vendor.id, images })
            return c.json({ message: "Product created successfully" }, 201)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// UPDATE PRODUCT
product.openapi(
    createRoute({
        method: "patch",
        path: "/{id}",
        tags: ["Products"],
        summary: "Update a product",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        request: {
            params: z.object({ id: z.string() }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: z.string().optional(),
                            description: z.string().optional(),
                            price: z.number().optional(),
                            quantity: z.number().optional()
                        })
                    }
                }
            }
        },
        responses: {
            200: {
                description: "Product updated",
                content: { "application/json": { schema: updatedProductSchema } }
            },
            404: {
                description: "Vendor not found",
                content: { "application/json": { schema: errorSchema } }
            },
            400: {
                description: "Bad request",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const { id } = c.req.valid("param")
            const body = c.req.valid("json")
            const data = await updateProduct(id, user.vendor.id, body)
            return c.json(data, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// DELETE PRODUCT
product.openapi(
    createRoute({
        method: "delete",
        path: "/{id}",
        tags: ["Products"],
        summary: "Delete a product",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        request: {
            params: z.object({ id: z.string() })
        },
        responses: {
            200: {
                description: "Product deleted",
                content: { "application/json": { schema: z.object({ message: z.string() }) } }
            },
            404: {
                description: "Vendor not found",
                content: { "application/json": { schema: errorSchema } }
            },
            400: {
                description: "Bad request",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const { id } = c.req.valid("param")
            await deleteProduct(id, user.vendor.id)
            return c.json({ message: "Product deleted" }, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// TOGGLE ACTIVE
product.openapi(
    createRoute({
        method: "patch",
        path: "/{id}/toggle",
        tags: ["Products"],
        summary: "Toggle product active status",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, vendorMiddleware],
        request: {
            params: z.object({ id: z.string() })
        },
        responses: {
            200: {
                description: "Product status toggled",
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string(),
                            active: z.boolean()
                        })
                    }
                }
            },
            404: {
                description: "Vendor not found",
                content: { "application/json": { schema: errorSchema } }
            },
            400: {
                description: "Bad request",
                content: { "application/json": { schema: errorSchema } }
            }
        }
    }),
    async (c) => {
        try {
            const user = c.get("user")
            if (!user.vendor) return c.json({ message: "Vendor not found" }, 404)
            const { id } = c.req.valid("param")
            const data = await toggleProductActive(id, user.vendor.id)
            return c.json(data, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

export default product

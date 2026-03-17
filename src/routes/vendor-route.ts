import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { authMiddleware } from "../middleware/auth"
import { adminMiddleware } from "../middleware/admin"
import {
    getAllVendors,
    getApprovedVendors,
    getPendingVendors,
    getVendorBySlug,
    approveVendor
} from "../services/auth-service"
import type { AppContext } from "../lib/types"

const vendor = new OpenAPIHono<AppContext>()

// GET STORE BY SLUG
vendor.openapi(
    createRoute({
        method: "get",
        path: "/stores/{slug}",
        tags: ["Vendors"],
        summary: "Get public store by slug",
        request: {
            params: z.object({ slug: z.string() })
        },
        responses: {
            200: {
                description: "Store details with products",
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string(),
                            storeName: z.string(),
                            slug: z.string(),
                            logoUrl: z.string().nullable(),
                            products: z.array(z.object({
                                id: z.string(),
                                name: z.string(),
                                price: z.string(),
                                images: z.array(z.object({ url: z.string() }))
                            }))
                        })
                    }
                }
            },
            404: {
                description: "Store not found",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() })
                    }
                }
            }
        }
    }),
    async (c) => {
        try {
            const { slug } = c.req.valid("param")
            const store = await getVendorBySlug(slug)
            return c.json(store, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 404)
        }
    }
)

// GET ALL VENDORS
vendor.openapi(
    createRoute({
        method: "get",
        path: "/admin/vendors",
        tags: ["Admin"],
        summary: "Get all vendors",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, adminMiddleware],
        responses: {
            200: {
                description: "List of all vendors",
                content: {
                    "application/json": {
                        schema: z.array(z.object({
                            id: z.string(),
                            storeName: z.string(),
                            approved: z.boolean(),
                            slug: z.string()
                        }))
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
        }
    }),
    async (c) => {
        try {
            const vendors = await getAllVendors()
            return c.json(vendors, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// GET PENDING VENDORS
vendor.openapi(
    createRoute({
        method: "get",
        path: "/admin/vendors/pending",
        tags: ["Admin"],
        summary: "Get pending vendors",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, adminMiddleware],
        responses: {
            200: {
                description: "List of pending vendors",
                content: {
                    "application/json": {
                        schema: z.array(z.object({
                            id: z.string(),
                            storeName: z.string(),
                            approved: z.boolean()
                        }))
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
        }
    }),
    async (c) => {
        try {
            const vendors = await getPendingVendors()
            return c.json(vendors, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// GET APPROVED VENDORS
vendor.openapi(
    createRoute({
        method: "get",
        path: "/admin/vendors/approved",
        tags: ["Admin"],
        summary: "Get approved vendors",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, adminMiddleware],
        responses: {
            200: {
                description: "List of approved vendors",
                content: {
                    "application/json": {
                        schema: z.array(z.object({
                            id: z.string(),
                            storeName: z.string(),
                            approved: z.boolean()
                        }))
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
        }
    }),
    async (c) => {
        try {
            const vendors = await getApprovedVendors()
            return c.json(vendors, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 400)
        }
    }
)

// APPROVE VENDOR
vendor.openapi(
    createRoute({
        method: "patch",
        path: "/admin/vendors/{id}/approve",
        tags: ["Admin"],
        summary: "Approve a vendor",
        security: [{ cookieAuth: [] }],
        middleware: [authMiddleware, adminMiddleware],
        request: {
            params: z.object({ id: z.string() })
        },
        responses: {
            200: {
                description: "Vendor approved",
                content: {
                    "application/json": {
                        schema: z.object({
                            message: z.string(),
                            vendor: z.object({
                                id: z.string(),
                                storeName: z.string(),
                                approved: z.boolean()
                            })
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
            }
        }
    }),
    async (c) => {
        try {
            const { id } = c.req.valid("param")
            const approvedVendor = await approveVendor(id)
            return c.json({ message: "Vendor approved", vendor: approvedVendor }, 200)
        } catch (error: any) {
            return c.json({ message: error.message }, 404)
        }
    }
)

export default vendor

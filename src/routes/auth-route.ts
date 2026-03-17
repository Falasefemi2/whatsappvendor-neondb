import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { getCookie, setCookie } from "hono/cookie"
import { getCurrentUser, loginVendor, registerVendor } from "../services/auth-service"
import type { AppContext } from "../lib/types"
import { verify } from "hono/jwt"

const auth = new OpenAPIHono<AppContext>()

// REGISTER
auth.openapi(
    createRoute({
        method: "post",
        path: "/register",
        tags: ["Auth"],
        summary: "Register a new vendor",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: z.string().min(1),
                            email: z.string().email(),
                            password: z.string().min(8),
                            storeName: z.string().min(1),
                            phone: z.string().min(1)
                        })
                    }
                }
            }
        },
        responses: {
            201: {
                description: "Registration successful",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() })
                    }
                }
            },
            400: {
                description: "Email already in use",
                content: {
                    "application/json": {
                        schema: z.object({ message: z.string() })
                    }
                }
            },
            500: {
                description: "Registration failed",
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
            const body = c.req.valid("json")
            await registerVendor(body)
            return c.json({ message: "Registration successful, check your email for approval" }, 201)
        } catch (error: any) {
            return c.json({ message: error.message || "Registration failed" }, 500)
        }
    }
)

// LOGIN
auth.openapi(
    createRoute({
        method: "post",
        path: "/login",
        tags: ["Auth"],
        summary: "Login as vendor or admin",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            email: z.string().email(),
                            password: z.string().min(8)
                        })
                    }
                }
            }
        },
        responses: {
            200: {
                description: "Login successful",
                content: {
                    "application/json": {
                        schema: z.object({
                            message: z.string(),
                            user: z.object({
                                id: z.string(),
                                name: z.string(),
                                email: z.string(),
                                role: z.string()
                            })
                        })
                    }
                }
            },
            401: {
                description: "Invalid credentials",
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
            const { email, password } = c.req.valid("json")
            const { token, user } = await loginVendor(email, password)
            setCookie(c, "token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
                maxAge: 60 * 60 * 24 * 7
            })
            return c.json({ message: "Login successful", user }, 200)
        } catch (error: any) {
            return c.json({ message: error.message || "Login failed" }, 401)
        }
    }
)

auth.openapi(
    createRoute({
        method: "get",
        path: "/me",
        tags: ["Auth"],
        summary: "Get current logged in user",
        responses: {
            200: {
                description: "Current user",
                content: {
                    "application/json": {
                        schema: z.object({
                            user: z.object({
                                id: z.string(),
                                name: z.string(),
                                email: z.string(),
                                role: z.string()
                            })
                        })
                    }
                }
            },
            401: {
                description: "Unauthorized",
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
            const token = getCookie(c, "token")
            if (!token) return c.json({ message: "Unauthorized" }, 401)

            const payload = await verify(token, Bun.env.JWT_SECRET!, "HS256")
            const user = await getCurrentUser(payload.userId as string)

            return c.json({ user }, 200)
        } catch {
            return c.json({ message: "Unauthorized" }, 401)
        }
    }
)

export default auth

import { db } from "../db"
import { products, productImages } from "../db/schema"
import { uploadImage, deleteImage } from "../lib/supabase"
import { eq } from "drizzle-orm"

interface CreateProductPayload {
    name: string
    description: string
    price: number
    quantity: number
    vendorId: string
    images: File[]
}

interface UpdateProductPayload {
    name?: string
    description?: string
    price?: number
    quantity?: number
}

export const createProduct = async (payload: CreateProductPayload) => {
    const { name, description, price, quantity, vendorId, images } = payload

    const imageUrls = await Promise.all(
        images.map(image => uploadImage(image))
    ).catch(() => {
        throw new Error("Image upload failed")
    })

    await db.transaction(async (tx) => {
        const [product] = await tx.insert(products).values({
            name,
            description,
            price: price.toString(),
            quantity,
            vendorId
        }).returning()

        await tx.insert(productImages).values(
            imageUrls.map(url => ({
                productId: product.id,
                url
            }))
        )

        return product
    }).catch(async (error) => {
        await Promise.all(imageUrls.map(url => deleteImage(url)))
        throw new Error(error.message)
    })
}

export const getVendorProducts = async (vendorId: string) => {
    const vendorProducts = await db.query.products.findMany({
        where: eq(products.vendorId, vendorId),
        with: { images: true }
    })
    return vendorProducts
}

export const getProductById = async (productId: string) => {
    const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        with: { images: true }
    })
    if (!product) throw new Error("Product not found")
    return product
}

export const updateProduct = async (
    productId: string,
    vendorId: string,
    payload: UpdateProductPayload
) => {
    const product = await getProductById(productId)
    if (product.vendorId !== vendorId) throw new Error("Unauthorized")

    const [updated] = await db
        .update(products)
        .set({
            ...payload,
            price: payload.price?.toString()
        })
        .where(eq(products.id, productId))
        .returning()

    return updated
}

export const deleteProduct = async (
    productId: string,
    vendorId: string
) => {
    const product = await getProductById(productId)
    if (product.vendorId !== vendorId) throw new Error("Unauthorized")

    await Promise.all(
        product.images.map(image => deleteImage(image.url))
    )

    await db.delete(products)
        .where(eq(products.id, productId))
}

export const toggleProductActive = async (
    productId: string,
    vendorId: string
) => {
    const product = await getProductById(productId)
    if (product.vendorId !== vendorId) throw new Error("Unauthorized")

    const [updated] = await db
        .update(products)
        .set({ active: !product.active })
        .where(eq(products.id, productId))
        .returning()

    return updated
}

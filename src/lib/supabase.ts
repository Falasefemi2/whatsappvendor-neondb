import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    Bun.env.SUPABASE_URL!,
    Bun.env.SUPABASE_ANON_KEY!
)

export const uploadImage = async (file: File) => {
    const filename = `${crypto.randomUUID()}-${file.name}`

    const { error } = await supabase.storage
        .from("products")
        .upload(filename, file)

    if (error) throw new Error(error.message)

    const { data } = supabase.storage
        .from("products")
        .getPublicUrl(filename)

    return data.publicUrl
}

export const deleteImage = async (url: string) => {
    const filename = url.split("/").pop()!

    await supabase.storage
        .from("products")
        .remove([filename])
}

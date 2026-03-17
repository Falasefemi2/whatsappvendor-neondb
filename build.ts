import { build } from "bun"

await build({
    entrypoints: ["./api/index.ts"],
    outdir: "./api",
    naming: "handler.js",
    target: "node",
})

console.log("Build complete!")

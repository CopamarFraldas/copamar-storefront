/**
 * Compressão de foto NO CELULAR antes do upload (incidente 11/06: câmera real
 * = 5-15MB → 413 no server action; e 4G de rua sofre). Redimensiona pro lado
 * máx. 1600px + JPEG q0.8 → ~200-500KB. Best-effort: se falhar, sobe original
 * (o limite do server já foi elevado pra 15mb como rede de segurança).
 * Client-only (canvas) — NÃO importar em código de servidor.
 */
export async function comprimeFoto(file: File, maxLado = 1600, qualidade = 0.8): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
    if (escala === 1 && file.size < 800_000) return file // já é pequena
    const w = Math.max(1, Math.round(bmp.width * escala))
    const h = Math.max(1, Math.round(bmp.height * escala))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bmp, 0, 0, w, h)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", qualidade))
    if (!blob || blob.size === 0) return file
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })
  } catch {
    return file
  }
}

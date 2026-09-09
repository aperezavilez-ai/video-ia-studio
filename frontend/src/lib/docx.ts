/**
 * Extracción de texto de .docx en el navegador (evita mammoth en Vercel serverless).
 */
export async function extractDocxTextFromFile(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = (result.value || "").replace(/\u0000/g, "").trim()
  if (!text) {
    throw new Error("El archivo Word está vacío o no tiene texto legible")
  }
  return text
}

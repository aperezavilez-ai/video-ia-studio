import { NextRequest, NextResponse } from "next/server"
import {
  SCRIPT_ANALYSIS_SYSTEM_PROMPT,
  buildClipGenerationPrompt,
  safeParseAnalysisJson,
  type ScriptAnalysisResult,
} from "@/lib/script-analysis"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function jsonError(detail: string, status = 500) {
  return NextResponse.json({ ok: false, detail }, { status })
}

function gatewayConfig() {
  const baseUrl = (
    process.env.GAFCORE_GATEWAY_URL || "https://gafcore-gateway.vercel.app/api/openai/v1"
  ).replace(/\/$/, "")
  const apiKey = process.env.GAFCORE_API_KEY || ""
  const model = process.env.GAFCORE_DEFAULT_MODEL || "apicredits/gpt-5.6-luna"
  return { baseUrl, apiKey, model }
}

async function analyzeWithGafcore(scriptText: string, durationHint = "corto"): Promise<ScriptAnalysisResult> {
  const { baseUrl, apiKey, model } = gatewayConfig()
  if (!apiKey) {
    throw new Error("GAFCORE_API_KEY no configurada en el servidor")
  }

  const clipBudget =
    durationHint === "largo" ? "25 a 40 clips" : durationHint === "medio" ? "15 a 25 clips" : "8 a 18 clips"

  const truncated = scriptText.slice(0, 28000)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 240_000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-key": apiKey,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: SCRIPT_ANALYSIS_SYSTEM_PROMPT },
          {
            role: "user",
            content:
              `Analiza este guion y fragméntalo en ${clipBudget} de producción.\n` +
              "Cuida continuidad, personajes, vestimenta, locación, diálogo, tipo de voz, transiciones de cámara e intenciones verbales/visuales.\n" +
              "Responde SOLO JSON válido.\n\n" +
              truncated,
          },
        ],
      }),
    })

    const detail = await response.text()
    if (!response.ok) {
      throw new Error(`Gafcore Gateway error (${response.status}): ${detail.slice(0, 280)}`)
    }

    let payload: any
    try {
      payload = JSON.parse(detail)
    } catch {
      throw new Error(`Gafcore devolvió una respuesta no JSON: ${detail.slice(0, 160)}`)
    }

    const content = payload?.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") {
      throw new Error("Respuesta vacía del Director IA")
    }

    const analysis = safeParseAnalysisJson(content)
    analysis.clips = analysis.clips.map((clip) => ({
      ...clip,
      prompt: clip.prompt || buildClipGenerationPrompt(clip, analysis.characters),
    }))
    return analysis
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("El análisis tardó demasiado. Prueba con un guion más corto o reintenta.")
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""
    let scriptText = ""
    let filename = ""
    let durationHint = "corto"

    if (contentType.includes("application/json")) {
      const body = await req.json()
      scriptText = String(body?.script_text || "").trim()
      filename = String(body?.filename || "guion.docx")
      durationHint = String(body?.duration || "corto")
    } else {
      // Compatibilidad: si llega multipart, solo leemos texto plano adjunto si existe.
      const form = await req.formData()
      scriptText = String(form.get("script_text") || "").trim()
      filename = String(form.get("filename") || "guion.docx")
      durationHint = String(form.get("duration") || "corto")
      if (!scriptText) {
        return jsonError(
          "Envía el texto del guion (script_text). El .docx se procesa en el navegador.",
          400,
        )
      }
    }

    if (!scriptText) {
      return jsonError("Debes enviar el texto del guion para analizar", 400)
    }

    const analysis = await analyzeWithGafcore(scriptText, durationHint)
    return NextResponse.json({
      ok: true,
      status: "success",
      filename,
      script_text: scriptText,
      analysis,
      characters_extracted: analysis.characters.length,
      clips_extracted: analysis.clips.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error analizando guion"
    console.error("[script/analyze]", message)
    return jsonError(message, 500)
  }
}

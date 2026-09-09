import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"
import {
  SCRIPT_ANALYSIS_SYSTEM_PROMPT,
  buildClipGenerationPrompt,
  safeParseAnalysisJson,
  type ScriptAnalysisResult,
} from "@/lib/script-analysis"

export const runtime = "nodejs"
export const maxDuration = 60

function gatewayConfig() {
  const baseUrl = (process.env.GAFCORE_GATEWAY_URL || "https://gafcore-gateway.vercel.app/api/openai/v1").replace(/\/$/, "")
  const apiKey = process.env.GAFCORE_API_KEY || ""
  const model = process.env.GAFCORE_DEFAULT_MODEL || "gpt-5.6-luna"
  return { baseUrl, apiKey, model }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return (result.value || "").trim()
}

async function analyzeWithGafcore(scriptText: string): Promise<ScriptAnalysisResult> {
  const { baseUrl, apiKey, model } = gatewayConfig()
  if (!apiKey) {
    throw new Error("GAFCORE_API_KEY no configurada en el servidor")
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-project-key": apiKey,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [
        { role: "system", content: SCRIPT_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Analiza este guion y fragméntalo en clips de producción cuidando continuidad, personajes, vestimenta, locación, diálogo, tipo de voz, transiciones de cámara e intenciones verbales/visuales.\n\n" +
            scriptText.slice(0, 48000),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gafcore Gateway error (${response.status}): ${detail.slice(0, 240)}`)
  }

  const payload = await response.json()
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
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "Debes subir un archivo .docx" }, { status: 400 })
    }

    const name = (file.name || "").toLowerCase()
    if (!name.endsWith(".docx")) {
      return NextResponse.json(
        { detail: "Solo se aceptan guiones Word en formato .docx" },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const scriptText = await extractDocxText(buffer)
    if (!scriptText) {
      return NextResponse.json(
        { detail: "El archivo Word está vacío o no tiene texto legible" },
        { status: 400 },
      )
    }

    const analysis = await analyzeWithGafcore(scriptText)
    return NextResponse.json({
      status: "success",
      filename: file.name,
      script_text: scriptText,
      analysis,
      characters_extracted: analysis.characters.length,
      clips_extracted: analysis.clips.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error analizando guion"
    console.error("[script/analyze]", message)
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}

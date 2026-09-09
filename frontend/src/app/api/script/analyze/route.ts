import { NextRequest, NextResponse } from "next/server"
import {
  SCRIPT_ENRICH_SYSTEM_PROMPT,
  buildClipGenerationPrompt,
  buildHeuristicAnalysis,
  safeParseAnalysisJson,
  type ScriptAnalysisResult,
  type ScriptClip,
} from "@/lib/script-analysis"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function jsonError(detail: string, status = 500) {
  return NextResponse.json({ ok: false, detail }, { status })
}

function gatewayConfig() {
  const baseUrl = (
    process.env.GAFCORE_GATEWAY_URL || "https://gafcore-gateway.vercel.app/api/openai/v1"
  ).replace(/\/$/, "")
  const apiKey = process.env.GAFCORE_API_KEY || ""
  // Modelo rápido para no exceder timeout de Vercel (60s)
  const model =
    process.env.GAFCORE_ANALYZE_MODEL ||
    process.env.GAFCORE_DEFAULT_MODEL ||
    "apicredits/gemini-2.5-flash"
  return { baseUrl, apiKey, model }
}

function mergeEnrichment(base: ScriptAnalysisResult, enriched: ScriptAnalysisResult): ScriptAnalysisResult {
  const byNumber = new Map<number, any>()
  for (const clip of enriched.clips || []) {
    byNumber.set(Number(clip.number), clip)
  }

  const clips: ScriptClip[] = base.clips.map((clip) => {
    const extra = byNumber.get(clip.number)
    if (!extra) return clip
    const merged: ScriptClip = {
      ...clip,
      title: extra.title || clip.title,
      wardrobe_continuity: extra.wardrobe_continuity || clip.wardrobe_continuity,
      visual_intention: extra.visual_intention || clip.visual_intention,
      verbal_intention: extra.verbal_intention || clip.verbal_intention,
      continuity_in: extra.continuity_in || clip.continuity_in,
      continuity_out: extra.continuity_out || clip.continuity_out,
      mood: extra.mood || clip.mood,
      camera: { ...clip.camera, ...(extra.camera || {}) },
      dialogues: Array.isArray(extra.dialogues) && extra.dialogues.length ? extra.dialogues : clip.dialogues,
      prompt: extra.prompt || clip.prompt,
    }
    merged.prompt = merged.prompt || buildClipGenerationPrompt(merged, enriched.characters?.length ? enriched.characters : base.characters)
    return merged
  })

  return {
    ...base,
    title: enriched.title || base.title,
    genre: enriched.genre || base.genre,
    logline: enriched.logline || base.logline,
    characters: enriched.characters?.length ? enriched.characters : base.characters,
    continuity_bible: enriched.continuity_bible || base.continuity_bible,
    clips,
    total_clips: clips.length,
    estimated_duration_seconds: clips.reduce((s, c) => s + (Number(c.duration_sec) || 6), 0),
  }
}

async function enrichWithGafcore(base: ScriptAnalysisResult): Promise<ScriptAnalysisResult> {
  const { baseUrl, apiKey, model } = gatewayConfig()
  if (!apiKey) return base

  const compactClips = base.clips.slice(0, 16).map((c) => ({
    number: c.number,
    slugline: c.slugline,
    summary: c.summary,
    action: c.action.slice(0, 500),
    characters_present: c.characters_present,
    dialogues: c.dialogues.slice(0, 4),
  }))

  const controller = new AbortController()
  // Corto a propósito: Vercel corta a ~60s; si la IA no llega, devolvemos clips heurísticos
  const timer = setTimeout(() => controller.abort(), 25_000)

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
          { role: "system", content: SCRIPT_ENRICH_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              title: base.title,
              genre: base.genre,
              clips: compactClips,
              known_characters: base.characters.map((c) => c.name),
            }),
          },
        ],
      }),
    })

    const detail = await response.text()
    if (!response.ok) {
      console.warn("[script/analyze] enrich failed", response.status, detail.slice(0, 200))
      return base
    }

    const payload = JSON.parse(detail)
    const content = payload?.choices?.[0]?.message?.content
    if (!content) return base
    const enriched = safeParseAnalysisJson(content)
    return mergeEnrichment(base, enriched)
  } catch (error) {
    console.warn("[script/analyze] enrich timeout/fallback", error)
    return base
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
    let titleHint = ""
    let genreHint = ""

    if (contentType.includes("application/json")) {
      const body = await req.json()
      scriptText = String(body?.script_text || "").trim()
      filename = String(body?.filename || "guion.docx")
      durationHint = String(body?.duration || "corto")
      titleHint = String(body?.title || "")
      genreHint = String(body?.genre || "")
    } else {
      const form = await req.formData()
      scriptText = String(form.get("script_text") || "").trim()
      filename = String(form.get("filename") || "guion.docx")
      durationHint = String(form.get("duration") || "corto")
      titleHint = String(form.get("title") || "")
      genreHint = String(form.get("genre") || "")
    }

    if (!scriptText) {
      return jsonError("Debes enviar el texto del guion para analizar", 400)
    }

    // 1) Fragmentación inmediata (siempre produce clips)
    const heuristic = buildHeuristicAnalysis(scriptText, {
      title: titleHint || filename.replace(/\.docx$/i, ""),
      genre: genreHint || "Drama",
      duration: durationHint,
    })

    if (!heuristic.clips.length) {
      return jsonError("No se pudieron detectar escenas/clips en el guion", 422)
    }

    // 2) Enriquecimiento IA rápido (si falla/timeout, se usan los clips heurísticos)
    const analysis = await enrichWithGafcore(heuristic)

    return NextResponse.json({
      ok: true,
      status: "success",
      filename,
      script_text: scriptText,
      analysis,
      characters_extracted: analysis.characters.length,
      clips_extracted: analysis.clips.length,
      mode: analysis === heuristic ? "heuristic" : "heuristic+ai",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error analizando guion"
    console.error("[script/analyze]", message)
    return jsonError(message, 500)
  }
}

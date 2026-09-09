import { NextRequest, NextResponse } from "next/server"
import type { ScriptAnalysisResult } from "@/lib/script-analysis"

export const runtime = "nodejs"

type CreateBody = {
  title: string
  genre: string
  duration?: string
  description?: string
  script_text?: string
  analysis?: ScriptAnalysisResult
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  return { url, key }
}

async function createInSupabase(body: CreateBody) {
  const { url, key } = supabaseConfig()
  if (!url || !key) return null

  const projectRes = await fetch(`${url}/rest/v1/projects`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      title: body.title,
      genre: body.genre,
      description: body.script_text || body.description || "",
      status: "draft",
    }),
  })

  if (!projectRes.ok) {
    const detail = await projectRes.text()
    throw new Error(`Supabase projects error: ${detail.slice(0, 200)}`)
  }

  const projects = await projectRes.json()
  const project = Array.isArray(projects) ? projects[0] : projects
  const projectId = project.id as number

  const characters = (body.analysis?.characters || []).map((c) => ({
    project_id: projectId,
    name: c.name,
    role: [c.role, c.voice_type ? `Voz: ${c.voice_type}` : ""].filter(Boolean).join(" · "),
    prompt: [
      c.prompt,
      c.appearance && `Appearance: ${c.appearance}`,
      c.wardrobe && `Wardrobe: ${c.wardrobe}`,
      c.continuity_notes && `Continuity: ${c.continuity_notes}`,
    ]
      .filter(Boolean)
      .join(" | "),
  }))

  if (characters.length) {
    await fetch(`${url}/rest/v1/characters`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(characters),
    })
  }

  const scenes = (body.analysis?.clips || []).map((clip) => ({
    project_id: projectId,
    number: clip.number,
    title: clip.title || `Clip ${clip.number}`,
    prompt: [
      clip.prompt,
      clip.slugline && `Slugline: ${clip.slugline}`,
      clip.wardrobe_continuity && `Wardrobe continuity: ${clip.wardrobe_continuity}`,
      clip.visual_intention && `Visual intention: ${clip.visual_intention}`,
      clip.verbal_intention && `Verbal intention: ${clip.verbal_intention}`,
      clip.continuity_in && `Continuity in: ${clip.continuity_in}`,
      clip.continuity_out && `Continuity out: ${clip.continuity_out}`,
      clip.camera &&
        `Camera: ${clip.camera.shot_type}/${clip.camera.movement}; transitions ${clip.camera.transition_in}->${clip.camera.transition_out}`,
      clip.dialogues?.length
        ? `Dialogue: ${clip.dialogues.map((d) => `${d.character}: ${d.text} (${d.verbal_intention || d.delivery || ""})`).join(" / ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    duration_sec: Number(clip.duration_sec) || 6,
    status: "pending",
  }))

  if (scenes.length) {
    await fetch(`${url}/rest/v1/scenes`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(scenes),
    })
  }

  return {
    id: projectId,
    title: project.title,
    genre: project.genre,
    description: project.description,
    status: project.status,
    created_at: project.created_at,
    source: "supabase",
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBody
    if (!body?.title?.trim()) {
      return NextResponse.json({ detail: "El título es obligatorio" }, { status: 400 })
    }

    try {
      const remote = await createInSupabase(body)
      if (remote) {
        return NextResponse.json({
          ...remote,
          analysis: body.analysis || null,
          script_text: body.script_text || "",
        })
      }
    } catch (error) {
      console.warn("[projects] supabase create failed, local fallback", error)
    }

    const localId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    return NextResponse.json({
      id: localId,
      title: body.title.trim(),
      genre: body.genre || "Drama",
      description: body.script_text || body.description || "",
      status: "draft",
      created_at: new Date().toISOString(),
      source: "local",
      analysis: body.analysis || null,
      script_text: body.script_text || "",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error creando proyecto"
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}

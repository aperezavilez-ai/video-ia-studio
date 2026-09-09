"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Film,
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Clapperboard,
  Users,
  Camera,
} from "lucide-react"
import { buildHeuristicAnalysis, type ScriptAnalysisResult } from "@/lib/script-analysis"
import { extractDocxTextFromFile } from "@/lib/docx"

type CreateResponse = {
  id: string | number
  title: string
  genre: string
  description?: string
  status?: string
  created_at?: string
  source?: string
  analysis?: ScriptAnalysisResult | null
  script_text?: string
}

async function readApiJson<T = any>(res: Response): Promise<T> {
  const raw = await res.text()
  try {
    return JSON.parse(raw) as T
  } catch {
    const snippet = raw.replace(/\s+/g, " ").slice(0, 180)
    throw new Error(
      res.status >= 500
        ? `El servidor falló (${res.status}). ${snippet || "Respuesta no JSON"}`
        : `Respuesta inválida del servidor (${res.status}): ${snippet}`,
    )
  }
}

export default function NewProject() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("Ciencia Ficción")
  const [duration, setDuration] = useState("corto")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<"idle" | "extracting" | "splitting" | "enriching" | "creating">("idle")
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<{
    clips: number
    characters: number
    analysisTitle?: string
  } | null>(null)

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith(".docx")) {
      setError("Solo se aceptan guiones Word (.docx)")
      setFile(null)
      return
    }
    setError("")
    setFile(selected)
    setPreview(null)
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.docx$/i, "").replace(/[_-]+/g, " "))
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const persistLocalProject = (payload: CreateResponse) => {
    const analysis = payload.analysis
    const project = {
      id: String(payload.id),
      title: payload.title,
      genre: payload.genre,
      duration,
      createdAt: payload.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      script: payload.script_text || "",
      continuity_bible: analysis?.continuity_bible || "",
      logline: analysis?.logline || "",
      locations: analysis?.locations || [],
      characters: (analysis?.characters || []).map((c, idx) => ({
        id: `c${idx + 1}`,
        name: c.name,
        role: [c.role, c.voice_type ? `Voz: ${c.voice_type}` : ""].filter(Boolean).join(" · "),
        prompt: [c.prompt, c.appearance, c.wardrobe, c.continuity_notes].filter(Boolean).join(" | "),
        appearance: c.appearance,
        wardrobe: c.wardrobe,
        voice_type: c.voice_type,
      })),
      scenes: (analysis?.clips || []).map((clip) => ({
        id: `s${clip.number}`,
        number: clip.number,
        title: clip.title,
        prompt: clip.prompt,
        status: "pending",
        durationSec: Number(clip.duration_sec) || 6,
        slugline: clip.slugline,
        location: clip.location,
        dialogues: clip.dialogues || [],
        camera: clip.camera,
        visual_intention: clip.visual_intention,
        verbal_intention: clip.verbal_intention,
        wardrobe_continuity: clip.wardrobe_continuity,
        continuity_in: clip.continuity_in,
        continuity_out: clip.continuity_out,
        mood: clip.mood,
      })),
    }

    const stored = localStorage.getItem("video_ia_projects")
    const projects = stored ? JSON.parse(stored) : []
    const next = Array.isArray(projects) ? projects.filter((p: { id: string }) => p.id !== project.id) : []
    next.unshift(project)
    localStorage.setItem("video_ia_projects", JSON.stringify(next))
    return project.id
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio")
      return
    }

    setSaving(true)
    setError("")

    try {
      let analysis: ScriptAnalysisResult | null = null
      let scriptText = ""

      if (file) {
        setPhase("extracting")
        const scriptFromDocx = await extractDocxTextFromFile(file)
        scriptText = scriptFromDocx

        setPhase("splitting")
        // Fragmentación local inmediata (no depende del timeout de Vercel)
        const localSplit = buildHeuristicAnalysis(scriptFromDocx, {
          title: title.trim() || file.name.replace(/\.docx$/i, ""),
          genre,
          duration,
        })
        analysis = localSplit
        setPreview({
          clips: localSplit.clips.length,
          characters: localSplit.characters.length,
          analysisTitle: localSplit.title,
        })

        setPhase("enriching")
        try {
          const analyzeRes = await fetch("/api/script/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              script_text: scriptFromDocx,
              filename: file.name,
              duration,
              title: title.trim(),
              genre,
            }),
          })
          const analyzeData = await readApiJson<{
            detail?: string
            analysis?: ScriptAnalysisResult
            script_text?: string
          }>(analyzeRes)
          if (analyzeRes.ok && analyzeData.analysis?.clips?.length) {
            analysis = analyzeData.analysis
            scriptText = analyzeData.script_text || scriptFromDocx
            setPreview({
              clips: analysis.clips.length,
              characters: analysis.characters?.length || 0,
              analysisTitle: analysis.title,
            })
          }
        } catch (analyzeErr) {
          console.warn("Enriquecimiento IA falló; se usan clips locales", analyzeErr)
        }

        if (analysis.title && title.trim().length < 3) {
          setTitle(analysis.title)
        }
        if (analysis.genre) {
          setGenre(analysis.genre)
        }
      }

      setPhase("creating")
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (analysis?.title || title).trim(),
          genre: analysis?.genre || genre,
          duration,
          description: `Duración estimada: ${duration}`,
          script_text: scriptText,
          analysis,
        }),
      })
      const created = await readApiJson<CreateResponse & { detail?: string }>(createRes)
      if (!createRes.ok) {
        throw new Error(created.detail || "No se pudo crear el proyecto")
      }

      const projectId = persistLocalProject({
        ...created,
        analysis: created.analysis || analysis,
        script_text: created.script_text || scriptText,
        title: created.title || title.trim(),
        genre: created.genre || genre,
      })

      router.push(`/projects/${projectId}`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error al crear el proyecto")
    } finally {
      setSaving(false)
      setPhase("idle")
    }
  }

  const phaseLabel =
    phase === "extracting"
      ? "Leyendo Word..."
      : phase === "splitting"
        ? "Dividiendo guion en clips..."
        : phase === "enriching"
          ? "Enriqueciendo continuidad con IA..."
          : phase === "creating"
            ? "Creando proyecto y film bible..."
            : saving
              ? "Creando..."
              : file
                ? "Crear y fragmentar con IA"
                : "Crear Proyecto"

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/projects")} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <Film className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Nuevo Proyecto</h1>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/10 border border-cyan-600/20 rounded-full">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Asistente de Creación IA</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: El Último Viaje"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Género
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-600"
                >
                  <option>Ciencia Ficción</option>
                  <option>Fantasía</option>
                  <option>Terror</option>
                  <option>Drama</option>
                  <option>Comedia</option>
                  <option>Acción</option>
                  <option>Thriller</option>
                  <option>Documental</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Duración Estimada
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-600"
                >
                  <option value="corto">Cortometraje (5-15 min)</option>
                  <option value="medio">Mediometraje (15-40 min)</option>
                  <option value="largo">Largometraje (60+ min)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Guion Word (.docx)
                </label>
                <p className="text-sm text-slate-400 mb-3">
                  La IA recibe el archivo, lo analiza y lo fragmenta en clips cuidando continuidad,
                  personajes, vestimenta, locación, diálogo, tipo de voz, transiciones de cámara e
                  intenciones verbales y visuales.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onPickFile}
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-slate-600 hover:border-cyan-600/60 rounded-xl px-4 py-8 bg-slate-950/40 transition-colors text-center"
                  >
                    <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                    <div className="text-white font-medium">Subir guion en Word</div>
                    <div className="text-slate-400 text-sm mt-1">Arrastra o selecciona un .docx</div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-cyan-600/15 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{file.name}</div>
                          <div className="text-slate-400 text-sm">
                            {(file.size / 1024).toFixed(1)} KB · listo para análisis
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                        aria-label="Quitar archivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div
                        className={`rounded-lg border p-2 flex items-center gap-2 ${
                          preview
                            ? "bg-cyan-600/10 border-cyan-600/30 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <Clapperboard className="h-3.5 w-3.5 text-cyan-400" />
                        {preview ? `${preview.clips} clips` : "Clips"}
                      </div>
                      <div
                        className={`rounded-lg border p-2 flex items-center gap-2 ${
                          preview
                            ? "bg-cyan-600/10 border-cyan-600/30 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5 text-cyan-400" />
                        {preview ? `${preview.characters} pers.` : "Personajes"}
                      </div>
                      <div
                        className={`rounded-lg border p-2 flex items-center gap-2 ${
                          phase === "enriching" || preview
                            ? "bg-cyan-600/10 border-cyan-600/30 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <Camera className="h-3.5 w-3.5 text-cyan-400" />
                        Continuidad
                      </div>
                    </div>

                    {saving && phase !== "idle" && (
                      <div className="text-sm text-cyan-300/90 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        {phaseLabel}
                      </div>
                    )}

                    {preview && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Detectados {preview.clips} clips y {preview.characters} personajes
                        {preview.analysisTitle ? ` · ${preview.analysisTitle}` : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="pt-2 flex gap-4">
              <button
                onClick={() => router.push("/projects")}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors shadow-lg shadow-cyan-600/20 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {phaseLabel}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

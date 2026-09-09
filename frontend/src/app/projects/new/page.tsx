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
import {
  buildHeuristicAnalysis,
  formatClipProductionScript,
  type ScriptAnalysisResult,
  type ScriptClip,
} from "@/lib/script-analysis"
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

function toLocalScenes(clips: ScriptClip[]) {
  return clips.map((clip) => ({
    id: `s${clip.number}`,
    number: clip.number,
    title: clip.title,
    prompt: clip.prompt,
    status: "pending" as const,
    durationSec: Number(clip.duration_sec) || 6,
    slugline: clip.slugline,
    location: clip.location,
    time_of_day: clip.time_of_day,
    summary: clip.summary,
    action: clip.action,
    dialogues: clip.dialogues || [],
    camera: clip.camera,
    visual_intention: clip.visual_intention,
    verbal_intention: clip.verbal_intention,
    wardrobe_continuity: clip.wardrobe_continuity,
    continuity_in: clip.continuity_in,
    continuity_out: clip.continuity_out,
    mood: clip.mood,
    production_script: formatClipProductionScript(clip),
  }))
}

export default function NewProject() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("Ciencia Ficción")
  const [duration, setDuration] = useState("corto")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<"idle" | "extracting" | "splitting" | "creating">("idle")
  const [error, setError] = useState("")
  const [analysis, setAnalysis] = useState<ScriptAnalysisResult | null>(null)

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith(".docx")) {
      setError("Solo se aceptan guiones Word (.docx)")
      setFile(null)
      setAnalysis(null)
      return
    }
    setError("")
    setFile(selected)
    setAnalysis(null)
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.docx$/i, "").replace(/[_-]+/g, " "))
    }
  }

  const clearFile = () => {
    setFile(null)
    setAnalysis(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const persistLocalProject = (payload: CreateResponse, fullAnalysis: ScriptAnalysisResult, fullScript: string) => {
    const project = {
      id: String(payload.id),
      title: payload.title,
      genre: payload.genre,
      duration,
      createdAt: payload.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      script: fullScript.slice(0, 80_000),
      continuity_bible: fullAnalysis.continuity_bible || "",
      logline: fullAnalysis.logline || "",
      locations: fullAnalysis.locations || [],
      characters: (fullAnalysis.characters || []).map((c, idx) => ({
        id: `c${idx + 1}`,
        name: c.name,
        role: [c.role, c.voice_type ? `Voz: ${c.voice_type}` : ""].filter(Boolean).join(" · "),
        prompt: [c.prompt, c.appearance, c.wardrobe, c.continuity_notes].filter(Boolean).join(" | "),
        appearance: c.appearance,
        wardrobe: c.wardrobe,
        voice_type: c.voice_type,
      })),
      scenes: toLocalScenes(fullAnalysis.clips || []),
      from_script: true,
    }

    try {
      const stored = localStorage.getItem("video_ia_projects")
      const projects = stored ? JSON.parse(stored) : []
      const next = Array.isArray(projects) ? projects.filter((p: { id: string }) => p.id !== project.id) : []
      next.unshift(project)
      localStorage.setItem("video_ia_projects", JSON.stringify(next))
    } catch (err) {
      // Si el guion es demasiado grande para localStorage, guarda versión compacta
      console.warn("localStorage full, saving compact project", err)
      const compact = {
        ...project,
        script: fullScript.slice(0, 10_000),
        scenes: project.scenes.map((s) => ({
          ...s,
          action: (s.action || "").slice(0, 800),
          production_script: (s.production_script || "").slice(0, 2500),
        })),
      }
      localStorage.setItem("video_ia_projects", JSON.stringify([compact]))
    }
    return project.id
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio")
      return
    }
    if (!file) {
      setError("Sube el guion Word (.docx) para fragmentarlo en clips")
      return
    }

    setSaving(true)
    setError("")

    try {
      setPhase("extracting")
      const scriptFromDocx = await extractDocxTextFromFile(file)

      setPhase("splitting")
      const localAnalysis = buildHeuristicAnalysis(scriptFromDocx, {
        title: title.trim() || file.name.replace(/\.docx$/i, ""),
        genre,
        duration,
      })

      if (!localAnalysis.clips.length) {
        throw new Error("No se pudieron detectar escenas en el guion. Revisa que el Word tenga texto.")
      }

      setAnalysis(localAnalysis)
      setPhase("creating")

      // Guardar clips YA en el navegador y abrir el estudio (sin esperar servidor/gateway)
      const localId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const projectId = persistLocalProject(
        {
          id: localId,
          title: (localAnalysis.title || title).trim(),
          genre: localAnalysis.genre || genre,
          status: "draft",
          created_at: new Date().toISOString(),
          source: "local",
        },
        localAnalysis,
        scriptFromDocx,
      )

      // Persistencia remota en segundo plano (no bloquea la UI)
      void fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (localAnalysis.title || title).trim(),
          genre: localAnalysis.genre || genre,
          duration,
          description: `Duración estimada: ${duration} · ${localAnalysis.clips.length} clips`,
          script_text: scriptFromDocx.slice(0, 60_000),
          analysis: {
            ...localAnalysis,
            clips: localAnalysis.clips.map((c) => ({
              ...c,
              action: c.action.slice(0, 1200),
              prompt: c.prompt.slice(0, 1500),
            })),
          },
        }),
      }).catch((err) => console.warn("Sync remoto diferido", err))

      router.push(`/projects/${projectId}?tab=scenes`)
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
        : phase === "creating"
          ? "Guardando clips listos para producción..."
          : saving
            ? "Creando..."
            : file
              ? "Crear clips de producción"
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
        <div className="max-w-3xl mx-auto">
          <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/10 border border-cyan-600/20 rounded-full">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Asistente de Creación IA</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Título del Proyecto *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: El Último Viaje"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Género</label>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Duración Estimada</label>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Guion Word (.docx) *</label>
                <p className="text-sm text-slate-400 mb-3">
                  Al crear el proyecto, el guion se divide al instante en clips con slugline, diálogos,
                  cámara, continuidad y prompt listo para producción.
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
                            {(file.size / 1024).toFixed(1)} KB · listo para fragmentar
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
                          analysis
                            ? "bg-cyan-600/10 border-cyan-600/30 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <Clapperboard className="h-3.5 w-3.5 text-cyan-400" />
                        {analysis ? `${analysis.clips.length} clips` : "Clips"}
                      </div>
                      <div
                        className={`rounded-lg border p-2 flex items-center gap-2 ${
                          analysis
                            ? "bg-cyan-600/10 border-cyan-600/30 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5 text-cyan-400" />
                        {analysis ? `${analysis.characters.length} pers.` : "Personajes"}
                      </div>
                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-slate-300 flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 text-cyan-400" />
                        Continuidad
                      </div>
                    </div>

                    {saving && (
                      <div className="text-sm text-cyan-300/90 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        {phaseLabel}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {analysis && analysis.clips.length > 0 && (
              <div className="space-y-3 border-t border-slate-800 pt-6">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {analysis.clips.length} guiones de clip listos · {analysis.characters.length} personajes
                </div>
                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                  {analysis.clips.slice(0, 8).map((clip) => (
                    <details
                      key={clip.number}
                      className="rounded-lg border border-slate-700 bg-slate-950/70 open:border-cyan-700/40"
                    >
                      <summary className="cursor-pointer px-3 py-2 text-sm text-white font-medium list-none flex items-center gap-2">
                        <span className="text-cyan-400 font-mono text-xs">#{clip.number}</span>
                        <span className="truncate">{clip.slugline || clip.title}</span>
                      </summary>
                      <pre className="px-3 pb-3 text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap font-mono border-t border-slate-800/80 pt-2">
                        {formatClipProductionScript(clip)}
                      </pre>
                    </details>
                  ))}
                  {analysis.clips.length > 8 && (
                    <p className="text-xs text-slate-500">
                      +{analysis.clips.length - 8} clips más se verán en el estudio tras crear el proyecto.
                    </p>
                  )}
                </div>
              </div>
            )}

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
                disabled={saving || !file}
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

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Film,
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Sparkles,
  Video,
  Image as ImageIcon,
  Music,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  Users,
  FileText,
  Clock,
  Loader2,
  Upload
} from "lucide-react"
import { parseScript as apiParseScript, uploadScriptFile as apiUploadScriptFile } from "@/lib/api"

interface Scene {
  id: string
  number: number
  title: string
  prompt: string
  status: "pending" | "generating" | "completed"
  durationSec: number
  slugline?: string
  location?: string
  summary?: string
  action?: string
  dialogues?: Array<{ character: string; text: string; delivery?: string; verbal_intention?: string }>
  camera?: {
    shot_type?: string
    movement?: string
    transition_in?: string
    transition_out?: string
    lens_mood?: string
  }
  visual_intention?: string
  verbal_intention?: string
  wardrobe_continuity?: string
  continuity_in?: string
  continuity_out?: string
  mood?: string
  production_script?: string
}

interface Character {
  id: string
  name: string
  role: string
  prompt: string
}

function buildProductionScript(scene: Scene): string {
  if (scene.production_script?.trim()) return scene.production_script
  const dialogues =
    scene.dialogues && scene.dialogues.length > 0
      ? scene.dialogues
          .map((d) => `${d.character}\n(${d.delivery || "natural"})\n${d.text}`)
          .join("\n\n")
      : "(Sin diálogo — acción visual)"
  return [
    scene.slugline || scene.title,
    "",
    scene.summary ? `RESUMEN: ${scene.summary}` : "",
    scene.action ? `ACCIÓN: ${scene.action}` : "",
    "",
    "DIÁLOGOS:",
    dialogues,
    "",
    scene.camera
      ? `CÁMARA: ${scene.camera.shot_type || ""} / ${scene.camera.movement || ""} | ${scene.camera.transition_in || "cut"} → ${scene.camera.transition_out || "cut"}`
      : "",
    scene.visual_intention ? `INTENCIÓN VISUAL: ${scene.visual_intention}` : "",
    scene.verbal_intention ? `INTENCIÓN VERBAL: ${scene.verbal_intention}` : "",
    scene.wardrobe_continuity ? `VESTUARIO: ${scene.wardrobe_continuity}` : "",
    "",
    `PROMPT GENERACIÓN:\n${scene.prompt || ""}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
}

export default function ProjectWorkspace() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [projectTitle, setProjectTitle] = useState("Cargando proyecto...")
  const [projectGenre, setProjectGenre] = useState("Ciencia Ficción")
  const [activeTab, setActiveTab] = useState<"pipeline" | "scenes" | "characters" | "script">("pipeline")
  const [isPlaying, setIsPlaying] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false)
  const [loadedFromScript, setLoadedFromScript] = useState(false)
  const [scriptText, setScriptText] = useState("")
  const [scenes, setScenes] = useState<Scene[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [newSceneTitle, setNewSceneTitle] = useState("")
  const [newScenePrompt, setNewScenePrompt] = useState("")
  const [expandedScene, setExpandedScene] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab === "scenes" || tab === "characters" || tab === "script" || tab === "pipeline") {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("video_ia_projects")
      const tabFromUrl =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null
      if (stored) {
        const parsed = JSON.parse(stored)
        const found = parsed.find((p: any) => String(p.id) === String(projectId))
        if (found) {
          setProjectTitle(found.title)
          if (found.genre) setProjectGenre(found.genre)
          if (typeof found.script === "string") {
            setScriptText(found.script)
          }
          if (Array.isArray(found.scenes) && found.scenes.length > 0) {
            const mapped = found.scenes.map((s: any, idx: number) => ({
              id: String(s.id || `s${idx + 1}`),
              number: Number(s.number || idx + 1),
              title: s.title || `Clip ${idx + 1}`,
              prompt: s.prompt || "",
              status: s.status || "pending",
              durationSec: Number(s.durationSec || s.duration_sec || 6),
              slugline: s.slugline,
              location: s.location,
              summary: s.summary,
              action: s.action,
              dialogues: s.dialogues || [],
              camera: s.camera,
              visual_intention: s.visual_intention,
              verbal_intention: s.verbal_intention,
              wardrobe_continuity: s.wardrobe_continuity,
              continuity_in: s.continuity_in,
              continuity_out: s.continuity_out,
              mood: s.mood,
              production_script: s.production_script,
            }))
            setScenes(mapped)
            setLoadedFromScript(Boolean(found.from_script) || mapped.length > 0)
            setExpandedScene(mapped[0]?.id || null)
            if (!tabFromUrl) setActiveTab("scenes")
          } else {
            setScenes([])
          }
          if (Array.isArray(found.characters) && found.characters.length > 0) {
            setCharacters(
              found.characters.map((c: any, idx: number) => ({
                id: String(c.id || `c${idx + 1}`),
                name: c.name || `Personaje ${idx + 1}`,
                role: c.role || "",
                prompt: c.prompt || "",
              })),
            )
          } else {
            setCharacters([])
          }
        } else {
          setProjectTitle(`Proyecto #${projectId}`)
          setScenes([])
          setCharacters([])
        }
      } else {
        setProjectTitle(`Proyecto #${projectId}`)
        setScenes([])
        setCharacters([])
      }
    } catch {
      setProjectTitle(`Proyecto #${projectId}`)
      setScenes([])
      setCharacters([])
    }
  }, [projectId])

  const handleSave = () => {
    try {
      const stored = localStorage.getItem("video_ia_projects")
      const projects = stored ? JSON.parse(stored) : []
      const idx = Array.isArray(projects) ? projects.findIndex((p: any) => String(p.id) === String(projectId)) : -1
      if (idx >= 0) {
        projects[idx] = {
          ...projects[idx],
          title: projectTitle,
          genre: projectGenre,
          script: scriptText,
          scenes,
          characters,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem("video_ia_projects", JSON.stringify(projects))
      }
    } catch (e) {
      console.warn("No se pudo guardar localmente", e)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return
    const newScene: Scene = {
      id: Date.now().toString(),
      number: scenes.length + 1,
      title: newSceneTitle,
      prompt: newScenePrompt || "Escena cinematográfica generada por IA",
      status: "pending",
      durationSec: 6,
      production_script: newScenePrompt || "Escena cinematográfica generada por IA",
    }
    setScenes([...scenes, newScene])
    setNewSceneTitle("")
    setNewScenePrompt("")
  }

  const handleGenerateScene = (sceneId: string) => {
    setScenes(scenes.map(s => s.id === sceneId ? { ...s, status: "generating" } : s))
    setTimeout(() => {
      setScenes((prev) => prev.map(s => s.id === sceneId ? { ...s, status: "completed" } : s))
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Studio */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/projects")}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Film className="h-6 w-6 text-cyan-400" />
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{projectTitle}</h1>
                <p className="text-xs text-slate-400">{projectGenre} • Estudio de Producción IA</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-3 py-1.5 rounded-md">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cambios guardados
              </span>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>

            <button
              onClick={() => router.push(`/projects/${projectId}/script`)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generar desde guion
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-800/60 bg-slate-950">
          <div className="container mx-auto px-4 flex gap-6 text-sm">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === "pipeline"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Pipeline & Estado
            </button>

            <button
              onClick={() => setActiveTab("scenes")}
              className={`py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === "scenes"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Video className="h-4 w-4" />
              Escenas ({scenes.length})
            </button>

            <button
              onClick={() => setActiveTab("characters")}
              className={`py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === "characters"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Personajes ({characters.length})
            </button>

            <button
              onClick={() => setActiveTab("script")}
              className={`py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === "script"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              Guion & Director IA
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div className="space-y-8">
            {/* Monitor Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-cyan-400" />
                  Monitor de Vista Previa Cinematográfica
                </h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
                  1920x1080 • 24 FPS • ComfyUI LTX-Video
                </span>
              </div>

              <div className="aspect-video bg-black rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />

                <div className="text-center z-20">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-20 w-20 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50 transition-all hover:scale-105 cursor-pointer mx-auto mb-4"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 text-white ml-1" fill="white" />
                    )}
                  </button>
                  <p className="text-sm text-slate-300 font-medium">
                    {isPlaying ? "Reproduciendo secuencia..." : "Haz clic para reproducir preview"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Step Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                <div className="h-10 w-10 bg-cyan-950 text-cyan-400 rounded-lg flex items-center justify-center mb-3">
                  <Video className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-white mb-1">Generador de Video</h4>
                <p className="text-slate-400 text-xs mb-3">Modelos activos: ComfyUI LTX-Video 2.3 & HunyuanVideo</p>
                <button
                  onClick={() => setActiveTab("scenes")}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Gestionar escenas →
                </button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                <div className="h-10 w-10 bg-purple-950 text-purple-400 rounded-lg flex items-center justify-center mb-3">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-white mb-1">Concept Visual & Storyboard</h4>
                <p className="text-slate-400 text-xs mb-3">Imágenes clave y estilo visual del proyecto</p>
                <button
                  onClick={() => setActiveTab("characters")}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  Gestionar personajes →
                </button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                <div className="h-10 w-10 bg-pink-950 text-pink-400 rounded-lg flex items-center justify-center mb-3">
                  <Music className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-white mb-1">Voces & Banda Sonora</h4>
                <p className="text-slate-400 text-xs mb-3">Coqui XTTS v2 en español e instrumentos locales</p>
                <button
                  onClick={() => setActiveTab("script")}
                  className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                >
                  Editar diálogos →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCENES TAB */}
        {activeTab === "scenes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-white">Clips listos para producción</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {loadedFromScript
                    ? "Guiones adaptados desde tu Word: acción, diálogos, cámara y continuidad."
                    : "Aún no hay clips. Crea un proyecto con un .docx o desglosa el guion."}
                </p>
              </div>
              <span className="text-sm text-slate-400">{scenes.length} clips</span>
            </div>

            {scenes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center space-y-3">
                <FileText className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="text-slate-300">No hay guiones de clip todavía.</p>
                <button
                  onClick={() => router.push("/projects/new")}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg"
                >
                  Subir guion Word y fragmentar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scenes.map((scene) => {
                  const open = expandedScene === scene.id
                  const script = buildProductionScript(scene)
                  return (
                    <div
                      key={scene.id}
                      className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedScene(open ? null : scene.id)}
                        className="w-full text-left p-5 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 text-xs font-bold rounded">
                              #{scene.number}
                            </span>
                            <h4 className="font-semibold text-white truncate">
                              {scene.slugline || scene.title}
                            </h4>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {scene.durationSec}s
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {scene.summary || scene.action || scene.prompt}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {scene.status === "completed" ? (
                            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs rounded-full">
                              Generada
                            </span>
                          ) : scene.status === "generating" ? (
                            <span className="px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs rounded-full flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Procesando
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
                              Listo
                            </span>
                          )}
                        </div>
                      </button>

                      {open && (
                        <div className="px-5 pb-5 space-y-3 border-t border-slate-800/80 pt-4">
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                            {scene.location && (
                              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                Loc: {scene.location}
                              </span>
                            )}
                            {scene.camera?.shot_type && (
                              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                Cámara: {scene.camera.shot_type}/{scene.camera.movement}
                              </span>
                            )}
                            {scene.mood && (
                              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                Mood: {scene.mood}
                              </span>
                            )}
                          </div>
                          <pre className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap font-mono bg-slate-950/80 border border-slate-800 rounded-lg p-3 max-h-96 overflow-y-auto">
                            {script}
                          </pre>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleGenerateScene(scene.id)}
                              disabled={scene.status === "generating"}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Generar video
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Agregar clip manual
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Título del clip..."
                  value={newSceneTitle}
                  onChange={(e) => setNewSceneTitle(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Prompt de generación visual..."
                  value={newScenePrompt}
                  onChange={(e) => setNewScenePrompt(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                onClick={handleAddScene}
                disabled={!newSceneTitle.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Agregar Escena
              </button>
            </div>
          </div>
        )}

        {/* CHARACTERS TAB */}
        {activeTab === "characters" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Personajes Principal del Film</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {characters.map((char) => (
                <div key={char.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">{char.name}</h4>
                    <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full">
                      {char.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    Prompt Consistente: "{char.prompt}"
                  </p>
                  <button className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Sparkles className="h-3.5 w-3.5" /> Generar Hoja de Personaje
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCRIPT TAB */}
        {activeTab === "script" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Guion & Dirección de Arte (Gafcore Gateway)</h3>
                <p className="text-xs text-slate-400">Pega tu guion completo y deja que la IA desglose los personajes, locaciones y escenas.</p>
              </div>
              <button
                onClick={async () => {
                  if (!scriptText.trim()) return
                  setIsAnalyzingScript(true)
                  try {
                    const res = await apiParseScript(projectId, scriptText)
                    if (res && res.parsed_data) {
                      if (res.parsed_data.characters?.length > 0) {
                        setCharacters(res.parsed_data.characters.map((c: any, i: number) => ({
                          id: `c_${i}`,
                          name: c.name,
                          role: c.role || "Personaje",
                          prompt: c.prompt || "Portrait 8k"
                        })))
                      }
                      if (res.parsed_data.scenes?.length > 0) {
                        setScenes(res.parsed_data.scenes.map((s: any, i: number) => ({
                          id: `s_${i}`,
                          number: s.number || i + 1,
                          title: s.title || `Escena ${i + 1}`,
                          prompt: s.prompt || "Cinematic 8k",
                          status: "pending",
                          durationSec: s.duration_sec || 6
                        })))
                      }
                      if (res.parsed_data.title) setProjectTitle(res.parsed_data.title)
                      if (res.parsed_data.genre) setProjectGenre(res.parsed_data.genre)
                    }
                  } catch (e) {
                    console.warn("Could not analyze script on server:", e)
                  } finally {
                    setIsAnalyzingScript(false)
                    setSavedSuccess(true)
                    setTimeout(() => setSavedSuccess(false), 3000)
                  }
                }}
                disabled={isAnalyzingScript}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                {isAnalyzingScript ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analizando con Gafcore Gateway...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Desglosar Guion con IA
                  </>
                )}
              </button>
            </div>

            {/* Word / File Upload Dropzone */}
            <div className="bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition-colors">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 bg-cyan-950/60 text-cyan-400 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Subir Guion en Word (.docx) o Texto (.txt / .md)</h4>
                  <p className="text-xs text-slate-400 mt-1">Soporta archivos Microsoft Word (.docx) y archivos de texto plano</p>
                </div>
                <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors">
                  Seleccionar Archivo Word (.docx)
                  <input
                    type="file"
                    accept=".docx,.txt,.md"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setIsAnalyzingScript(true)
                      try {
                        const res = await apiUploadScriptFile(projectId, file)
                        if (res) {
                          if (res.script_text) setScriptText(res.script_text)
                          if (res.parsed_data) {
                            if (res.parsed_data.characters?.length > 0) {
                              setCharacters(res.parsed_data.characters.map((c: any, i: number) => ({
                                id: `c_${i}`,
                                name: c.name,
                                role: c.role || "Personaje",
                                prompt: c.prompt || "Portrait 8k"
                              })))
                            }
                            if (res.parsed_data.scenes?.length > 0) {
                              setScenes(res.parsed_data.scenes.map((s: any, i: number) => ({
                                id: `s_${i}`,
                                number: s.number || i + 1,
                                title: s.title || `Escena ${i + 1}`,
                                prompt: s.prompt || "Cinematic 8k",
                                status: "pending",
                                durationSec: s.duration_sec || 6
                              })))
                            }
                            if (res.parsed_data.title) setProjectTitle(res.parsed_data.title)
                            if (res.parsed_data.genre) setProjectGenre(res.parsed_data.genre)
                          }
                        }
                      } catch (err) {
                        console.error("Error uploading script file:", err)
                      } finally {
                        setIsAnalyzingScript(false)
                        setSavedSuccess(true)
                        setTimeout(() => setSavedSuccess(false), 3000)
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Texto del Guion Cinemático Extraído
              </label>
              <textarea
                rows={14}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Pega tu guion cinematográfico en formato estándar aquí o sube un archivo Word arriba..."
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {scriptText.length} caracteres • La IA extraerá automáticamente escenas, personajes y diálogos.
                </span>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Guion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

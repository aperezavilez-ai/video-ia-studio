"use client"

import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Film, FileText, Save, Upload, Loader2, Users, Clock, CheckCircle2, Sparkles } from "lucide-react"

interface Character {
  id: string
  name: string
  role: string
  visual_prompt: string
}

interface Scene {
  id: string
  scene_number: number
  title: string
  description: string
  visual_prompt: string
  dialogue: string
  characters_involved: string[]
  duration_seconds: number
  mood: string
}

interface ScriptAnalysis {
  project_id: string
  title: string
  total_scenes: number
  estimated_duration_seconds: number
  characters: Character[]
  scenes: Scene[]
}

export default function ScriptPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.name.endsWith('.docx')) {
      setFile(selected)
      setError("")
    } else if (selected) {
      setError("Solo se aceptan archivos .docx")
      setFile(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`http://localhost:8000/api/script/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al analizar el guion")
      }

      const data: ScriptAnalysis = await response.json()
      setAnalysis(data)
      setContent(`Guion analizado: ${data.title}\n\nEscenas detectadas: ${data.total_scenes}\nDuración estimada: ${Math.floor(data.estimated_duration_seconds / 60)} minutos\n\nPersonajes:\n${data.characters.map(c => `- ${c.name} (${c.role})`).join('\n')}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-400" />
              </button>
              <Film className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Guion</h1>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              {saved ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Carga de archivo Word */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              Analizar guion desde Word
            </h2>
            
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleUploadClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivo .docx
              </button>
              
              {file && (
                <span className="text-sm text-slate-300">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
              
              <button
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analizar guion
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Resultados del análisis */}
          {analysis && (
            <div className="space-y-6">
              {/* Información general */}
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">{analysis.title}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Film className="h-4 w-4 text-cyan-400" />
                    {analysis.total_scenes} escenas
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    {Math.floor(analysis.estimated_duration_seconds / 60)} minutos
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-4 w-4 text-cyan-400" />
                    {analysis.characters.length} personajes
                  </div>
                </div>
              </div>

              {/* Personajes detectados */}
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Personajes detectados
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.characters.map((character) => (
                    <div key={character.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <div className="font-medium text-white">{character.name}</div>
                      <div className="text-sm text-slate-400">{character.role}</div>
                      <div className="text-xs text-slate-500 mt-2 font-mono">
                        {character.visual_prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escenas detectadas */}
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Film className="h-5 w-5 text-cyan-400" />
                  Escenas detectadas
                </h3>
                <div className="space-y-4">
                  {analysis.scenes.map((scene) => (
                    <div key={scene.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-white">
                            Escena {scene.scene_number}: {scene.title}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {scene.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {scene.duration_seconds}s
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-mono mb-2">
                        {scene.visual_prompt}
                      </div>
                      
                      {scene.dialogue && (
                        <div className="text-sm text-slate-300 italic border-l-2 border-cyan-600 pl-3">
                          {scene.dialogue}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                        <Users className="h-3 w-3" />
                        {scene.characters_involved.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editor de texto */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Editor de guion</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe o pega tu guion aquí..."
              className="w-full h-[50vh] bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-600 resize-none"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

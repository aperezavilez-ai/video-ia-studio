"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Film, Plus, Play, Pause, Clock, CheckCircle2, Loader2 } from "lucide-react"

interface Scene {
  id: string
  number: number
  title: string
  prompt: string
  status: "pending" | "generating" | "completed"
  durationSec: number
}

export default function ScenesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: "s1",
      number: 1,
      title: "Escena 1: El despertar en el laboratorio",
      prompt: "Cinematic shot of a futurist lab, glowing cyan neon, volumetric light, 8k resolution, photorealistic",
      status: "completed",
      durationSec: 5,
    },
    {
      id: "s2",
      number: 2,
      title: "Escena 2: Mirada a las estrellas",
      prompt: "Deep space nebula, cosmic flare, highly detailed sci-fi film aesthetic",
      status: "pending",
      durationSec: 8,
    },
  ])

  const [newSceneTitle, setNewSceneTitle] = useState("")
  const [newScenePrompt, setNewScenePrompt] = useState("")

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return
    const newScene: Scene = {
      id: Date.now().toString(),
      number: scenes.length + 1,
      title: newSceneTitle,
      prompt: newScenePrompt || "Escena cinematográfica generada por IA",
      status: "pending",
      durationSec: 6,
    }
    setScenes([...scenes, newScene])
    setNewSceneTitle("")
    setNewScenePrompt("")
  }

  const handleGenerateScene = (sceneId: string) => {
    setScenes(scenes.map((s) => (s.id === sceneId ? { ...s, status: "generating" } : s)))
    setTimeout(() => {
      setScenes(scenes.map((s) => (s.id === sceneId ? { ...s, status: "completed" } : s)))
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <Film className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Escenas</h1>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Nueva escena</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                placeholder="Título de la escena"
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600"
              />
              <input
                value={newScenePrompt}
                onChange={(e) => setNewScenePrompt(e.target.value)}
                placeholder="Prompt visual"
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600"
              />
            </div>
            <button
              onClick={handleAddScene}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar escena
            </button>
          </div>

          <div className="space-y-4">
            {scenes.map((scene) => (
              <div key={scene.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-white font-medium">
                      {scene.number}. {scene.title}
                    </p>
                    <p className="text-slate-400 text-sm">{scene.prompt}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {scene.durationSec}s
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {scene.status === "completed" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {scene.status === "generating" && <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />}
                        {scene.status === "pending" && <Play className="h-3 w-3 text-slate-400" />}
                        {scene.status === "completed"
                          ? "Generada"
                          : scene.status === "generating"
                            ? "Generando..."
                            : "Pendiente"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateScene(scene.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                  >
                    {scene.status === "generating" ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Generar
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

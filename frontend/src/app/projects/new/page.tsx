"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Film, ArrowLeft, Sparkles } from "lucide-react"

export default function NewProject() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("Ciencia Ficción")
  const [duration, setDuration] = useState("corto")

  const handleCreate = () => {
    if (!title.trim()) {
      alert("El título es obligatorio")
      return
    }

    // Generar ID único
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Crear objeto del proyecto
    const newProject = {
      id: projectId,
      title: title.trim(),
      genre,
      duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      scenes: [],
      characters: [],
      script: ""
    }

    // Obtener proyectos existentes
    let projects = []
    try {
      const stored = localStorage.getItem("video_ia_projects")
      if (stored) {
        projects = JSON.parse(stored)
      }
    } catch (error) {
      console.error("Error leyendo proyectos:", error)
      projects = []
    }

    // Agregar nuevo proyecto
    projects.push(newProject)

    // Guardar en localStorage
    try {
      localStorage.setItem("video_ia_projects", JSON.stringify(projects))
    } catch (error) {
      console.error("Error guardando proyecto:", error)
      alert("Error al guardar el proyecto")
      return
    }

    // Navegar al workspace del proyecto
    router.push(`/projects/${projectId}`)
  }

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
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => router.push("/projects")}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-cyan-600/20"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

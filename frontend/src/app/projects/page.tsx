"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Film, Plus, ArrowLeft, Calendar, Clock, Video, Image as ImageIcon, Music, Settings, Trash2, Play } from "lucide-react"
import { fetchProjects as apiFetchProjects, createProject as apiCreateProject, deleteProject as apiDeleteProject } from "@/lib/api"

interface Project {
  id: string
  title: string
  genre: string
  duration: string
  status: "draft" | "production" | "rendering" | "completed"
  createdAt: string
  scenes: number
  characters: number
}

const sampleProjects: Project[] = [
  {
    id: "1",
    title: "El Último Amanecer",
    genre: "Ciencia Ficción",
    duration: "12 min",
    status: "production",
    createdAt: "2024-01-15",
    scenes: 24,
    characters: 5,
  },
  {
    id: "2",
    title: "Sombras del Pasado",
    genre: "Thriller",
    duration: "8 min",
    status: "draft",
    createdAt: "2024-01-20",
    scenes: 12,
    characters: 3,
  },
  {
    id: "3",
    title: "Naturaleza Viva",
    genre: "Documental",
    duration: "25 min",
    status: "completed",
    createdAt: "2024-01-10",
    scenes: 45,
    characters: 0,
  },
]

const statusColors = {
  draft: "bg-slate-600 text-slate-200",
  production: "bg-cyan-600/20 text-cyan-400",
  rendering: "bg-purple-600/20 text-purple-400",
  completed: "bg-emerald-600/20 text-emerald-400",
}

const statusLabels = {
  draft: "Borrador",
  production: "En Producción",
  rendering: "Renderizando",
  completed: "Completado",
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(sampleProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newGenre, setNewGenre] = useState("")

  useEffect(() => {
    async function loadProjects() {
      try {
        const backendProjects = await apiFetchProjects()
        if (Array.isArray(backendProjects) && backendProjects.length > 0) {
          const formatted: Project[] = backendProjects.map((p) => ({
            id: p.id.toString(),
            title: p.title,
            genre: p.genre || "Sin género",
            duration: "0 min",
            status: p.status === "in_progress" ? "production" : (p.status as any) || "draft",
            createdAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            scenes: p.scenes?.length || 0,
            characters: p.characters?.length || 0,
          }))
          setProjects(formatted)
          return
        }
      } catch (e) {
        console.warn("Backend not reached, using local fallback")
      }

      try {
        const stored = localStorage.getItem("video_ia_projects")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const ids = new Set(parsed.map((p: Project) => p.id))
            const merged = [...parsed, ...sampleProjects.filter((sp) => !ids.has(sp.id))]
            setProjects(merged)
          }
        }
      } catch {}
    }
    loadProjects()
  }, [])

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return
    let newId = Date.now().toString()

    try {
      const created = await apiCreateProject({ title: newTitle, genre: newGenre || "Sin género" })
      if (created && created.id) {
        newId = created.id.toString()
      }
    } catch (e) {
      console.warn("Could not save to backend API, saving locally:", e)
    }

    const newProject: Project = {
      id: newId,
      title: newTitle,
      genre: newGenre || "Sin género",
      duration: "0 min",
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      scenes: 0,
      characters: 0,
    }
    const updated = [newProject, ...projects]
    setProjects(updated)
    try {
      localStorage.setItem("video_ia_projects", JSON.stringify(updated))
    } catch {}

    setNewTitle("")
    setNewGenre("")
    setShowNewProject(false)

    setTimeout(() => {
      router.push(`/projects/${newId}`)
    }, 0)
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await apiDeleteProject(id)
    } catch (e) {}

    const updated = projects.filter((p) => p.id !== id)
    setProjects(updated)
    try {
      localStorage.setItem("video_ia_projects", JSON.stringify(updated))
    } catch {}
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Inicio</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-cyan-400" />
                <h1 className="text-xl font-bold text-white">Mis Proyectos</h1>
              </div>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Proyecto</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Título del Proyecto</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej: Mi Cortometraje"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Género</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Seleccionar género</option>
                    <option value="Ciencia Ficción">Ciencia Ficción</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Drama">Drama</option>
                    <option value="Comedia">Comedia</option>
                    <option value="Terror">Terror</option>
                    <option value="Documental">Documental</option>
                    <option value="Animación">Animación</option>
                    <option value="Fantasía">Fantasía</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newTitle.trim()}
                  className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  Crear Proyecto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm">Total Proyectos</p>
            <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm">En Producción</p>
            <p className="text-3xl font-bold text-cyan-400 mt-1">
              {projects.filter((p) => p.status === "production").length}
            </p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm">Completados</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm">Borradores</p>
            <p className="text-3xl font-bold text-slate-300 mt-1">
              {projects.filter((p) => p.status === "draft").length}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <Film className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No hay proyectos aún</h3>
            <p className="text-slate-500 mb-6">Crea tu primer proyecto para comenzar</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-600/30 transition-all"
              >
                {/* Project Thumbnail Placeholder */}
                <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                  <Video className="h-12 w-12 text-slate-700 group-hover:text-cyan-600/50 transition-colors" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-pointer"
                  >
                    <div className="h-14 w-14 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-600/30">
                      <Play className="h-6 w-6 text-white ml-1" fill="white" />
                    </div>
                  </button>
                </div>

                {/* Project Info */}
                <div className="p-5">
                  <h3
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="text-lg font-semibold text-white mb-1 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    {project.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">{project.genre}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {project.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md">
                      <Video className="h-3 w-3 text-cyan-400" />
                      <span className="text-xs text-slate-300">{project.scenes} escenas</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md">
                      <ImageIcon className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-slate-300">{project.characters} personajes</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-2 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

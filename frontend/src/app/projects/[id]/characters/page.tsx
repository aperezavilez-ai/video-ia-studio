"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Film, Users, Plus } from "lucide-react"

interface Character {
  id: string
  name: string
  role: string
  prompt: string
}

export default function CharactersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [characters, setCharacters] = useState<Character[]>([
    {
      id: "c1",
      name: "Dra. Elena Vance",
      role: "Protagonista / Científica",
      prompt: "Cyberpunk female scientist, futuristic suit, portrait 8k",
    },
    {
      id: "c2",
      name: "NEXUS-9",
      role: "Androide de Asistencia",
      prompt: "Chrome sleek android robot with blue LED eyes, close up",
    },
  ])

  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [prompt, setPrompt] = useState("")

  const handleAdd = () => {
    if (!name.trim() || !role.trim()) return
    setCharacters([
      ...characters,
      { id: Date.now().toString(), name, role, prompt: prompt || "Personaje cinematográfico" },
    ])
    setName("")
    setRole("")
    setPrompt("")
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
            <h1 className="text-2xl font-bold text-white">Personajes</h1>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Nuevo personaje</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Rol"
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600"
              />
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt visual del personaje"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-600"
            />
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar personaje
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {characters.map((character) => (
              <div key={character.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                <p className="text-white font-medium">{character.name}</p>
                <p className="text-slate-400 text-sm">{character.role}</p>
                <p className="text-slate-500 text-xs">{character.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

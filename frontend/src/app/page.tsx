"use client"

import { Film, Video, Image as ImageIcon, Music, Sparkles } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Video IA Studio</h1>
            </div>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Nuevo Proyecto
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/10 border border-cyan-600/20 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Plataforma Personal de Producción Cinematográfica</span>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6">
            Crea películas completas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              con Inteligencia Artificial
            </span>
          </h2>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            De la idea al render final. Genera video, audio, imágenes y efectos localmente en tu propio hardware.
          </p>

          <div className="flex items-center justify-center gap-4 mb-20">
            <Link
              href="/projects"
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-cyan-600/20"
            >
              Comenzar Ahora
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
            >
              Ver Documentación
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-600/30 transition-colors">
            <div className="h-12 w-12 bg-cyan-600/10 rounded-lg flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Generación de Video</h3>
            <p className="text-slate-400 text-sm">
              ComfyUI + LTX Video, HunyuanVideo y modelos locales de última generación
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-600/30 transition-colors">
            <div className="h-12 w-12 bg-purple-600/10 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Imágenes IA</h3>
            <p className="text-slate-400 text-sm">
              Personajes consistentes, storyboards y conceptos visuales generados localmente
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-pink-600/30 transition-colors">
            <div className="h-12 w-12 bg-pink-600/10 rounded-lg flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Audio y Voces</h3>
            <p className="text-slate-400 text-sm">
              Coqui XTTS, Wav2Lip y síntesis de voz de alta calidad en español e inglés
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-emerald-600/30 transition-colors">
            <div className="h-12 w-12 bg-emerald-600/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Director IA</h3>
            <p className="text-slate-400 text-sm">
              GPT-4 y Claude como cerebro creativo: guion, historia, personajes y dirección
            </p>
          </div>
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="container mx-auto px-4 py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Pipeline de Producción
          </h3>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="px-4 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg font-medium">IDEA</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg font-medium">HISTORIA</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg font-medium">GUION</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg font-medium">PERSONAJES</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg font-medium">STORYBOARD</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-pink-600/20 text-pink-300 rounded-lg font-medium">ESCENAS</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg font-medium">VIDEO</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg font-medium">AUDIO</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg font-medium">MONTAJE</span>
              <span className="text-slate-600">→</span>
              <span className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg font-medium">RENDER FINAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>Video IA Studio - Plataforma Personal</p>
            <p>Powered by ComfyUI, GPT-4, Claude</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

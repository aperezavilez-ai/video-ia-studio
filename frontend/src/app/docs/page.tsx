"use client"

import { useRouter } from "next/navigation"
import { Film, ArrowLeft, Cpu, HardDrive, Database, Zap } from "lucide-react"

export default function Docs() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <Film className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Documentación</h1>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Pipeline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="h-8 w-8 text-cyan-400" />
              Pipeline de Producción
            </h2>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <pre className="text-sm text-slate-300 overflow-x-auto">
{`IDEA → HISTORIA → GUION → PERSONAJES → MUNDO → STORYBOARD → ESCENAS
  ↓
GENERACIÓN IMÁGENES → GENERACIÓN VIDEO → VOCES → MÚSICA → EFECTOS
  ↓
MONTAJE → POSTPRODUCCIÓN → RENDER → PELÍCULA FINAL`}
              </pre>
            </div>
          </div>

          {/* Stack Tecnológico */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-400" />
              Stack Tecnológico
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Backend</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• FastAPI (Python 3.11+)</li>
                  <li>• OpenAI GPT + Anthropic Claude</li>
                  <li>• ComfyUI + LTX Video / HunyuanVideo</li>
                  <li>• PostgreSQL 16</li>
                  <li>• Redis 7 + Celery</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Frontend</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• shadcn/ui + Tailwind CSS</li>
                  <li>• Zustand (estado)</li>
                  <li>• tRPC + WebSocket</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">GPU Workers</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• ComfyUI + MCP Server</li>
                  <li>• LTX Video 2.3, HunyuanVideo 1.5</li>
                  <li>• Coqui XTTS, Wav2Lip</li>
                  <li>• Real-ESRGAN, RIFE</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Infraestructura</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Docker + Docker Compose</li>
                  <li>• Nginx (proxy)</li>
                  <li>• Prometheus + Grafana</li>
                  <li>• Loki (logs)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Requisitos Hardware */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Cpu className="h-8 w-8 text-green-400" />
              Requisitos de Hardware
            </h2>
            
            <div className="space-y-4">
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Nivel 1 - Prototipo</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• GPU: NVIDIA RTX 4070 Ti (12GB VRAM)</li>
                  <li>• RAM: 32GB</li>
                  <li>• SSD: 512GB NVMe</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Nivel 2 - Producción Personal</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• GPU: NVIDIA RTX 4090 (24GB VRAM)</li>
                  <li>• RAM: 64GB</li>
                  <li>• SSD: 2TB NVMe</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-purple-400 mb-3">Nivel 3 - Películas Largas</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• GPU: 2x NVIDIA RTX 4090 (48GB VRAM)</li>
                  <li>• RAM: 128GB</li>
                  <li>• SSD: 4TB NVMe RAID</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-orange-400 mb-3">Nivel 4 - Fine-tuning</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• GPU: 4x NVIDIA A6000 (192GB VRAM)</li>
                  <li>• RAM: 256GB</li>
                  <li>• SSD: 8TB NVMe RAID</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Film Bible */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-yellow-400" />
              Film Bible
            </h2>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <p className="text-slate-300 mb-4">
                Base de datos estructurada que mantiene la coherencia del proyecto cinematográfico:
              </p>
              <ul className="space-y-2 text-slate-300">
                <li>• <strong className="text-white">Proyecto:</strong> Título, género, duración, resolución</li>
                <li>• <strong className="text-white">Historia:</strong> Premisa, sinopsis, actos, secuencias</li>
                <li>• <strong className="text-white">Guion:</strong> Escenas, diálogos, acciones, transiciones</li>
                <li>• <strong className="text-white">Personajes:</strong> Apariencia, vestuario, voz, perfil psicológico</li>
                <li>• <strong className="text-white">Mundo:</strong> Locaciones, props, vehículos, período temporal</li>
                <li>• <strong className="text-white">Estilo Visual:</strong> Color, iluminación, cámara, lentes</li>
                <li>• <strong className="text-white">Assets:</strong> Imágenes referencia, prompts, seeds, workflows</li>
                <li>• <strong className="text-white">Historial:</strong> Versiones, renders, comparativas</li>
              </ul>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}

# Video IA Studio

Plataforma personal y privada para crear cortometrajes y películas completas mediante IA.

## Características

- **Usuario único**: Administrador personal (no SaaS)
- **Procesamiento local**: Generación de video, imagen y audio en hardware propio
- **Director IA**: Gafcore Gateway (procesamiento de lenguaje local / privado)
- **Pipeline completo**: Desde idea hasta render final

## Pipeline de Producción

```
IDEA → HISTORIA → GUION → PERSONAJES → MUNDO → STORYBOARD → ESCENAS
  ↓
GENERACIÓN IMÁGENES → GENERACIÓN VIDEO → VOCES → MÚSICA → EFECTOS
  ↓
MONTAJE → POSTPRODUCCIÓN → RENDER → PELÍCULA FINAL
```

## Stack Tecnológico

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Motor IA**: Gafcore Gateway (Director de IA)
- **Generación Video**: ComfyUI + LTX Video / HunyuanVideo
- **Base de datos**: PostgreSQL 16
- **Cache**: Redis 7
- **Cola**: Celery + Redis

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Estado**: Zustand
- **Comunicación**: tRPC + WebSocket

### GPU Workers
- **Orquestador**: ComfyUI
- **MCP**: ComfyUI MCP Server
- **Modelos**: LTX Video 2.3, HunyuanVideo 1.5, WAN 2.2
- **Audio**: Coqui XTTS, Wav2Lip
- **Upscaling**: Real-ESRGAN, RIFE

### Infraestructura
- **Contenedores**: Docker + Docker Compose
- **Proxy**: Nginx
- **Monitoreo**: Prometheus + Grafana
- **Logs**: Loki

## Estructura del Proyecto

```
/backend          → API FastAPI + Director IA
/frontend         → Dashboard Next.js
/comfyui          → Workflows + custom nodes
/workers          → Celery workers GPU
/models           → Checkpoints, LoRA, embeddings
/film-bible       → Base de datos de proyecto cinematográfico
/storage          → Assets generados (imágenes, videos, audio)
/docker           → Compose + Dockerfiles
/docs             → Documentación técnica
```

## Requisitos de Hardware

### Nivel 1 - Prototipo
- GPU: NVIDIA RTX 4070 Ti (12GB VRAM)
- RAM: 32GB
- SSD: 512GB NVMe

### Nivel 2 - Producción Personal
- GPU: NVIDIA RTX 4090 (24GB VRAM)
- RAM: 64GB
- SSD: 2TB NVMe

### Nivel 3 - Películas Largas
- GPU: 2x NVIDIA RTX 4090 (48GB VRAM total)
- RAM: 128GB
- SSD: 4TB NVMe RAID

### Nivel 4 - Entrenamiento/Fine-tuning
- GPU: 4x NVIDIA A6000 (192GB VRAM total)
- RAM: 256GB
- SSD: 8TB NVMe RAID

## Film Bible

Base de datos estructurada que mantiene:

- **Proyecto**: Título, género, duración, resolución
- **Historia**: Premisa, sinopsis, actos, secuencias
- **Guion**: Escenas, diálogos, acciones, transiciones
- **Personajes**: Apariencia, vestuario, voz, perfil psicológico
- **Mundo**: Locaciones, props, vehículos, período temporal
- **Estilo Visual**: Color, iluminación, cámara, lentes
- **Assets**: Imágenes referencia, prompts, seeds, workflows
- **Historial**: Versiones, renders, comparativas

## Instalación

Ver [INSTALL.md](./INSTALL.md) para instrucciones detalladas.

## Licencia

Uso personal. Todos los derechos reservados.

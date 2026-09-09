"""
Video IA Studio - Backend API
FastAPI server para generación de video mediante IA
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal, List
import uvicorn
import asyncio
import random
import time
import os
import json
from docx import Document
from openai import OpenAI

app = FastAPI(title="Video IA Studio API", version="1.0.0")

# CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos
class SceneGenerationRequest(BaseModel):
    prompt: str
    duration: int = 5
    resolution: str = "1280x720"
    model: Literal["ltx-video", "hunyuan-video"] = "ltx-video"

class SceneGenerationResponse(BaseModel):
    scene_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    video_url: Optional[str] = None
    progress: int = 0

class ProjectRequest(BaseModel):
    title: str
    genre: str
    duration_minutes: int

# --- Modelos para análisis de guion ---

class CharacterSheet(BaseModel):
    id: str
    name: str
    role: str
    visual_prompt: str
    voice_id: Optional[str] = None

class ScriptScene(BaseModel):
    id: str
    scene_number: int
    title: str
    description: str
    visual_prompt: str
    dialogue: str
    characters_involved: List[str]
    duration_seconds: int
    mood: str

class ScriptAnalysisResponse(BaseModel):
    project_id: str
    title: str
    total_scenes: int
    estimated_duration_seconds: int
    characters: List[CharacterSheet]
    scenes: List[ScriptScene]

# Simulación de generación de video
generation_queue = {}

@app.get("/")
async def root():
    return {
        "service": "Video IA Studio API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/scenes/generate", response_model=SceneGenerationResponse)
async def generate_scene(request: SceneGenerationRequest):
    """Genera una escena de video usando IA"""
    
    scene_id = f"scene_{int(time.time())}_{random.randint(1000, 9999)}"
    
    # Inicializar en cola
    generation_queue[scene_id] = {
        "status": "queued",
        "progress": 0,
        "prompt": request.prompt,
        "duration": request.duration,
        "model": request.model
    }
    
    # Simular generación asíncrona
    asyncio.create_task(simulate_generation(scene_id, request.duration))
    
    return SceneGenerationResponse(
        scene_id=scene_id,
        status="queued",
        progress=0
    )

@app.get("/api/scenes/{scene_id}/status", response_model=SceneGenerationResponse)
async def get_scene_status(scene_id: str):
    """Consulta el estado de generación de una escena"""
    
    if scene_id not in generation_queue:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    data = generation_queue[scene_id]
    
    return SceneGenerationResponse(
        scene_id=scene_id,
        status=data["status"],
        video_url=data.get("video_url"),
        progress=data["progress"]
    )

async def simulate_generation(scene_id: str, duration: int):
    """Simula el proceso de generación de video"""
    
    # Procesamiento
    generation_queue[scene_id]["status"] = "processing"
    
    # Simular progreso (en producción esto vendría de ComfyUI/GPU worker)
    for progress in range(0, 101, 10):
        generation_queue[scene_id]["progress"] = progress
        await asyncio.sleep(0.5)  # Simula tiempo de procesamiento
    
    # Completado
    generation_queue[scene_id]["status"] = "completed"
    generation_queue[scene_id]["video_url"] = f"/storage/videos/{scene_id}.mp4"
    generation_queue[scene_id]["progress"] = 100

@app.post("/api/projects/create")
async def create_project(request: ProjectRequest):
    """Crea un nuevo proyecto cinematográfico"""
    
    project_id = f"proj_{int(time.time())}"
    
    return {
        "project_id": project_id,
        "title": request.title,
        "genre": request.genre,
        "duration_minutes": request.duration_minutes,
        "status": "created"
    }

@app.post("/api/script/analyze", response_model=ScriptAnalysisResponse)
async def analyze_script(file: UploadFile = File(...)):
    """Analiza un archivo Word con el guion y extrae personajes y escenas"""
    
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx")
    
    # Guardar archivo temporalmente
    temp_path = f"temp_{int(time.time())}_{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        # Extraer texto del Word
        doc = Document(temp_path)
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="El documento está vacío")
        
        # Analizar con OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "demo-key"))
        
        analysis_prompt = f"""Analiza el siguiente guion de video y extrae:
1. Título del proyecto
2. Personajes (nombre, rol, descripción visual detallada para IA)
3. Escenas (número, título, descripción visual, diálogo, personajes involucrados, duración estimada, mood)

Devuelve un JSON con esta estructura exacta:
{{
  "title": "Título del proyecto",
  "characters": [
    {{"name": "Nombre", "role": "Rol", "visual_prompt": "Descripción visual detallada para generación de video IA"}}
  ],
  "scenes": [
    {{
      "scene_number": 1,
      "title": "Título de la escena",
      "description": "Descripción narrativa",
      "visual_prompt": "Prompt visual detallado para IA de video",
      "dialogue": "Diálogos de la escena",
      "characters_involved": ["Personaje1"],
      "duration_seconds": 10,
      "mood": "dramatic"
    }}
  ]
}}

Guion:
{full_text[:4000]}"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": analysis_prompt}],
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        
        # Construir respuesta
        project_id = f"proj_{int(time.time())}"
        
        characters = [
            CharacterSheet(
                id=f"char_{i}_{int(time.time())}",
                name=c.get("name", f"Personaje {i+1}"),
                role=c.get("role", "Sin rol"),
                visual_prompt=c.get("visual_prompt", "Personaje cinematográfico"),
                voice_id=None
            )
            for i, c in enumerate(analysis.get("characters", []))
        ]
        
        scenes = [
            ScriptScene(
                id=f"scene_{s.get('scene_number', i+1)}_{int(time.time())}",
                scene_number=s.get("scene_number", i+1),
                title=s.get("title", f"Escena {i+1}"),
                description=s.get("description", ""),
                visual_prompt=s.get("visual_prompt", "Escena cinematográfica"),
                dialogue=s.get("dialogue", ""),
                characters_involved=s.get("characters_involved", []),
                duration_seconds=s.get("duration_seconds", 10),
                mood=s.get("mood", "neutral")
            )
            for i, s in enumerate(analysis.get("scenes", []))
        ]
        
        total_duration = sum(s.duration_seconds for s in scenes) if scenes else 0
        
        return ScriptAnalysisResponse(
            project_id=project_id,
            title=analysis.get("title", "Proyecto sin título"),
            total_scenes=len(scenes),
            estimated_duration_seconds=total_duration,
            characters=characters,
            scenes=scenes
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando guion: {str(e)}")
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    print("🎬 Video IA Studio Backend - Starting...")
    print("📡 API disponible en: http://localhost:8000")
    print("📚 Docs interactivas: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

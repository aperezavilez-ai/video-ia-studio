from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
import io
import docx
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.project import Project, Scene, Character, ProjectStatus, SceneStatus
from app.services.llm_client import gafcore_client

router = APIRouter()

# Schemas
class ProjectCreate(BaseModel):
    title: str
    genre: str
    description: Optional[str] = ""

class SceneCreate(BaseModel):
    title: str
    prompt: str
    duration_sec: Optional[int] = 5

class CharacterCreate(BaseModel):
    name: str
    role: Optional[str] = ""
    prompt: Optional[str] = ""

class SceneResponse(BaseModel):
    id: int
    project_id: int
    number: int
    title: str
    prompt: str
    status: str
    duration_sec: int
    video_url: Optional[str] = None

    class Config:
        from_attributes = True

class CharacterResponse(BaseModel):
    id: int
    project_id: int
    name: str
    role: Optional[str]
    prompt: Optional[str]

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    title: str
    genre: Optional[str]
    description: Optional[str]
    status: str
    created_at: Optional[datetime]
    scenes: List[SceneResponse] = []
    characters: List[CharacterResponse] = []

    class Config:
        from_attributes = True

class ScriptGenerateRequest(BaseModel):
    premise: str
    duration_minutes: Optional[int] = 10

# Endpoints
@router.get("/", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """List all film projects"""
    projects = db.query(Project).order_by(Project.id.desc()).all()
    return projects

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """Create new film project"""
    db_project = Project(
        title=project_in.title,
        genre=project_in.genre,
        description=project_in.description,
        status=ProjectStatus.DRAFT
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None

# Scenes Endpoints
@router.post("/{project_id}/scenes", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
async def add_scene(project_id: int, scene_in: SceneCreate, db: Session = Depends(get_db)):
    """Add a scene to project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    count = db.query(Scene).filter(Scene.project_id == project_id).count()
    db_scene = Scene(
        project_id=project_id,
        number=count + 1,
        title=scene_in.title,
        prompt=scene_in.prompt,
        duration_sec=scene_in.duration_sec,
        status=SceneStatus.PENDING
    )
    db.add(db_scene)
    db.commit()
    db.refresh(db_scene)
    return db_scene

# Script Generation via Gafcore Gateway
@router.post("/{project_id}/generate-script")
async def generate_script_for_project(
    project_id: int,
    req: ScriptGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate script using Gafcore Gateway AI Director"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    script_text = await gafcore_client.generate_script(
        premise=req.premise,
        genre=project.genre or "Drama",
        duration_minutes=req.duration_minutes or 10
    )
    
    project.description = script_text
    db.commit()
    
    return {
        "project_id": project_id,
        "script": script_text
    }


class ScriptUploadRequest(BaseModel):
    script_text: str


@router.post("/{project_id}/parse-script")
async def parse_script_and_populate_project(
    project_id: int,
    req: ScriptUploadRequest,
    db: Session = Depends(get_db)
):
    """
    Analiza un guion subido y auto-alimenta el proyecto con los personajes,
    escenas, locaciones y diálogos extraídos por Gafcore Gateway.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    parsed_data = await gafcore_client.analyze_and_parse_script(req.script_text)

    # Actualizar guion completo
    project.description = req.script_text
    if parsed_data.get("title") and project.title == "Nuevo Proyecto":
        project.title = parsed_data["title"]
    if parsed_data.get("genre"):
        project.genre = parsed_data["genre"]

    # Agregar Personajes
    created_characters = []
    for char in parsed_data.get("characters", []):
        db_char = Character(
            project_id=project_id,
            name=char.get("name", "Personaje Sin Nombre"),
            role=char.get("role", "Secundario"),
            prompt=char.get("prompt", "Portrait 8k")
        )
        db.add(db_char)
        created_characters.append(db_char)

    # Agregar Escenas
    created_scenes = []
    for idx, sc in enumerate(parsed_data.get("scenes", []), start=1):
        db_scene = Scene(
            project_id=project_id,
            number=sc.get("number", idx),
            title=sc.get("title", f"Escena #{idx}"),
            prompt=sc.get("prompt", "Cinematic scene shot 8k"),
            duration_sec=sc.get("duration_sec", 6),
            status=SceneStatus.PENDING
        )
        db.add(db_scene)
        created_scenes.append(db_scene)

    db.commit()
    db.refresh(project)

    return {
        "status": "success",
        "project_id": project_id,
        "characters_extracted": len(created_characters),
        "scenes_extracted": len(created_scenes),
        "parsed_data": parsed_data
    }


@router.post("/{project_id}/upload-script-file")
async def upload_script_file_and_populate_project(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Sube un archivo de guion en formato Word (.docx), TXT o Markdown (.md),
    extrae el texto y alimenta el proyecto mediante Gafcore Gateway.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    contents = await file.read()
    script_text = ""

    filename = file.filename.lower() if file.filename else ""

    if filename.endswith(".docx"):
        try:
            doc = docx.Document(io.BytesIO(contents))
            script_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error leyendo archivo Word (.docx): {e}")
    else:
        try:
            script_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            script_text = contents.decode("latin-1")

    if not script_text.strip():
        raise HTTPException(status_code=400, detail="El archivo subido está vacío o no contiene texto legible.")

    parsed_data = await gafcore_client.analyze_and_parse_script(script_text)

    # Guardar en base de datos
    project.description = script_text
    if parsed_data.get("title") and project.title == "Nuevo Proyecto":
        project.title = parsed_data["title"]
    if parsed_data.get("genre"):
        project.genre = parsed_data["genre"]

    created_characters = []
    for char in parsed_data.get("characters", []):
        db_char = Character(
            project_id=project_id,
            name=char.get("name", "Personaje"),
            role=char.get("role", "Rol"),
            prompt=char.get("prompt", "Portrait 8k")
        )
        db.add(db_char)
        created_characters.append(db_char)

    created_scenes = []
    for idx, sc in enumerate(parsed_data.get("scenes", []), start=1):
        db_scene = Scene(
            project_id=project_id,
            number=sc.get("number", idx),
            title=sc.get("title", f"Escena #{idx}"),
            prompt=sc.get("prompt", "Cinematic shot 8k"),
            duration_sec=sc.get("duration_sec", 6),
            status=SceneStatus.PENDING
        )
        db.add(db_scene)
        created_scenes.append(db_scene)

    db.commit()
    db.refresh(project)

    return {
        "status": "success",
        "filename": file.filename,
        "script_text": script_text,
        "characters_extracted": len(created_characters),
        "scenes_extracted": len(created_scenes),
        "parsed_data": parsed_data
    }

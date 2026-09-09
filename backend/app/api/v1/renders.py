"""Video render endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.project import RenderJob, Scene
from app.worker import generate_video

router = APIRouter()


class RenderRequest(BaseModel):
    project_id: int
    scene_id: int
    model: Optional[str] = "ltx-video"


class RenderStatus(BaseModel):
    id: int
    project_id: int
    scene_id: Optional[int]
    status: str  # pending, processing, completed, failed
    progress: float
    result_url: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=RenderStatus)
async def create_render(request: RenderRequest, db: Session = Depends(get_db)):
    """Start new render job for a scene"""
    scene = db.query(Scene).filter(Scene.id == request.scene_id).first()
    prompt = scene.prompt if scene else "Cinematic sci-fi scene"

    job = RenderJob(
        project_id=request.project_id,
        scene_id=request.scene_id,
        status="pending",
        progress=0.0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch Celery task
    try:
        generate_video.delay(
            project_id=request.project_id,
            scene_id=request.scene_id,
            prompt=prompt,
            model=request.model or "ltx-video"
        )
    except Exception as e:
        # Fallback if Redis is not running
        job.status = "queued"

    return job


@router.get("/{render_id}", response_model=RenderStatus)
async def get_render_status(render_id: int, db: Session = Depends(get_db)):
    """Get render job status from database"""
    job = db.query(RenderJob).filter(RenderJob.id == render_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    return job

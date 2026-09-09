"""AI models management endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db

router = APIRouter()


class AIModel(BaseModel):
    id: str
    name: str
    type: str  # video, image, audio
    status: str  # available, downloading, unavailable
    size_gb: float


@router.get("/", response_model=List[AIModel])
async def list_models(db: Session = Depends(get_db)):
    """List available AI models"""
    return [
        AIModel(
            id="ltx-video-2.3",
            name="LTX Video 2.3",
            type="video",
            status="available",
            size_gb=12.5
        ),
        AIModel(
            id="hunyuan-video-1.5",
            name="HunyuanVideo 1.5",
            type="video",
            status="available",
            size_gb=15.8
        )
    ]


@router.get("/{model_id}", response_model=AIModel)
async def get_model(model_id: str, db: Session = Depends(get_db)):
    """Get model details"""
    # TODO: Implement model query
    return AIModel(
        id=model_id,
        name="Model",
        type="video",
        status="available",
        size_gb=10.0
    )

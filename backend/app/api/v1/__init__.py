"""API v1 router"""
from fastapi import APIRouter

from app.api.v1 import projects, renders, models, auth

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(renders.router, prefix="/renders", tags=["renders"])
router.include_router(models.router, prefix="/models", tags=["models"])

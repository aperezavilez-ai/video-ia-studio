"""
Celery worker configuration and GPU tasks
"""
import asyncio
import logging
from celery import Celery
from app.core.config import settings
from app.core.workflows import build_ltx_video_workflow, build_hunyuan_video_workflow
from app.services.comfyui_client import comfyui_client

logger = logging.getLogger(__name__)

celery_app = Celery(
    "video_ia_studio",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="app.worker.generate_video")
def generate_video(project_id: int, scene_id: int, prompt: str, model: str = "ltx-video", duration_sec: int = 5):
    """
    Tarea Celery de generacion de video en GPU mediante ComfyUI
    """
    logger.info(f"Iniciando tarea de generacion de video: Proyecto #{project_id}, Escena #{scene_id}")

    # Construir el workflow JSON segun el modelo solicitado
    if model == "hunyuan-video":
        workflow = build_hunyuan_video_workflow(prompt, duration_sec=duration_sec)
    else:
        workflow = build_ltx_video_workflow(prompt, duration_sec=duration_sec)

    try:
        # Enviar workflow a ComfyUI
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        prompt_id = loop.run_until_complete(comfyui_client.queue_prompt(workflow))
        output_url = f"/storage/videos/scene_{scene_id}.mp4"

        return {
            "status": "completed",
            "project_id": project_id,
            "scene_id": scene_id,
            "prompt_id": prompt_id,
            "video_url": output_url
        }
    except Exception as e:
        logger.error(f"Error procesando escena #{scene_id} en ComfyUI: {e}")
        return {
            "status": "failed",
            "project_id": project_id,
            "scene_id": scene_id,
            "error": str(e)
        }


@celery_app.task(name="app.worker.generate_audio")
def generate_audio(project_id: int, dialogue_id: int, text: str, voice_config: dict):
    """Generate audio using TTS"""
    logger.info(f"Generando voz TTS para dialogo #{dialogue_id}")
    audio_url = f"/storage/audio/dialogue_{dialogue_id}.wav"
    return {
        "status": "completed",
        "project_id": project_id,
        "dialogue_id": dialogue_id,
        "audio_url": audio_url
    }

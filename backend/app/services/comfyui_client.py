"""
ComfyUI API Client
Cliente de conexión con el motor de generación local ComfyUI (HTTP + WebSocket)
"""
import httpx
import logging
import json
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ComfyUIClient:
    """Cliente HTTP/WebSocket para interactuar con servidor ComfyUI local"""

    def __init__(self, host: str = "localhost", port: int = 8188):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"
        self.ws_url = f"ws://{host}:{port}/ws"

    async def is_healthy(self) -> bool:
        """Verifica si el servidor de ComfyUI está respondiendo"""
        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                res = await client.get(f"{self.base_url}/system_stats")
                return res.status_code == 200
            except Exception:
                return False

    async def queue_prompt(self, workflow_prompt: Dict[str, Any], client_id: str = "video_ia_studio") -> str:
        """
        Envia un workflow prompt a la cola de ejecucion de ComfyUI
        Retorna el prompt_id generado por ComfyUI
        """
        payload = {
            "prompt": workflow_prompt,
            "client_id": client_id
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post(f"{self.base_url}/prompt", json=payload)
                res.raise_for_status()
                data = res.json()
                prompt_id = data.get("prompt_id")
                logger.info(f"ComfyUI prompt encolado exitosamente: {prompt_id}")
                return prompt_id
            except httpx.HTTPError as exc:
                logger.error(f"Error al encolar prompt en ComfyUI: {exc}")
                raise RuntimeError(f"ComfyUI Queue Error: {exc}")

    async def get_history(self, prompt_id: str) -> Dict[str, Any]:
        """Obtiene el historial y resultados de un prompt finalizado"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(f"{self.base_url}/history/{prompt_id}")
                res.raise_for_status()
                return res.json()
            except httpx.HTTPError as exc:
                logger.error(f"Error consultando historial de ComfyUI ({prompt_id}): {exc}")
                return {}


comfyui_client = ComfyUIClient()

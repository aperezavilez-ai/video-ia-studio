"""
Gafcore Gateway LLM Client
Cliente de integración para Gafcore Gateway (Director de IA)
"""
import httpx
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GafcoreGatewayClient:
    """Cliente para interactuar con Gafcore Gateway API"""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None
    ):
        self.base_url = (base_url or settings.GAFCORE_GATEWAY_URL).rstrip("/")
        self.api_key = api_key or settings.GAFCORE_API_KEY
        self.default_model = default_model or settings.GAFCORE_DEFAULT_MODEL

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-project-key"] = self.api_key
        return headers

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Envia una solicitud de chat completion a Gafcore Gateway
        """
        endpoint = f"{self.base_url}/chat/completions"
        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                logger.error(f"Error conectando con Gafcore Gateway ({endpoint}): {exc}")
                raise RuntimeError(f"Gafcore Gateway Error: {exc}")

    async def generate_script(self, premise: str, genre: str, duration_minutes: int) -> str:
        """
        Genera un guion cinemático utilizando Gafcore Gateway
        """
        system_prompt = (
            "Eres un Director de Cine con IA experto en redactar guiones cinematográficos "
            "estructurados, desglose de escenas y diálogos dinámicos."
        )
        user_prompt = (
            f"Crea un guion cinematográfico para una película de género '{genre}' "
            f"con una duración estimada de {duration_minutes} minutos basada en la premisa: {premise}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        res = await self.chat_completion(messages=messages)
        try:
            return res["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return str(res)

    async def analyze_and_parse_script(self, script_text: str) -> Dict[str, Any]:
        """
        Analiza un guion completo y extrae automaticamente personajes, locaciones,
        escenas y prompts de generación visual en formato JSON estructurado.
        """
        system_prompt = (
            "Eres un Asistente Director de Cine especializado en desglose de guiones. "
            "Tu tarea es analizar el texto del guion entregado y responder ÚNICAMENTE con un JSON válido "
            "con la siguiente estructura exacta sin texto explicativo extra:\n"
            "{\n"
            '  "title": "Título del proyecto",\n'
            '  "genre": "Género cinemático",\n'
            '  "characters": [{"name": "Nombre", "role": "Rol/Descripción", "prompt": "Prompt visual de apariencia"}],\n'
            '  "locations": [{"name": "Nombre de locación", "description": "Descripción visual"}],\n'
            '  "scenes": [\n'
            '    {\n'
            '      "number": 1,\n'
            '      "title": "Título o encabezado de la escena",\n'
            '      "prompt": "Prompt cinematográfico detallado para generación de video de 8k (iluminación, toma de cámara, estilo)",\n'
            '      "duration_sec": 6,\n'
            '      "dialogues": [{"character": "Nombre Personaje", "text": "Texto del diálogo"}]\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analiza y desglosa el siguiente guion:\n\n{script_text}"}
        ]

        res = await self.chat_completion(messages=messages, temperature=0.3)
        try:
            content = res["choices"][0]["message"]["content"]
            # Extraer bloque JSON si el modelo devolvio markdown ```json ... ```
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            import json
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error parseando respuesta JSON de Gafcore Gateway: {e}")
            return {
                "title": "Proyecto Importado",
                "genre": "Drama",
                "characters": [],
                "locations": [],
                "scenes": [
                    {
                        "number": 1,
                        "title": "Escena 1",
                        "prompt": script_text[:200],
                        "duration_sec": 5,
                        "dialogues": []
                    }
                ]
            }


# Instancia global del cliente Gafcore Gateway
gafcore_client = GafcoreGatewayClient()

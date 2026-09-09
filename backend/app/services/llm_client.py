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
        Analiza un guion completo y lo fragmenta en clips de producción con
        continuidad, vestuario, locación, diálogo, voz, cámara e intenciones.
        """
        system_prompt = (
            "Eres el Director de Cine IA de Video IA Studio. "
            "Analiza el guion y responde ÚNICAMENTE con JSON válido (sin markdown) con esta estructura:\n"
            "{\n"
            '  "title": "Título",\n'
            '  "genre": "Género",\n'
            '  "logline": "Logline",\n'
            '  "characters": [{"name":"","role":"","appearance":"","wardrobe":"","voice_type":"","personality":"","continuity_notes":"","prompt":""}],\n'
            '  "locations": [{"name":"","time_of_day":"","description":"","lighting":"","atmosphere":""}],\n'
            '  "scenes": [{\n'
            '    "number": 1,\n'
            '    "title": "",\n'
            '    "slugline": "INT./EXT. LOC - TIEMPO",\n'
            '    "location": "",\n'
            '    "time_of_day": "",\n'
            '    "summary": "",\n'
            '    "action": "",\n'
            '    "characters_present": [],\n'
            '    "wardrobe_continuity": "",\n'
            '    "dialogues": [{"character":"","text":"","delivery":"","verbal_intention":""}],\n'
            '    "camera": {"shot_type":"","movement":"","transition_in":"","transition_out":"","lens_mood":""},\n'
            '    "visual_intention": "",\n'
            '    "verbal_intention": "",\n'
            '    "continuity_in": "",\n'
            '    "continuity_out": "",\n'
            '    "duration_sec": 6,\n'
            '    "mood": "",\n'
            '    "prompt": "prompt cinematográfico detallado en inglés"\n'
            "  }],\n"
            '  "continuity_bible": ""\n'
            "}\n"
            "Cuida continuidad entre clips, vestimenta, locación, diálogos, tipo de voz, "
            "transiciones de cámara e intenciones verbales/visuales."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analiza y fragmenta el siguiente guion en clips:\n\n{script_text[:48000]}"}
        ]

        res = await self.chat_completion(messages=messages, temperature=0.25)
        try:
            content = res["choices"][0]["message"]["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            import json
            data = json.loads(content)
            # Compat: mapear clips -> scenes si el modelo usó "clips"
            if "scenes" not in data and "clips" in data:
                data["scenes"] = data["clips"]
            # Enriquecer prompt de escena con metadatos de continuidad
            for sc in data.get("scenes", []):
                if not sc.get("prompt"):
                    sc["prompt"] = sc.get("summary") or sc.get("action") or "Cinematic scene 8k"
                extras = []
                if sc.get("wardrobe_continuity"):
                    extras.append(f"Wardrobe continuity: {sc['wardrobe_continuity']}")
                if sc.get("visual_intention"):
                    extras.append(f"Visual intention: {sc['visual_intention']}")
                if sc.get("verbal_intention"):
                    extras.append(f"Verbal intention: {sc['verbal_intention']}")
                cam = sc.get("camera") or {}
                if cam:
                    extras.append(
                        f"Camera: {cam.get('shot_type','')}/{cam.get('movement','')}; "
                        f"{cam.get('transition_in','')}->{cam.get('transition_out','')}"
                    )
                if extras:
                    sc["prompt"] = f"{sc['prompt']}\n" + "\n".join(extras)
                # Character prompt enrichment
            for char in data.get("characters", []):
                bits = [char.get("prompt") or ""]
                if char.get("appearance"):
                    bits.append(f"Appearance: {char['appearance']}")
                if char.get("wardrobe"):
                    bits.append(f"Wardrobe: {char['wardrobe']}")
                if char.get("voice_type"):
                    bits.append(f"Voice: {char['voice_type']}")
                char["prompt"] = " | ".join([b for b in bits if b])
                if char.get("voice_type") and char.get("role"):
                    char["role"] = f"{char['role']} · Voz: {char['voice_type']}"
            return data
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

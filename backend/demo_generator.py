import os
import json
from datetime import datetime
from pathlib import Path

class DemoVideoGenerator:
    def __init__(self):
        self.output_dir = Path("storage/demos")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_demo_project(self):
        """Genera un proyecto demo completo con escenas renderizables"""
        demo_data = {
            "id": f"demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "title": "Proyecto Demo - Viaje Espacial",
            "genre": "Ciencia Ficción",
            "duration": 30,
            "resolution": "1920x1080",
            "fps": 24,
            "created_at": datetime.now().isoformat(),
            "scenes": [
                {
                    "id": "scene_01",
                    "number": 1,
                    "title": "Nave espacial despegando",
                    "prompt": "Cinematic shot of futuristic spaceship launching from Earth, volumetric clouds, sunset lighting, photorealistic 8k, epic scale",
                    "duration": 5,
                    "status": "ready",
                    "settings": {
                        "model": "ltx-video",
                        "steps": 25,
                        "cfg_scale": 7.5,
                        "seed": 42
                    }
                },
                {
                    "id": "scene_02",
                    "number": 2,
                    "title": "Viaje interestelar",
                    "prompt": "POV flying through colorful nebula in deep space, cosmic dust particles, stars streaking past, cinematic space documentary style",
                    "duration": 6,
                    "status": "ready",
                    "settings": {
                        "model": "ltx-video",
                        "steps": 30,
                        "cfg_scale": 8.0,
                        "seed": 123
                    }
                },
                {
                    "id": "scene_03",
                    "number": 3,
                    "title": "Planeta alienígena",
                    "prompt": "Establishing shot of alien planet surface, purple vegetation, two moons in pink sky, bioluminescent flora, cinematic sci-fi",
                    "duration": 7,
                    "status": "ready",
                    "settings": {
                        "model": "hunyuan-video",
                        "steps": 35,
                        "cfg_scale": 7.0,
                        "seed": 456
                    }
                },
                {
                    "id": "scene_04",
                    "number": 4,
                    "title": "Contacto alienígena",
                    "prompt": "Close up of humanoid alien with iridescent skin, large eyes, peaceful expression, soft dramatic lighting, photorealistic portrait",
                    "duration": 5,
                    "status": "ready",
                    "settings": {
                        "model": "hunyuan-video",
                        "steps": 30,
                        "cfg_scale": 8.5,
                        "seed": 789
                    }
                },
                {
                    "id": "scene_05",
                    "number": 5,
                    "title": "Regreso a la Tierra",
                    "prompt": "Spaceship entering Earth atmosphere, fiery re-entry effects, blue planet below, dramatic cinematic shot from space",
                    "duration": 7,
                    "status": "ready",
                    "settings": {
                        "model": "ltx-video",
                        "steps": 28,
                        "cfg_scale": 7.8,
                        "seed": 999
                    }
                }
            ],
            "characters": [
                {
                    "id": "char_01",
                    "name": "Capitana Sarah Chen",
                    "role": "Comandante de la misión",
                    "prompt": "Asian female astronaut, 30s, confident expression, spacesuit with mission patches, short dark hair, photorealistic portrait 8k",
                    "voice_settings": {
                        "model": "xtts",
                        "language": "es",
                        "emotion": "confident"
                    }
                },
                {
                    "id": "char_02",
                    "name": "Zyx",
                    "role": "Embajador alienígena",
                    "prompt": "Tall alien humanoid, iridescent purple-blue skin, large expressive eyes, elegant features, bioluminescent patterns, peaceful demeanor",
                    "voice_settings": {
                        "model": "xtts",
                        "language": "es",
                        "emotion": "calm",
                        "pitch_shift": 0.8
                    }
                }
            ],
            "audio": {
                "music_style": "Epic orchestral sci-fi soundtrack",
                "sfx_needed": ["engine rumble", "space ambience", "atmospheric whoosh", "alien atmosphere"],
                "dialogue": [
                    {
                        "scene": "scene_01",
                        "character": "char_01",
                        "text": "Control, aquí nave Odisea. Iniciando secuencia de despegue.",
                        "timestamp": 2.0
                    },
                    {
                        "scene": "scene_04",
                        "character": "char_02",
                        "text": "Bienvenidos, viajeros. Hemos esperado mucho tiempo para este encuentro.",
                        "timestamp": 1.5
                    }
                ]
            },
            "post_production": {
                "color_grade": "cinematic_teal_orange",
                "transitions": ["crossfade", "warp_effect", "fade_through_white"],
                "effects": ["lens_flare", "film_grain", "vignette"],
                "upscale": True,
                "target_quality": "high"
            }
        }
        
        output_path = self.output_dir / f"{demo_data['id']}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(demo_data, f, indent=2, ensure_ascii=False)
        
        return demo_data, output_path

if __name__ == "__main__":
    generator = DemoVideoGenerator()
    demo, path = generator.generate_demo_project()
    print(f"✓ Demo generado: {path}")
    print(f"✓ Título: {demo['title']}")
    print(f"✓ Escenas: {len(demo['scenes'])}")
    print(f"✓ Duración total: {demo['duration']} segundos")

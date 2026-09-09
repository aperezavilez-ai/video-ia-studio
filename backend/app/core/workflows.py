"""
ComfyUI Workflow Templates
Generadores de estructuras JSON para modelos LTX-Video, HunyuanVideo y SDXL
"""
from typing import Dict, Any

def build_ltx_video_workflow(prompt: str, duration_sec: int = 5, seed: int = 42) -> Dict[str, Any]:
    """Genera la estructura de nodos para LTX-Video 2.3 en ComfyUI"""
    frame_count = duration_sec * 24
    return {
        "1": {
            "inputs": {
                "ckpt_name": "ltx-video-2.3.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": f"cinematic film shot, 8k resolution, photorealistic, {prompt}",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "blurry, low quality, distorted, artifacts, lowres",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": {
                "width": 1280,
                "height": 720,
                "length": frame_count,
                "batch_size": 1
            },
            "class_type": "EmptyLTXVideoLatent"
        },
        "5": {
            "inputs": {
                "seed": seed,
                "steps": 25,
                "cfg": 7.5,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "6": {
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "7": {
            "inputs": {
                "filename_prefix": "video_ia_studio_scene",
                "fps": 24,
                "images": ["6", 0]
            },
            "class_type": "VHS_VideoCombine"
        }
    }

def build_hunyuan_video_workflow(prompt: str, duration_sec: int = 5, seed: int = 123) -> Dict[str, Any]:
    """Genera la estructura de nodos para HunyuanVideo 1.5 en ComfyUI"""
    frame_count = duration_sec * 24
    return {
        "1": {
            "inputs": {
                "ckpt_name": "hunyuan_video_720p.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": f"masterpiece, high quality, sci-fi movie scene, {prompt}",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "seed": seed,
                "steps": 30,
                "cfg": 8.0,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "width": 1280,
                "height": 720,
                "length": frame_count,
                "batch_size": 1
            },
            "class_type": "EmptyHunyuanLatent"
        },
        "5": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "6": {
            "inputs": {
                "filename_prefix": "hunyuan_scene",
                "fps": 24,
                "images": ["5", 0]
            },
            "class_type": "VHS_VideoCombine"
        }
    }

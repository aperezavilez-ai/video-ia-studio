/**
 * Tipos y prompt del Director IA para desglose cinematográfico de guiones.
 */

export interface ScriptCharacter {
  name: string
  role: string
  appearance: string
  wardrobe: string
  voice_type: string
  personality: string
  continuity_notes: string
  prompt: string
}

export interface ScriptLocation {
  name: string
  time_of_day: string
  description: string
  lighting: string
  atmosphere: string
}

export interface ScriptDialogue {
  character: string
  text: string
  delivery: string
  verbal_intention: string
}

export interface ScriptClip {
  number: number
  title: string
  slugline: string
  location: string
  time_of_day: string
  summary: string
  action: string
  characters_present: string[]
  wardrobe_continuity: string
  dialogues: ScriptDialogue[]
  camera: {
    shot_type: string
    movement: string
    transition_in: string
    transition_out: string
    lens_mood: string
  }
  visual_intention: string
  verbal_intention: string
  continuity_in: string
  continuity_out: string
  duration_sec: number
  mood: string
  prompt: string
}

export interface ScriptAnalysisResult {
  title: string
  genre: string
  logline: string
  total_clips: number
  estimated_duration_seconds: number
  characters: ScriptCharacter[]
  locations: ScriptLocation[]
  clips: ScriptClip[]
  continuity_bible: string
}

export const SCRIPT_ANALYSIS_SYSTEM_PROMPT = `Eres el Director de Cine IA de Video IA Studio.
Analizas guiones y los fragmentas en CLIPS de producción listos para generación audiovisual.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con JSON válido (sin markdown ni texto fuera del JSON).
2. Cuida CONTINUIDAD entre clips: vestuario, peinado, props, heridas, hora del día, clima, posición espacial.
3. Cada clip debe ser auto-contenido para generación de video, pero coherente con el anterior y el siguiente.
4. Extrae TODOS los personajes con apariencia, vestimenta, tipo de voz e intenciones.
5. Incluye locación, diálogos, transiciones de cámara e intenciones verbales/visuales en cada clip.
6. Prefiere clips de 4–12 segundos salvo que la acción exija más.
7. El campo "prompt" de cada clip debe ser un prompt cinematográfico detallado en inglés (8k, lighting, camera, wardrobe, continuity locks).
8. El campo "prompt" de cada personaje debe ser portrait prompt consistente (identidad visual bloqueada).

Estructura JSON exacta:
{
  "title": "string",
  "genre": "string",
  "logline": "string",
  "total_clips": 0,
  "estimated_duration_seconds": 0,
  "characters": [
    {
      "name": "string",
      "role": "string",
      "appearance": "string",
      "wardrobe": "string",
      "voice_type": "string",
      "personality": "string",
      "continuity_notes": "string",
      "prompt": "string"
    }
  ],
  "locations": [
    {
      "name": "string",
      "time_of_day": "string",
      "description": "string",
      "lighting": "string",
      "atmosphere": "string"
    }
  ],
  "clips": [
    {
      "number": 1,
      "title": "string",
      "slugline": "INT./EXT. LOCACIÓN - TIEMPO",
      "location": "string",
      "time_of_day": "string",
      "summary": "string",
      "action": "string",
      "characters_present": ["string"],
      "wardrobe_continuity": "string",
      "dialogues": [
        {
          "character": "string",
          "text": "string",
          "delivery": "string",
          "verbal_intention": "string"
        }
      ],
      "camera": {
        "shot_type": "wide|medium|close-up|pov|insert|tracking",
        "movement": "static|pan|tilt|dolly|handheld|crane",
        "transition_in": "cut|fade|dissolve|match-cut|whip-pan",
        "transition_out": "cut|fade|dissolve|match-cut|whip-pan",
        "lens_mood": "string"
      },
      "visual_intention": "string",
      "verbal_intention": "string",
      "continuity_in": "qué debe coincidir con el clip anterior",
      "continuity_out": "qué debe preservar el siguiente clip",
      "duration_sec": 6,
      "mood": "string",
      "prompt": "string"
    }
  ],
  "continuity_bible": "resumen maestro de continuidad del proyecto"
}`

export function buildClipGenerationPrompt(clip: ScriptClip, characters: ScriptCharacter[]): string {
  const charLock = characters
    .filter((c) => clip.characters_present.includes(c.name))
    .map((c) => `${c.name}: ${c.appearance}; wardrobe:${c.wardrobe}`)
    .join(" | ")

  return [
    clip.prompt,
    `Location: ${clip.location}, ${clip.time_of_day}.`,
    `Camera: ${clip.camera.shot_type}, ${clip.camera.movement}, in:${clip.camera.transition_in}, out:${clip.camera.transition_out}.`,
    `Visual intention: ${clip.visual_intention}.`,
    `Continuity lock: ${clip.wardrobe_continuity}. ${clip.continuity_in}`,
    charLock ? `Character locks: ${charLock}` : "",
    "Cinematic, photorealistic, 8k, consistent identity, film still.",
  ]
    .filter(Boolean)
    .join(" ")
}

export function safeParseAnalysisJson(raw: string): ScriptAnalysisResult {
  let content = raw.trim()
  if (content.includes("```json")) {
    content = content.split("```json")[1].split("```")[0].trim()
  } else if (content.includes("```")) {
    content = content.split("```")[1].split("```")[0].trim()
  }

  const parsed = JSON.parse(content) as ScriptAnalysisResult
  if (!parsed.clips || !Array.isArray(parsed.clips)) {
    throw new Error("La IA no devolvió clips válidos")
  }

  parsed.total_clips = parsed.clips.length
  parsed.estimated_duration_seconds =
    parsed.estimated_duration_seconds ||
    parsed.clips.reduce((sum, c) => sum + (Number(c.duration_sec) || 6), 0)
  parsed.characters = parsed.characters || []
  parsed.locations = parsed.locations || []
  parsed.continuity_bible = parsed.continuity_bible || ""
  return parsed
}

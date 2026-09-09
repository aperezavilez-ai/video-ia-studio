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
  // Compat clips/scenes
  const clips = (parsed as any).clips || (parsed as any).scenes
  if (!clips || !Array.isArray(clips)) {
    throw new Error("La IA no devolvió clips válidos")
  }
  parsed.clips = clips

  parsed.total_clips = parsed.clips.length
  parsed.estimated_duration_seconds =
    parsed.estimated_duration_seconds ||
    parsed.clips.reduce((sum, c) => sum + (Number(c.duration_sec) || 6), 0)
  parsed.characters = parsed.characters || []
  parsed.locations = parsed.locations || []
  parsed.continuity_bible = parsed.continuity_bible || ""
  return parsed
}

export type RawSceneChunk = {
  number: number
  slugline: string
  body: string
}

const SLUGLINE_RE =
  /^(?:\s*(?:\d+[A-Z]?\s*)?(?:INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?|EST\.?)\s*[.\-–—:]?\s*.+)$/gim

export function splitScriptIntoRawScenes(scriptText: string, maxClips = 18): RawSceneChunk[] {
  const text = scriptText.replace(/\r\n/g, "\n").trim()
  if (!text) return []

  const matches = Array.from(text.matchAll(SLUGLINE_RE))
  if (matches.length === 0) {
    // Sin encabezados: trocea por bloques de párrafos
    const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    const chunkSize = Math.max(1, Math.ceil(paras.length / Math.min(maxClips, 12)))
    const chunks: RawSceneChunk[] = []
    for (let i = 0; i < paras.length && chunks.length < maxClips; i += chunkSize) {
      const body = paras.slice(i, i + chunkSize).join("\n\n")
      chunks.push({
        number: chunks.length + 1,
        slugline: `ESCENA ${chunks.length + 1}`,
        body,
      })
    }
    return chunks
  }

  const chunks: RawSceneChunk[] = []
  for (let i = 0; i < matches.length && chunks.length < maxClips; i += 1) {
    const start = matches[i].index ?? 0
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const block = text.slice(start, end).trim()
    const firstLine = block.split("\n")[0]?.trim() || `ESCENA ${i + 1}`
    const body = block.split("\n").slice(1).join("\n").trim() || block
    chunks.push({
      number: chunks.length + 1,
      slugline: firstLine.slice(0, 180),
      body: body.slice(0, 2500),
    })
  }
  return chunks
}

function guessDialogues(body: string): ScriptDialogue[] {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean)
  const dialogues: ScriptDialogue[] = []
  for (let i = 0; i < lines.length - 1; i += 1) {
    const maybeName = lines[i]
    const maybeText = lines[i + 1]
    if (
      /^[A-ZÁÉÍÓÚÑ0-9 #.'-]{2,40}$/.test(maybeName) &&
      !/^(INT\.|EXT\.|FADE|CUT|TRANSITION)/i.test(maybeName) &&
      maybeText &&
      !/^[A-ZÁÉÍÓÚÑ0-9 #.'-]{2,40}$/.test(maybeText)
    ) {
      dialogues.push({
        character: maybeName,
        text: maybeText.replace(/^\((.+)\)\s*/, "").trim(),
        delivery: maybeText.startsWith("(") ? maybeText : "natural",
        verbal_intention: "avanzar la escena",
      })
      i += 1
    }
  }
  return dialogues.slice(0, 6)
}

export function buildHeuristicAnalysis(
  scriptText: string,
  opts: { title?: string; genre?: string; duration?: string } = {},
): ScriptAnalysisResult {
  const maxClips = opts.duration === "largo" ? 30 : opts.duration === "medio" ? 20 : 14
  const raw = splitScriptIntoRawScenes(scriptText, maxClips)
  const clips: ScriptClip[] = raw.map((scene, idx) => {
    const dialogues = guessDialogues(scene.body)
    const characters_present = Array.from(new Set(dialogues.map((d) => d.character)))
    const location = scene.slugline.replace(/^(INT\.?\/EXT\.?|INT\.?|EXT\.?|I\/E\.?)\s*/i, "").split("-")[0]?.trim() || "Locación"
    const time_of_day = /-+\s*(D[IÍ]A|NOCHE|ATARDECER|AMANECER|TARDE|MAÑANA)/i.exec(scene.slugline)?.[1] || "DÍA"
    const camera = {
      shot_type: idx === 0 ? "wide" : idx % 3 === 0 ? "close-up" : "medium",
      movement: idx % 4 === 0 ? "dolly" : "static",
      transition_in: idx === 0 ? "fade" : "cut",
      transition_out: "cut",
      lens_mood: "cinematic natural",
    }
    const summary = scene.body.split("\n").filter(Boolean).slice(0, 2).join(" ").slice(0, 220)
    const prompt = [
      `Cinematic film still, ${scene.slugline}.`,
      summary,
      `Location ${location}, ${time_of_day}.`,
      `Camera ${camera.shot_type} ${camera.movement}.`,
      "Photorealistic, continuity locked wardrobe, 8k.",
    ].join(" ")

    return {
      number: scene.number,
      title: scene.slugline.slice(0, 80),
      slugline: scene.slugline,
      location,
      time_of_day,
      summary: summary || scene.slugline,
      action: scene.body.slice(0, 600),
      characters_present,
      wardrobe_continuity: "Mantener vestuario y peinado del clip anterior salvo cambio explícito",
      dialogues,
      camera,
      visual_intention: "Cubrir la acción narrativa del bloque con claridad visual",
      verbal_intention: dialogues[0]?.verbal_intention || "Sostener el tono dramático del guion",
      continuity_in: idx === 0 ? "Establecer look inicial" : "Heredar vestuario, luz y posición del clip anterior",
      continuity_out: "Dejar estado visual listo para el siguiente clip",
      duration_sec: Math.min(12, Math.max(5, Math.round(scene.body.length / 120))),
      mood: "dramático",
      prompt,
    }
  })

  const characterNames = Array.from(new Set(clips.flatMap((c) => c.characters_present)))
  const characters: ScriptCharacter[] = characterNames.map((name) => ({
    name,
    role: "Personaje",
    appearance: "Apariencia coherente a lo largo del guion",
    wardrobe: "Vestuario continuo salvo cambio de escena indicado",
    voice_type: "voz natural en español",
    personality: "según diálogo del guion",
    continuity_notes: "No cambiar rostro ni vestuario entre clips sin justificación",
    prompt: `Consistent character portrait of ${name}, cinematic, identity locked, 8k`,
  }))

  const locationsMap = new Map<string, ScriptLocation>()
  for (const clip of clips) {
    if (!locationsMap.has(clip.location)) {
      locationsMap.set(clip.location, {
        name: clip.location,
        time_of_day: clip.time_of_day,
        description: clip.slugline,
        lighting: "cinematic practical lighting",
        atmosphere: clip.mood,
      })
    }
  }

  return {
    title: opts.title || "Proyecto desde guion",
    genre: opts.genre || "Drama",
    logline: clips[0]?.summary || "Guion fragmentado en clips de producción",
    total_clips: clips.length,
    estimated_duration_seconds: clips.reduce((s, c) => s + c.duration_sec, 0),
    characters,
    locations: Array.from(locationsMap.values()),
    clips,
    continuity_bible:
      "Preservar identidad de personajes, vestuario y tipología de luz entre clips consecutivos salvo cambio de slugline.",
  }
}

/** Prompt compacto para enriquecer clips ya fragmentados (rápido, cabe en timeout Vercel). */
export const SCRIPT_ENRICH_SYSTEM_PROMPT = `Eres Director IA. Te pasan clips YA fragmentados.
Devuelve SOLO JSON:
{
  "title":"",
  "genre":"",
  "logline":"",
  "characters":[{"name":"","role":"","appearance":"","wardrobe":"","voice_type":"","personality":"","continuity_notes":"","prompt":""}],
  "clips":[{"number":1,"title":"","wardrobe_continuity":"","visual_intention":"","verbal_intention":"","continuity_in":"","continuity_out":"","camera":{"shot_type":"","movement":"","transition_in":"","transition_out":"","lens_mood":""},"mood":"","prompt":"","dialogues":[{"character":"","text":"","delivery":"","verbal_intention":""}]}],
  "continuity_bible":""
}
Reglas: no inventes clips nuevos; mejora los existentes; prompts en inglés; cuida continuidad/vestuario/voz/cámara.`

/**
 * Client API utility to communicate Next.js Frontend with FastAPI Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Project {
  id: number;
  title: string;
  genre: string;
  description?: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  created_at?: string;
  scenes?: Scene[];
  characters?: Character[];
}

export interface Scene {
  id: number;
  project_id: number;
  number: number;
  title: string;
  prompt: string;
  status: "pending" | "generating" | "completed" | "failed";
  duration_sec: number;
  video_url?: string;
}

export interface Character {
  id: number;
  project_id: number;
  name: string;
  role?: string;
  prompt?: string;
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/`, { cache: "no-store" });
    if (!res.ok) throw new Error("Error fetching projects");
    return await res.json();
  } catch (err) {
    console.error("API error, fallback to local:", err);
    return [];
  }
}

export async function createProject(data: { title: string; genre: string; description?: string }): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error creating project");
  return await res.json();
}

export async function getProject(id: number | string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Project not found");
  return await res.json();
}

export async function deleteProject(id: number | string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
    method: "DELETE",
  });
}

export async function addScene(projectId: number | string, scene: { title: string; prompt: string; duration_sec?: number }): Promise<Scene> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/scenes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scene),
  });
  if (!res.ok) throw new Error("Error adding scene");
  return await res.json();
}

export async function generateScript(projectId: number | string, premise: string, durationMinutes = 10): Promise<{ script: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ premise, duration_minutes: durationMinutes }),
  });
  if (!res.ok) throw new Error("Error generating script via Gafcore Gateway");
  return await res.json();
}

export async function parseScript(projectId: number | string, scriptText: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/parse-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script_text: scriptText }),
  });
  if (!res.ok) throw new Error("Error parsing script via Gafcore Gateway");
  return await res.json();
}

export async function uploadScriptFile(projectId: number | string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/upload-script-file`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Error uploading script file");
  return await res.json();
}

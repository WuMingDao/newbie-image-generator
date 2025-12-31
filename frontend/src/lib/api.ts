import type {
  GenerateRequest,
  QueueResponse,
  HistoryResponse,
  QueueStatus,
  SystemStatus,
  HealthResponse,
} from "./types";
import { resolveApiBase } from "./config";

const API_BASE = resolveApiBase();

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  // Health check (note: /health is at root, not under /api)
  async health(): Promise<HealthResponse> {
    const base = API_BASE.replace(/\/api$/, "");
    const response = await fetch(`${base}/health`);
    if (!response.ok) throw new Error("Health check failed");
    return response.json();
  },

  // System status
  async status(): Promise<SystemStatus> {
    return request("/status");
  },

  // Generate image
  async generate(params: GenerateRequest): Promise<QueueResponse> {
    return request("/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Get queue status
  async queue(): Promise<QueueStatus> {
    return request("/queue");
  },

  // Get history for a prompt
  async history(promptId: string): Promise<HistoryResponse> {
    return request(`/history/${promptId}`);
  },

  // Get image URL
  getImageUrl(filename: string, subfolder = "", type = "output"): string {
    return `${API_BASE}/images/${filename}?subfolder=${subfolder}&type=${type}`;
  },

  // Interrupt current generation
  async interrupt(): Promise<{ status: string }> {
    return request("/interrupt", { method: "POST" });
  },

  // Clear queue
  async clear(): Promise<{ status: string }> {
    return request("/clear", { method: "POST" });
  },

  // Test ComfyUI connection
  async testComfyUI(url: string): Promise<{ success: boolean }> {
    return request("/test-comfyui", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },
};

export { ApiError };

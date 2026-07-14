import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/constants/config";

const TOKEN_KEY = "olimpo_jwt";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  /** Milisegundos antes de abortar la petición (default 15s) */
  timeoutMs?: number;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, timeoutMs = 15000, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("La conexión tardó demasiado. Revisa tu internet.", 0);
    }
    throw new ApiError("Sin conexión. Revisa tu internet.", 0);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    // Sesión expirada: el AuthContext detecta el 401 al verificar y manda a login
    throw new ApiError(errorData.error || "Error del servidor", res.status);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

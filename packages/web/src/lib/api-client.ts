const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type BodyInput = FormData | Record<string, unknown> | null | undefined;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function buildBody(body: BodyInput): { body?: BodyInit; headers?: HeadersInit } {
  if (body === undefined || body === null) {
    return {};
  }

  if (body instanceof FormData) {
    return { body };
  }

  return {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  };
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: BodyInput) => {
    const payload = buildBody(body);
    return request<T>(path, { method: "POST", ...payload });
  },
  put: <T>(path: string, body?: BodyInput) => {
    const payload = buildBody(body);
    return request<T>(path, { method: "PUT", ...payload });
  },
  del: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE"
    })
};

import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export const api = axios.create({
  baseURL,
  timeout: 120000,
});

export async function getStatus() {
  const { data } = await api.get("/api/status");
  return data;
}

export async function postSetup(payload) {
  const { data } = await api.post("/api/setup", payload);
  return data;
}

export async function getMemories() {
  const { data } = await api.get("/api/memories");
  return data.memories || [];
}

export async function postConversation(payload) {
  const { data } = await api.post("/api/conversation", payload);
  return data;
}

export async function postTtsAudio(text) {
  const response = await api.post(
    "/api/tts",
    { text },
    { responseType: "blob" }
  );
  return response.data;
}

export async function deleteSetupReset() {
  const { data } = await api.delete("/api/setup/reset");
  return data;
}

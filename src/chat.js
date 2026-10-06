import axios from "axios";

export const MAX_TEXT_LENGTH = 2000;
export const SESSION_KEY = "beakspeak.chat.v1";

export function makeId() {
  return window.crypto?.randomUUID?.() || "session_" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function chatEndpoint(base = process.env.REACT_APP_BACKEND_URL) {
  const url = new URL(base || "https://hooded-vulture-backend.vercel.app");
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid backend URL");
  const path = url.pathname.replace(/\/+$/, "");
  if (path && path !== "/api/chat") throw new Error("Backend URL must be a hostname or end in /api/chat");
  url.pathname = "/api/chat";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function loadChat() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (saved && typeof saved.sessionId === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(saved.sessionId) && Array.isArray(saved.turns)) {
      const turns = saved.turns.filter((turn) => turn && typeof turn.id === "string" && typeof turn.text === "string" && turn.text.trim() && turn.text.length <= MAX_TEXT_LENGTH && turn.status === "complete" && typeof turn.reply === "string" && turn.reply.trim() && turn.reply.length <= 4000).slice(-40);
      return { sessionId: saved.sessionId, turns };
    }
  } catch { /* Storage can be unavailable in private browsing. */ }
  return { sessionId: makeId(), turns: [] };
}

export function saveChat(sessionId, turns) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, turns: turns.filter((turn) => turn.status === "complete").slice(-40) })); }
  catch { /* The current conversation still works without storage. */ }
}

export function conversationHistory(turns) {
  const history = [];
  let length = 0;
  for (const turn of turns.filter((item) => item.status === "complete").slice(-6).reverse()) {
    const size = turn.text.length + turn.reply.length;
    if (length + size > 12000) break;
    history.unshift({ role: "user", content: turn.text }, { role: "assistant", content: turn.reply });
    length += size;
  }
  return history;
}

export function friendlyError(error) {
  const code = error.response?.data?.code;
  const status = error.response?.status;
  if (error.code === "ECONNABORTED" || code === "PROVIDER_TIMEOUT" || status === 504) return "BeakSpeak took too long to reply. You can retry your message.";
  if (status === 429) {
    const wait = Number(error.response?.headers?.["retry-after"]);
    return "Too many messages right now. Please wait " + (Number.isFinite(wait) && wait > 0 ? Math.ceil(wait) + " seconds" : "a minute") + " and try again.";
  }
  if (["SERVICE_NOT_CONFIGURED", "PROVIDER_AUTH_ERROR", "PROVIDER_KEY_REJECTED", "PROVIDER_ACCESS_DENIED", "PROVIDER_CONFIG_ERROR"].includes(code)) return "Chat is temporarily unavailable. The service configuration needs attention.";
  if (status === 400 || status === 413) return "This message could not be sent. Keep it under 2,000 characters and try again.";
  if (!error.response && !code) return "Could not connect to BeakSpeak. Check your connection and try again.";
  return "BeakSpeak could not reply just now. Please try again shortly.";
}

export async function requestReply(payload, signal) {
  const response = await axios.post(chatEndpoint(), payload, { signal, timeout: 30000 });
  if (typeof response.data?.reply !== "string" || !response.data.reply.trim() || response.data.reply.length > 4000) {
    const error = new Error("Invalid response");
    error.response = { status: 502 };
    throw error;
  }
  return response.data;
}

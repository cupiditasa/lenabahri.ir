/**
 * Lena Beauty Assistant
 *
 * Public widget configuration for Lena's hosted assistant API.
 * The site key below is intentionally public. Never put a private provider
 * or admin API key in browser JavaScript.
 */
const LENA_SITE_KEY = "site_uXzpEixNXPXxKucrmnreP9JZ";
const LENA_CONVERSATION_STORAGE = "lena-assistant-conversation-id";

function lenaConversationId() {
  let id = window.localStorage.getItem(LENA_CONVERSATION_STORAGE);
  if (!id) {
    id = window.crypto?.randomUUID?.() ||
      `lena-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(LENA_CONVERSATION_STORAGE, id);
  }
  return id;
}

window.LenaAssistantConfig = {
  mode: "api",
  endpoint: "https://chat.lenabahri.ir/site-api/chat",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeout: 30000,

  buildRequest({ message, history, page }) {
    return {
      siteKey: LENA_SITE_KEY,
      conversationId: lenaConversationId(),
      message,
      history,
      context: {
        page,
        language: "fa",
        brand: "Lena Bahri Beauty Clinic"
      }
    };
  },

  readResponse(payload) {
    return payload.reply ||
      payload.message ||
      payload.answer ||
      payload.data?.reply ||
      payload.data?.message ||
      payload.data?.answer ||
      "";
  }
};

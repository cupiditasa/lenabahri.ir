/**
 * Lena Beauty Assistant
 *
 * Keep this file in demo mode until a server-side API endpoint is ready.
 * Never publish a private provider API key in browser JavaScript. The
 * recommended production setup is:
 *
 * browser -> your own /api/assistant endpoint -> AI provider
 */
window.LenaAssistantConfig = {
  mode: "demo",
  endpoint: "",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000,

  buildRequest({ message, history, page }) {
    return {
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
    return payload.reply || payload.message || payload.answer || "";
  }
};

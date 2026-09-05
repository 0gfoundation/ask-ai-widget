// Defaults shared by the floating widget and the full page, so a site that
// mounts both (popup plus a /ask route) gets the same starter questions and,
// on the same origin, the same persisted conversation.

export const DEFAULT_STARTERS = [
  "What is 0G?",
  "What can I build with the 0G stack?",
  "How do I get started as a builder?",
  "How do I get 0G tokens?",
];

export const DEFAULT_STORAGE_KEY = "ask-ai-widget:conversation";

export const DEFAULT_ACCENT = "#B75FFF";

// src/services/endpoint/keyboard/keyboardShortcutEnd.js
const BASE_URL = import.meta.env.VITE_BASE_URL; // Should be https://your-ngrok-url/api

const KEYMAP_SERVICE = BASE_URL;

export const apiEndpoints = {
  GetKeymap: () => `${KEYMAP_SERVICE}/keymap`,
  SaveKeymap: () => `${KEYMAP_SERVICE}/keymap`,
  ResetKeymap: () => `${KEYMAP_SERVICE}/keymap/reset`,
  ResetKeys: () => `${KEYMAP_SERVICE}/keymap/reset/keys`,
};



// src/services/keyboardService.js
import hotkeys from 'hotkeys-js';
const registry = new Map();
let enabled = true;
// === INTERCEPT CTRL+P AT WINDOW LEVEL (before browser print) ===
let ctrlPCallback = null;
const ctrlPHandler = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (enabled && ctrlPCallback) {
      ctrlPCallback(e);
    }
  }
};
// Attach once at the top level with capture phase
window.addEventListener('keydown', ctrlPHandler, { capture: true });
// === REGISTER HOTKEY ===
export const registerHotkey = (key, callback, options = {}) => {
  const id = options.id || key;
  // === Ctrl+P: handle separately via window capture ===
  if (key.includes('ctrl+p') || key.includes('cmd+p')) {
    if (registry.has(id)) {
      console.warn(`Hotkey conflict: ${key} already registered`);
      return false;
    }
    ctrlPCallback = callback;
    registry.set(id, { key, callback, options, handler: ctrlPHandler });
    return true;
  }
  if (registry.has(id)) {
    console.warn(`Hotkey conflict: ${key} already registered`);
    return false;
  }
  const handler = (e) => {
    if (!enabled) return;
    const active = document.activeElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName);
    // === ESC: SMART BEHAVIOR ===
    if (key === 'escape') {
      e.preventDefault();
      e.stopPropagation();
      if (isInput) {
        if (active.type === 'text' || active.type === 'search') {
          active.value = '';
        }
        active.blur();
      }
      callback(e);
      return;
    }
    // === ENTER: OPEN DATE/DROPDOWN IF FOCUSED ===
    if (key === 'enter' && isInput) {
      if (active.type === 'date') {
        e.preventDefault();
        active.showPicker?.();
        return;
      }
      if (active.tagName === 'SELECT') {
        e.preventDefault();
        active.focus();
        active.click();
        return;
      }
    }
    // === DEFAULT: PASS THROUGH ===
    callback(e);
  };
  hotkeys(key, { ...options, keyup: false }, handler);
  registry.set(id, { key, callback, options, handler });
  return true;
};
// === UNREGISTER ===
export const unregisterHotkey = (id) => {
  const entry = registry.get(id);
  if (entry) {
    if (entry.key.includes('ctrl+p') || entry.key.includes('cmd+p')) {
      ctrlPCallback = null;
    } else {
      hotkeys.unbind(entry.key, entry.handler);
    }
    registry.delete(id);
  }
};
// === DISABLE / ENABLE ===
export const disableHotkeys = () => { enabled = false; };
export const enableHotkeys = () => { enabled = true; };
// === GET ALL ===
export const getAllHotkeys = () => {
  return Array.from(registry.entries()).map(([id, data]) => ({
    id,
    key: data.key,
    label: data.options.label || data.key,
    scope: data.options.scope || 'global',
  }));
};
// === CLEAR ALL ===
export const clearAll = () => {
  registry.forEach((entry) => {
    if (!entry.key.includes('ctrl+p') && !entry.key.includes('cmd+p')) {
      hotkeys.unbind(entry.key, entry.handler);
    }
  });
  ctrlPCallback = null;
  registry.clear();
};
export { registry };


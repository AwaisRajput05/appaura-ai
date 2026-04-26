// src/hooks/usePageShortcuts.js
import { useEffect } from 'react';
export const usePageShortcuts = (shortcuts) => {
  useEffect(() => {
    const isExempt = (target) => {
      const tag = target.tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return true;
      return (
        !!target.closest && target.closest('[data-shortcut-exempt="true"]')
      );
    };
    const handler = (e) => {
      if (isExempt(e.target)) return;
      const mods = [];
      if (e.ctrlKey) mods.push('ctrl');
      if (e.metaKey) mods.push('meta');
      if (e.altKey) mods.push('alt');
      if (e.shiftKey) mods.push('shift');
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';
      if (key === 'tab') key = 'tab';
      if (key === 'enter') key = 'enter';
      if (key === 'backspace') key = 'backspace';
      const combo = [...mods.sort(), key].join('+');
      const action = shortcuts[combo];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
};

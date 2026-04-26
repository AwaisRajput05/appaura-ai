// src/hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserKeymap } from './useUserKeymap';
import { performAction } from './globalActions';
import { useAuth } from '../components/auth/hooks/useAuth';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { keymap } = useUserKeymap();
  const { user, branchPermissions = [] } = useAuth();
  const handlerRef = useRef(null);

  const isPathAllowed = (path) => {
    if (!user?.role) return false;

    // Always allow core pages
    if (['/dashboard', '/profile', '/company/logout'].includes(path)) {
      return true;
    }

    // ADMIN: ONLY allow paths that start with /admin/
    if (user.role === 'ADMIN') {
      return path?.startsWith('/admin/');
    }

    // VENDOR: allow ANYTHING except paths that start with /admin/
    if (user.role === 'VENDOR') {
      return !path?.startsWith('/admin/');
    }

    return false;
  };
  useEffect(() => {
    if (!keymap || Object.keys(keymap).length === 0) return;

    const isExempt = (target) => {
      const tag = target.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return true;
      if (target.closest && target.closest('[data-shortcut-exempt="true"]'))
        return true;
      return false;
    };

    const handleKeydown = (e) => {
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
      const cmd = keymap[combo];
      if (!cmd) return;

      if (cmd.type === 'navigation' && !isPathAllowed(cmd.target)) {
        console.warn(`Access denied to ${cmd.target} (${cmd.label})`);
        return;
      }

      e.preventDefault();
      if (cmd.type === 'navigation') {
        navigate(cmd.target);
      } else if (cmd.type === 'action') {
        performAction(cmd.target);
      }
    };

    if (handlerRef.current) {
      window.removeEventListener('keydown', handlerRef.current);
    }
    window.addEventListener('keydown', handleKeydown);
    handlerRef.current = handleKeydown;

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [keymap, navigate, user, branchPermissions]);
};
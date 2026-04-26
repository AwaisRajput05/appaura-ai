// src/components/common/KeyboardNavigator.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserKeymap } from '../../hooks/useUserKeymap';
import { useAuth } from '../auth/hooks/useAuth';
import { performAction } from '../../hooks/globalActions';

export default function KeyboardNavigator() {
  const { isAuthenticated, user, branchPermissions = [] } = useAuth();
  const navigate = useNavigate();
  const { keymap } = useUserKeymap(); // Now shared via context
  const handlerRef = useRef(null);

  // Centralized permission check for both ADMIN and VENDOR
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
    if (!isAuthenticated || !keymap || Object.keys(keymap).length === 0) return;

    const isExempt = (target) => {
      const tag = target.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return true;
      return (
        !!target.closest && target.closest('[data-shortcut-exempt="true"]')
      );
    };

    let buffer = '';
    let timeoutId = null;

    const handleKeyDown = (e) => {
      if (isExempt(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z0-9]/.test(key)) return;

      e.preventDefault();
      buffer += key;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => (buffer = ''), 800);

      const entry = keymap[buffer];
      if (entry) {
        if (entry.type === 'navigation') {
          if (!isPathAllowed(entry.target)) {
            console.warn(`Access denied to ${entry.target} (${entry.label})`);
            return;
          }
          navigate(entry.target);
        } else if (entry.type === 'action') {
          performAction(entry.target);
        }
        buffer = '';
        clearTimeout(timeoutId);
      }
    };

    if (handlerRef.current) {
      window.removeEventListener('keydown', handlerRef.current);
    }
    window.addEventListener('keydown', handleKeyDown);
    handlerRef.current = handleKeyDown;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, keymap, navigate, user, branchPermissions]);

  return null;
}
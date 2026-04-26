import React, { useEffect, useRef, useState } from 'react';
import { useUserKeymap } from '../../hooks/useUserKeymap';
import { useNavigate } from 'react-router-dom';
import { performAction } from '../../hooks/globalActions';
import { useAuth } from '../auth/hooks/useAuth';
import {
  FiCommand,
  FiX,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX as FiCancel,
  FiRotateCcw,
  FiRefreshCw,
} from 'react-icons/fi';

export default function CommandPalette() {
  const {
    keymap,
    updateKeymap,
    resetKeymap,
    resetKeys,
    refetch,
    loading,
    error,
  } = useUserKeymap();

  const navigate = useNavigate();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingCombo, setEditingCombo] = useState(null);
  const [newCombo, setNewCombo] = useState('');

  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  // Permission check
  const isPathAllowed = (path) => {
    if (!user?.role) return false;
    if (['/dashboard', '/prfofile', '/company/logout'].includes(path)) return true;
    if (user.role === 'ADMIN') return path?.startsWith('/admin/');
    if (user.role === 'VENDOR') return !path?.startsWith('/admin/');
    return false;
  };

  // Open palette with Alt+P → also refetch latest keymap
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setOpen(true);
        setSearch('');
        setEditingCombo(null);
        setNewCombo('');
        refetch(); // Refresh keymap every time palette opens
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [refetch]);

  // Close on ESC or click outside
  useEffect(() => {
    if (!open) return;

    const esc = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setEditingCombo(null);
        setNewCombo('');
      }
    };
    const clickOut = (e) => {
      if (!e.target.closest('.command-palette')) {
        setOpen(false);
        setEditingCombo(null);
        setNewCombo('');
      }
    };

    document.addEventListener('keydown', esc);
    document.addEventListener('mousedown', clickOut);
    return () => {
      document.removeEventListener('keydown', esc);
      document.removeEventListener('mousedown', clickOut);
    };
  }, [open]);

  // Focus inputs
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (editingCombo && editInputRef.current) editInputRef.current.focus();
  }, [editingCombo]);

  // Active shortcuts (hide null/disabled)
  const activeShortcuts = Object.entries(keymap)
    .filter(([, value]) => value !== null)
    .map(([combo, data]) => ({ combo, ...data }));

  const filtered = activeShortcuts
    .filter((s) => {
      if (s.type === 'navigation' && !isPathAllowed(s.target)) return false;
      return s.label?.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => a.combo.localeCompare(b.combo));

  // Execute shortcut
  const run = (s) => {
    setOpen(false);
    if (s.type === 'navigation' && isPathAllowed(s.target)) {
      navigate(s.target);
    } else if (s.type === 'action') {
      performAction(s.target);
    }
  };

  // Start editing combo
  const startEdit = (combo) => {
    setEditingCombo(combo);
    setNewCombo('');
  };

  // Capture new key combo
  useEffect(() => {
    if (!editingCombo) return;

    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const mods = [];
      if (e.ctrlKey) mods.push('ctrl');
      if (e.metaKey) mods.push('meta');
      if (e.altKey) mods.push('alt');
      if (e.shiftKey) mods.push('shift');

      let key = e.key.toLowerCase();

      if (key === ' ') key = 'space';
      else if (key === 'enter') key = 'enter';
      else if (key === 'escape') key = 'escape';
      else if (key === 'tab') key = 'tab';
      else if (key === 'backspace') key = 'backspace';
      else if (key === 'delete') key = 'delete';
      else if (key.startsWith('arrow')) key = key.replace('arrow', '');
      else if (key.startsWith('f') && !isNaN(key.slice(1))) key = key.toLowerCase();
      else if (['control', 'alt', 'shift', 'meta'].includes(key)) return;

      const combo = [...mods, key].filter(Boolean).join('+');
      if (combo) setNewCombo(combo);
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [editingCombo]);

  const clearCombo = () => setNewCombo('');

  // Save new binding
  const saveEdit = async () => {
    if (!editingCombo || !newCombo) return;

    // Check conflict
    if (newCombo !== editingCombo && newCombo in keymap && keymap[newCombo] !== null) {
      alert('This shortcut is already assigned!');
      return;
    }

    const updated = { ...keymap };
    delete updated[editingCombo]; // remove old
    updated[newCombo] = keymap[editingCombo]; // assign new

    await updateKeymap(updated);
    setEditingCombo(null);
    setNewCombo('');
  };

  const cancelEdit = () => {
    setEditingCombo(null);
    setNewCombo('');
  };

  const disableShortcut = async (combo) => {
    if (!window.confirm(`Disable "${combo}"?`)) return;
    await updateKeymap({ ...keymap, [combo]: null });
  };

  const resetSingle = async (combo) => {
    if (!window.confirm(`Reset "${combo}" to default?`)) return;
    await resetKeys([combo]);
  };

  const resetAll = async () => {
    if (!window.confirm('Reset ALL shortcuts to default?')) return;
    await resetKeymap();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden command-palette">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center flex-1">
            <FiCommand className="mr-2 text-xl text-gray-600" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search shortcuts..."
              className="flex-1 outline-none text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              title="Reset all"
            >
              <FiRefreshCw />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <FiX className="text-gray-500" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b">
            {error}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">Loading shortcuts...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No shortcuts found</div>
          ) : (
            <ul>
              {filtered.map((s) => (
                <li
                  key={s.combo}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => run(s)}
                  >
                    <span className="font-medium text-gray-800">{s.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {editingCombo === s.combo ? (
                      <>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={newCombo}
                          readOnly
                          placeholder="Press keys..."
                          className="px-2 py-1 text-xs bg-blue-50 border border-blue-300 rounded font-mono text-blue-700 w-40 text-center"
                        />
                        <button onClick={clearCombo} className="p-1 hover:bg-gray-100">
                          <FiRotateCcw className="text-sm" />
                        </button>
                        <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50">
                          <FiCheck className="text-sm" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-50">
                          <FiCancel className="text-sm" />
                        </button>
                      </>
                    ) : (
                      <>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 rounded font-mono">
                          {s.combo}
                        </kbd>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(s.combo);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetSingle(s.combo);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100"
                        >
                          <FiRefreshCw className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            disableShortcut(s.combo);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
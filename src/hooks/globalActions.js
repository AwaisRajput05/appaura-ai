// src/components/globalActions.js

let sidebarFocusableItems = [];
let openMenus = new Set();
let setOpenMenus = null;

export const rebuildSidebarFocusable = (sections) => {
  sidebarFocusableItems = [];
  const walk = (items, depth = 0, parentIdx = null) => {
    items.forEach((it) => {
      const myIdx = sidebarFocusableItems.length;
      sidebarFocusableItems.push({ ...it, depth, parentIdx });
      if (it.children) walk(it.children, depth + 1, myIdx);
    });
  };
  sections.forEach((sec) => walk(sec.items));
};

export const registerOpenMenus = (setter) => {
  setOpenMenus = setter;
};

export const updateOpenMenus = (menus) => {
  openMenus = menus;
};

const getCurrentFocusIdx = () => {
  const el = document.activeElement;
  const idx = el?.dataset?.sbIdx;
  return idx != null ? parseInt(idx, 10) : -1;
};

const focusItem = (idx) => {
  if (idx < 0 || idx >= sidebarFocusableItems.length) return;
  const el = document.querySelector(`[data-sb-idx="${idx}"]`);
  el?.focus();
};

const getSiblings = (parentIdx) => {
  const result = [];
  for (let i = 0; i < sidebarFocusableItems.length; i++) {
    if (sidebarFocusableItems[i].parentIdx === parentIdx) result.push(i);
  }
  return result;
};

const getFirstChildIdx = (parentIdx) => {
  for (let i = parentIdx + 1; i < sidebarFocusableItems.length; i++) {
    if (sidebarFocusableItems[i].parentIdx === parentIdx) return i;
  }
  return -1;
};

const getLastDescendant = (idx) => {
  let current = idx;
  while (true) {
    const item = sidebarFocusableItems[current];
    if (!item.children || !openMenus.has(item.name)) return current;
    let lastDirect = -1;
    for (let i = current + 1; i < sidebarFocusableItems.length; i++) {
      const sib = sidebarFocusableItems[i];
      if (sib.parentIdx === current) lastDirect = i;
      else if (sib.parentIdx !== item.parentIdx) break;
    }
    if (lastDirect === -1) return current;
    current = lastDirect;
  }
};

const treeNext = (idx) => {
  if (idx === -1 || idx >= sidebarFocusableItems.length) return -1;

  const item = sidebarFocusableItems[idx];

  // 1. If has open children → go to first child
  if (item.children && openMenus.has(item.name)) {
    const firstChild = getFirstChildIdx(idx);
    if (firstChild !== -1) return firstChild;
  }

  // 2. Go up the tree to find next sibling
  let current = idx;
  while (current !== -1 && current < sidebarFocusableItems.length) {
    const currentItem = sidebarFocusableItems[current];
    const parentIdx = currentItem.parentIdx ?? -1;
    const siblings = getSiblings(parentIdx);
    const pos = siblings.indexOf(current);

    if (pos + 1 < siblings.length) {
      return siblings[pos + 1];
    }

    // No next sibling → go up to parent
    current = parentIdx;
  }

  return -1;
};

const treePrev = (idx) => {
  if (idx === -1 || idx >= sidebarFocusableItems.length) return -1;

  const item = sidebarFocusableItems[idx];
  const parentIdx = item.parentIdx ?? -1;
  const siblings = getSiblings(parentIdx);
  const pos = siblings.indexOf(idx);

  // 1. If has previous sibling → go to its last descendant
  if (pos > 0) {
    return getLastDescendant(siblings[pos - 1]);
  }

  // 2. No previous sibling → go to parent
  if (parentIdx !== -1) {
    return parentIdx;
  }

  return -1;
};

// === KEYBOARD NAVIGATION ===
document.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  if (!active || !active.hasAttribute('data-sb-idx')) return;

  const idx = parseInt(active.dataset.sbIdx, 10);
  const item = sidebarFocusableItems[idx];
  if (!item) return;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      if (item.children) {
        if (!openMenus.has(item.name)) {
          setOpenMenus?.((s) => {
            const next = new Set(s);
            next.add(item.name);
            openMenus = next;
            return next;
          });
        }
        setTimeout(() => {
          const first = getFirstChildIdx(idx);
          if (first !== -1) focusItem(first);
        }, 10);
      }
      break;

    case 'ArrowLeft':
      e.preventDefault();
      if (item.children && openMenus.has(item.name)) {
        setOpenMenus?.((s) => {
          const n = new Set(s);
          n.delete(item.name);
          openMenus = n;
          return n;
        });
      } else if (item.parentIdx !== null) {
        const parent = sidebarFocusableItems[item.parentIdx];
        if (openMenus.has(parent.name)) {
          setOpenMenus?.((s) => {
            const n = new Set(s);
            n.delete(parent.name);
            openMenus = n;
            return n;
          });
          setTimeout(() => focusItem(item.parentIdx), 10);
        }
      }
      break;

    case 'ArrowDown':
      e.preventDefault();
      const next = treeNext(idx);
      if (next !== -1) focusItem(next);
      break;

    case 'ArrowUp':
      e.preventDefault();
      const prev = treePrev(idx);
      if (prev !== -1) focusItem(prev);
      break;

    case 'Enter':
      e.preventDefault();
      if (item.children) {
        const willOpen = !openMenus.has(item.name);
        setOpenMenus?.((s) => {
          const n = new Set(s);
          willOpen ? n.add(item.name) : n.delete(item.name);
          openMenus = n;
          return n;
        });
        if (willOpen) {
          setTimeout(() => {
            const first = getFirstChildIdx(idx);
            if (first !== -1) focusItem(first);
          }, 10);
        }
      } else if (item.path) {
        active.querySelector('a')?.click();
      } else if (item.onClick) {
        item.onClick();
      }
      break;
  }
});

// === AUTO-EXPAND VENDOR & ADMIN ON TAB ===
document.addEventListener('keyup', (e) => {
  if (e.key !== 'Tab') return;
  const active = document.activeElement;
  if (!active?.dataset?.sbIdx) return;

  const idx = parseInt(active.dataset.sbIdx, 10);
  const item = sidebarFocusableItems[idx];
  if (!item) return;

  const autoExpand = ['Vendor', 'Admin'];
  if (
    autoExpand.includes(item.name) &&
    item.children &&
    !openMenus.has(item.name)
  ) {
    setOpenMenus?.((s) => {
      const next = new Set(s);
      next.add(item.name);
      openMenus = next;
      return next;
    });
    setTimeout(() => {
      const first = getFirstChildIdx(idx);
      if (first !== -1) focusItem(first);
    }, 0);
  }
});

// === TABLE NAVIGATION ===
export const tableNavigate = (direction) => {
  const cell = document.activeElement;
  if (!cell || !['TD', 'TH'].includes(cell.tagName.toUpperCase())) return;
  const row = cell.parentElement;
  const tbody = row.parentElement;
  const colIdx = Array.from(row.children).indexOf(cell);
  const rows = Array.from(tbody.children);
  const rowIdx = rows.indexOf(row);
  let targetRowIdx = rowIdx,
    targetColIdx = colIdx;
  switch (direction) {
    case 'up':
      targetRowIdx--;
      break;
    case 'down':
      targetRowIdx++;
      break;
    case 'left':
      targetColIdx--;
      break;
    case 'right':
      targetColIdx++;
      break;
    default:
      return;
  }
  if (targetRowIdx < 0 || targetRowIdx >= rows.length) return;
  const targetRow = rows[targetRowIdx];
  if (targetColIdx < 0 || targetColIdx >= targetRow.children.length) return;
  const targetCell = targetRow.children[targetColIdx];
  targetCell?.focus();
};

// === GLOBAL ACTIONS ===
export const focusFirstHeader = () => {
  const first = document.querySelector('th[tabIndex="0"]');
  first ? first.focus() : console.warn('No focusable table header found.');
};

export const globalActions = {
  focusSearchBar: () =>
    document.querySelector('[data-searchbar="true"]')?.focus(),
  focusFilter: () => document.querySelector('[data-filter="true"]')?.click(),
  nextPage: () =>
    document.querySelector('[data-pagination-next="true"]')?.click(),
  prevPage: () =>
    document.querySelector('[data-pagination-prev="true"]')?.click(),
  clearForm: () => {
    const active = document.activeElement;
    const form = active.tagName === 'FORM' ? active : active?.closest('form');
    form?.reset();
  },
  clearField: () => {
    const active = document.activeElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName))
      active.value = '';
  },
  tableUp: () => tableNavigate('up'),
  tableDown: () => tableNavigate('down'),
  tableLeft: () => tableNavigate('left'),
  tableRight: () => tableNavigate('right'),
  submitForm: () => document.activeElement?.closest('form')?.requestSubmit(),
  newEntry: () => document.querySelector('[data-new-entry="true"]')?.click(),
  editEntry: () => document.querySelector('[data-edit-entry="true"]')?.click(),
  deleteEntry: () =>
    document.querySelector('[data-delete-entry="true"]')?.click(),
  print: () => window.print(),
  refreshData: () => window.location.reload(),
  focusFirstHeader,
  sidebarNextTop: () => {
    const top = sidebarFocusableItems
      .filter((i) => i.depth === 0)
      .map((i) => sidebarFocusableItems.indexOf(i));
    const cur = getCurrentFocusIdx();
    const pos = top.indexOf(cur);
    focusItem(top[(pos + 1) % top.length]);
  },
  sidebarPrevTop: () => {
    const top = sidebarFocusableItems
      .filter((i) => i.depth === 0)
      .map((i) => sidebarFocusableItems.indexOf(i));
    const cur = getCurrentFocusIdx();
    const pos = top.indexOf(cur);
    focusItem(top[pos <= 0 ? top.length - 1 : pos - 1]);
  },
  sidebarExpand: () => {
    const idx = getCurrentFocusIdx();
    const item = sidebarFocusableItems[idx];
    if (item?.children && !openMenus.has(item.name)) {
      setOpenMenus?.((s) => {
        const n = new Set(s);
        n.add(item.name);
        openMenus = n;
        return n;
      });
    }
  },
  sidebarCollapse: () => {
    const idx = getCurrentFocusIdx();
    const item = sidebarFocusableItems[idx];
    if (item?.parentIdx !== null) {
      const parent = sidebarFocusableItems[item.parentIdx];
      if (openMenus.has(parent.name)) {
        setOpenMenus?.((s) => {
          const n = new Set(s);
          n.delete(parent.name);
          openMenus = n;
          return n;
        });
      }
    }
  },
  sidebarNextItem: () => {
    const idx = getCurrentFocusIdx();
    const next = treeNext(idx);
    if (next !== -1) focusItem(next);
  },
  sidebarPrevItem: () => {
    const idx = getCurrentFocusIdx();
    const prev = treePrev(idx);
    if (prev !== -1) focusItem(prev);
  },
  sidebarActivate: () => {
    const idx = getCurrentFocusIdx();
    const el = document.querySelector(`[data-sb-idx="${idx}"]`);
    const btn = el?.querySelector('button');
    const link = el?.querySelector('a');
    btn?.click() || link?.click();
  },
  sidebarEscape: () => {
    const idx = getCurrentFocusIdx();
    const item = sidebarFocusableItems[idx];
    if (item?.depth > 0) {
      const parent = sidebarFocusableItems[item.parentIdx];
      if (openMenus.has(parent.name)) {
        setOpenMenus?.((s) => {
          const n = new Set(s);
          n.delete(parent.name);
          openMenus = n;
          return n;
        });
        setTimeout(() => focusItem(item.parentIdx), 10);
      }
    } else {
      document.activeElement?.blur();
    }
  },
};

export const performAction = (id) => {
  const action = globalActions[id];
  if (action) action();
  else console.warn(`Unknown action: ${id}`);
};

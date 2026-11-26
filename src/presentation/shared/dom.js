export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function openDialog(dialogEl) {
  if (dialogEl && !dialogEl.open) dialogEl.showModal();
}

export function closeDialog(dialogEl) {
  if (dialogEl && dialogEl.open) dialogEl.close();
}

let toastTimer = null;
export function showToast(msg, selector = '#toast', duration = 3200) {
  const el = $(selector);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

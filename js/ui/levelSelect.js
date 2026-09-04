// Level map: modal grid of level cards plus the sandbox card. Reused almost
// verbatim from EDU-REGEX / EDU-NET.

import { t, tr } from '../i18n.js';

export function createLevelSelect(overlay, { onSelect } = {}) {
  let levels = [];
  let progress = new Set();
  let currentId = null;

  function render() {
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>${t('selectTitle')}</h2>
          <button class="btn btn-ghost modal-close" aria-label="close">✕</button>
        </div>
        <div class="level-cards">
          ${levels.map((lv, i) => {
    const done = progress.has(lv.id);
    const cur = lv.id === currentId;
    return `<button class="level-card${done ? ' done' : ''}${cur ? ' current' : ''}" data-id="${lv.id}">
              <span class="level-num">${String(i + 1).padStart(2, '0')}</span>
              <span class="level-name">${tr(lv.title)}</span>
              ${done ? '<span class="done-mark">✓</span>' : ''}
            </button>`;
  }).join('')}
          <button class="level-card sandbox-card${currentId === 'sandbox' ? ' current' : ''}" data-id="sandbox">
            <span class="level-num">∞</span>
            <span class="level-name">${t('sandboxCardTitle')}</span>
            <span class="level-desc">${t('sandboxCardDesc')}</span>
          </button>
        </div>
      </div>`;

    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelectorAll('.level-card').forEach((card) => {
      card.addEventListener('click', () => { close(); onSelect?.(card.dataset.id); });
    });
  }

  function close() { overlay.hidden = true; }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return {
    open(allLevels, progressSet, current) {
      levels = allLevels; progress = progressSet; currentId = current;
      render();
      overlay.hidden = false;
    },
    close,
  };
}

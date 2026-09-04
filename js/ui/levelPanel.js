// Lesson panel: level text, goal, shop-rule chips, one-at-a-time hints and the
// pass/fail banner with the list of checks (reading, band). Adapted from
// EDU-SQL's levelPanel.

import { t, tr } from '../i18n.js';
import { formatValue } from '../core/units.js';

export function createLevelPanel(container, { onNext } = {}) {
  let level = null;
  let levelIndex = 0;
  let total = 0;
  let revealedHints = 0;
  let result = null; // {pass, msg, checks?}
  let completed = false;

  function constraintChips() {
    if (!level) return '';
    const chips = [];
    if (level.allowed) {
      chips.push(`<span class="chip chip-rule">${level.allowed.length ? `${t('allowedLabel')}: ${level.allowed.join(' ')}` : t('allowedNone')}</span>`);
    }
    if (level.maxElements != null && level.maxElements > 0) chips.push(`<span class="chip chip-rule">${t('maxChip', level.maxElements)}</span>`);
    if (level.e12) chips.push(`<span class="chip chip-rule">${t('e12Chip')}</span>`);
    if (level.maxReplace) chips.push(`<span class="chip chip-rule">${t('replaceChip', level.maxReplace)}</span>`);
    return chips.length ? `<div class="rule-chips">${chips.join('')}</div>` : '';
  }

  function hintsHtml() {
    if (!level?.hints?.length) return '';
    const shown = level.hints.slice(0, revealedHints)
      .map((h) => `<div class="hint">${tr(h)}</div>`).join('');
    const more = revealedHints < level.hints.length;
    const btn = `<button class="btn btn-ghost btn-hint" ${more ? '' : 'disabled'}>${
      more ? t('hintBtn', revealedHints + 1, level.hints.length) : t('hintsDone')}</button>`;
    return `<div class="hints">${shown}${btn}</div>`;
  }

  function want(c) {
    const f = (x) => formatValue(x, c.unit);
    if (!c.want) return '';
    if (c.want.min != null && c.want.max != null) return t('wantBetween', f(c.want.min), f(c.want.max));
    if (c.want.max != null) return t('wantMax', f(c.want.max));
    if (c.want.min != null) return t('wantMin', f(c.want.min));
    return '';
  }

  function checksHtml(checks) {
    if (!checks?.length) return '';
    return `<div class="checks"><div class="checks-label">${t('checksLabel')}</div>${checks.map((c) => `
      <div class="check ${c.ok ? 'ok' : 'bad'}">
        <span class="check-mark">${c.ok ? '✓' : '✗'}</span>
        <span class="check-name">${tr(c.label)}</span>
        <span class="check-got">${c.got == null ? '—' : typeof c.got === 'number' ? formatValue(c.got, c.unit) : c.got}</span>
        <span class="check-want">${want(c)}</span>
      </div>`).join('')}</div>`;
  }

  function resultHtml() {
    if (!result) return '';
    if (result.pass) {
      const last = levelIndex >= total - 1;
      return `<div class="banner banner-pass">
        <div>${result.msg}</div>
        ${checksHtml(result.checks)}
        ${last ? '' : `<button class="btn btn-primary btn-next">${t('nextLevel')}</button>`}
      </div>`;
    }
    return `<div class="banner banner-fail"><div>${result.msg}</div>${checksHtml(result.checks)}</div>`;
  }

  function render() {
    if (!level) {
      container.innerHTML = `
        <div class="lesson">
          <div class="lesson-eyebrow">${t('sandboxTitle')}</div>
          <div class="lesson-text">${t('sandboxText')}</div>
        </div>`;
      return;
    }
    container.innerHTML = `
      <div class="lesson">
        <div class="lesson-eyebrow">${t('levelBadge', levelIndex + 1)} / ${total}
          ${completed ? `<span class="done-mark" title="${t('completedBadge')}">✓</span>` : ''}</div>
        <h2 class="lesson-title">${tr(level.title)}</h2>
        <div class="lesson-text">${tr(level.text)}</div>
        <div class="goal"><span class="goal-label">${t('goalLabel')}</span> ${tr(level.goal)}</div>
        ${constraintChips()}
        ${hintsHtml()}
        ${resultHtml()}
      </div>`;

    container.querySelector('.btn-hint')?.addEventListener('click', () => { revealedHints++; render(); });
    container.querySelector('.btn-next')?.addEventListener('click', () => onNext?.());
  }

  return {
    showLevel(lv, index, count, isCompleted) {
      level = lv; levelIndex = index; total = count; completed = isCompleted;
      revealedHints = 0; result = null;
      render();
    },
    showSandbox() { level = null; result = null; render(); },
    setResult(r) { result = r; if (r?.pass) completed = true; render(); },
    refresh: render,
  };
}

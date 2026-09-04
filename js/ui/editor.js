// The netlist editor: the level's board (fixture) shown locked and greyed
// above, the user's lines in a monospace <textarea> below, and a positioned
// error squiggle (caret under the offending token, from the parser's
// {pos, len}). Same construction as EDU-SQL's editor — no contenteditable,
// no dependency.

import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function createEditor(container, { onChange, onRun } = {}) {
  container.innerHTML = `
    <div class="nl-editor">
      <div class="nl-fixture" hidden>
        <div class="nl-sub"><span data-i18n="fixtureLabel"></span></div>
        <pre class="nl-fixture-text"></pre>
      </div>
      <div class="nl-sub nl-user-label"><span data-i18n="userLabel"></span></div>
      <div class="nl-field">
        <textarea class="nl-input" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" aria-label="netlist" rows="6"></textarea>
      </div>
      <div class="nl-squiggle" hidden><pre class="nl-echo"></pre><div class="nl-errmsg"></div></div>
    </div>`;

  const fixtureBox = container.querySelector('.nl-fixture');
  const fixtureText = container.querySelector('.nl-fixture-text');
  const userLabel = container.querySelector('.nl-user-label');
  const input = container.querySelector('.nl-input');
  const squiggle = container.querySelector('.nl-squiggle');
  const echo = container.querySelector('.nl-echo');
  const errmsg = container.querySelector('.nl-errmsg');
  let muted = false;

  input.addEventListener('input', () => { if (!muted) onChange?.(input.value); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onRun?.(); }
  });

  function setError(err) {
    if (!err) { squiggle.hidden = true; input.classList.remove('has-error'); return; }
    squiggle.hidden = false;
    input.classList.add('has-error');
    const src = err.inFixture ? fixtureText.textContent : input.value;
    const pos = Math.min(err.pos ?? 0, src.length);
    const len = Math.max(1, err.len ?? 1);
    const before = src.slice(0, pos);
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineEnd = src.indexOf('\n', pos) === -1 ? src.length : src.indexOf('\n', pos);
    const line = src.slice(lineStart, lineEnd);
    const caret = `${' '.repeat(pos - lineStart)}${'^'.repeat(len)}`;
    echo.textContent = `${line}\n${caret}`;
    errmsg.innerHTML = err.msg ?? '';
  }

  return {
    setFixture(text) {
      const has = !!(text && text.trim());
      fixtureBox.hidden = !has;
      userLabel.hidden = !has;
      fixtureText.innerHTML = has ? esc(text) : '';
      fixtureBox.querySelector('[data-i18n]').textContent = t('fixtureLabel');
      userLabel.querySelector('[data-i18n]').textContent = t('userLabel');
    },
    getUser: () => input.value,
    setUser(v) { muted = true; input.value = v; muted = false; setError(null); },
    setError,
    focus() { input.focus(); },
    refresh() {
      fixtureBox.querySelector('[data-i18n]').textContent = t('fixtureLabel');
      userLabel.querySelector('[data-i18n]').textContent = t('userLabel');
    },
  };
}

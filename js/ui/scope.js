// The oscilloscope: a two-channel canvas trace of the `.scope` nodes over the
// transient, drawn from the engine's recorded samples up to the current time
// — so the trace advances with the Player and freezes on pause. Vertical
// scale is fixed for the whole run (chosen from a headless preview) exactly
// like you would set volts/div before pressing the trigger.

import { t } from '../i18n.js';
import { formatValue } from '../core/units.js';

const NICE = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const COLORS = ['#57e389', '#e3b341'];

function niceStep(x) {
  for (const n of NICE) if (n >= x) return n;
  return 100;
}

export function createScope(container, { onAddScope, onAddTran } = {}) {
  let channels = [];     // [{node, ni}]
  let stop = 0;          // s
  let vdiv = 1;
  let canvas = null;
  let msg = null;
  let lastDrawn = -1;
  let suggest = null;   // node to offer when there is no channel

  function ensureCanvas() {
    if (canvas) return;
    container.innerHTML = '<canvas class="scope-canvas"></canvas><div class="scope-msg" hidden></div><div class="scope-legend"></div>';
    canvas = container.querySelector('canvas');
    msg = container.querySelector('.scope-msg');
    msg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'scope') onAddScope?.(suggest);
      if (b.dataset.act === 'tran') onAddTran?.();
    });
  }

  function size() {
    const w = container.clientWidth || 600;
    const h = 220;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    }
    return { w, h, dpr };
  }

  function grid(ctx, w, h) {
    ctx.fillStyle = '#07130c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(87,227,137,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const x = (i / 10) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let j = 0; j <= 8; j++) { const y = (j / 8) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(87,227,137,0.4)';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
  }

  // the empty states explain WHY and offer the one-click way out
  function message() {
    if (channels.length && stop) return '';
    if (!channels.length) {
      const btn = suggest ? `<button class="btn btn-ghost scope-add" data-act="scope">${t('scopeTry', suggest === '0' ? 'gnd' : suggest)}</button>` : '';
      return `<div>${t('scopeEmpty')}</div>${btn}`;
    }
    return `<div>${t('scopeNoTran')}</div><button class="btn btn-ghost scope-add" data-act="tran">${t('scopeAddTran')}</button>`;
  }

  function legend() {
    const lg = container.querySelector('.scope-legend');
    if (!lg) return;
    lg.innerHTML = channels.map((c, i) => `<span class="scope-ch" style="color:${COLORS[i]}">CH${i + 1} ${c.node === '0' ? 'gnd' : c.node} · ${t('scopeDiv', formatValue(vdiv, 'V'))}</span>`).join('')
      + (stop ? `<span class="scope-ch scope-time">${t('scopeDiv', formatValue(stop / 10, 's'))}</span>` : '');
  }

  function draw(samples, tNow) {
    if (!canvas || !channels.length) return;
    const { w, h, dpr } = size();
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid(ctx, w, h);
    if (!samples?.length) return;
    const yOf = (v) => h / 2 - (v / (vdiv * 8)) * h;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    channels.forEach((c, k) => {
      ctx.strokeStyle = COLORS[k];
      ctx.shadowColor = COLORS[k]; ctx.shadowBlur = 4;
      ctx.beginPath();
      let started = false;
      if (!stop) {
        // DC: a flat line at the operating point
        const v = c.ni < 0 ? 0 : samples[samples.length - 1].v[c.ni];
        ctx.moveTo(0, yOf(v)); ctx.lineTo(w, yOf(v));
      } else {
        for (const s of samples) {
          if (s.t > tNow + 1e-12) break;
          const x = (s.t / stop) * w;
          const v = c.ni < 0 ? 0 : s.v[c.ni];
          if (!started) { ctx.moveTo(x, yOf(v)); started = true; } else ctx.lineTo(x, yOf(v));
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
    lastDrawn = tNow;
  }

  return {
    // channels: [{node, ni}], stop (s or 0 for DC), range: max |v| expected
    setup({ channels: ch = [], stop: st = 0, range = 1, suggest: sg = null } = {}) {
      ensureCanvas();
      channels = ch.slice(0, 2); stop = st; suggest = sg;
      vdiv = niceStep(Math.max(1e-3, range) / 3.6);
      msg.hidden = channels.length > 0 && stop > 0;
      msg.innerHTML = message();
      legend();
      draw([], 0);
    },
    draw,
    clear() { ensureCanvas(); channels = []; stop = 0; suggest = null; msg.hidden = false; msg.innerHTML = message(); legend(); draw([], 0); },
    refresh() { if (canvas) { legend(); msg.innerHTML = message(); } },
  };
}

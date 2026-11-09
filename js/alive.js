/* alive.js - subtle micro-motion layer. Vanilla, no deps. Attributes: data-alive="...". */
(() => {
  'use strict';
  const D = document, H = D.documentElement, W = window;
  if (!W.IntersectionObserver || !W.requestAnimationFrame || W.Alive) return;
  const Q = (s, r = D) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mq = W.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = W.matchMedia('(pointer: coarse)');
  const P = { x: 0, y: 0, in: false, hot: false }; // fine pointer, viewport px
  const O = { x: 0, y: 0, on: false };             // device tilt, -.5..5
  const seen = new WeakSet(), acts = [], swaps = {}, ex = [];
  let needScroll = false, paused = false, reduced = mq.matches, raf = 0, last = 0, dirty = true;
  try { paused = sessionStorage.getItem('alive-paused') === '1'; } catch (e) { /* storage blocked */ }
  const run = () => !reduced && !paused;

  const make = (cls, parent) => {
    const e = D.createElement('i');
    e.className = cls; e.setAttribute('aria-hidden', 'true');
    if (parent) parent.appendChild(e);
    return e;
  };
  // eased approach: returns the new value, k is frame-rate independent
  const ease = (a, b, dt, tau) => a + (b - a) * (1 - Math.exp(-dt / tau));
  const near = (a, b, e) => Math.abs(a - b) < e;
  // pointer (or tilt, or scroll position on touch) as -.5..5 inside rect r; null = no drive
  const drive = (r, inside) => {
    if (!coarse.matches) {
      if (!P.in) return null;
      const x = (P.x - r.left) / r.width - .5, y = (P.y - r.top) / r.height - .5;
      return inside && (Math.abs(x) > .5 || Math.abs(y) > .5) ? null : [x, y];
    }
    return O.on ? [O.x, O.y] : [0, (r.top + r.height / 2) / W.innerHeight - .5];
  };

  // 0..1: how far (x,y) is from every [data-alive-part]/[data-alive-calm] zone; 0 inside, 1 beyond its radius
  const clear = (x, y, h) => {
    let f = 1;
    for (const z of ex) {
      if (z.h && !h) continue;
      const r = z.r, d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      f = Math.min(f, clamp(d / z.R, 0, 1));
    }
    return f * f * (3 - 2 * f);
  };

  const F = {
    backdrop(el) {
      const L = Q('[data-depth]', el), m = L.length ? L : [el.firstElementChild];
      const li = make('alive-light', el);
      let x = 0, y = 0, lx = 0, ly = 0, la = 0, still = false;
      return {
        tick(dt, r) {
          if (coarse.matches) { // touch: nothing follows the finger or the scroll; the glow sits still
            if (!still) { still = true; li.style.transform = `translate3d(${(r.width / 2).toFixed(1)}px,${(r.height / 2).toFixed(1)}px,0)`; li.style.opacity = '.14'; }
            return false;
          }
          still = false;
          const d = coarse.matches ? drive(r) : P.in ? [P.x / W.innerWidth - .5, P.y / W.innerHeight - .5] : null;
          const inside = P.in && !coarse.matches && P.x > r.left && P.x < r.right && P.y > r.top && P.y < r.bottom;
          const gx = coarse.matches ? r.width * (.5 + (d ? d[0] : 0)) : P.x - r.left, gy = coarse.matches ? r.height * (.5 + (d ? d[1] : 0)) : P.y - r.top;
          const k = clear(r.left + gx, r.top + gy);
          const tx = d ? d[0] * k : 0, ty = d ? d[1] * k : 0;
          const ta = (coarse.matches ? .5 : inside ? 1 : 0) * k;
          x = ease(x, tx, dt, .7); y = ease(y, ty, dt, .7);
          lx = ease(lx, gx, dt, .55); ly = ease(ly, gy, dt, .55); la = ease(la, ta, dt, .6);
          m.forEach(e => { const n = +e.dataset.depth || 1; e.style.translate = `${(-x * 15 * n).toFixed(2)}px ${(-y * 9 * n).toFixed(2)}px`; });
          li.style.transform = `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0)`;
          li.style.opacity = la.toFixed(3);
          return !(near(x, tx, .002) && near(y, ty, .002) && near(la, ta, .01) && near(lx, gx, .5) && near(ly, gy, .5));
        },
        reset() { m.forEach(e => (e.style.translate = '')); li.style.cssText = ''; x = y = lx = ly = la = 0; still = false; }
      };
    },
    magnetic(el) {
      let x = 0, y = 0;
      return {
        tick(dt, r) {
          let tx = 0, ty = 0, n = false;
          if (P.in && !coarse.matches) {
            const dx = P.x - (r.left + r.width / 2), dy = P.y - (r.top + r.height / 2);
            n = Math.abs(dx) < r.width / 2 + 36 && Math.abs(dy) < r.height / 2 + 36;
            if (n) { const k = clear(P.x, P.y); tx = clamp(dx * .15, -4, 4) * k; ty = clamp(dy * .15, -3.5, 3.5) * k; }
          }
          el.classList.toggle('alive-near', n);
          x = ease(x, tx, dt, .18); y = ease(y, ty, dt, .18);
          el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
          return !(near(x, tx, .02) && near(y, ty, .02));
        },
        reset() { el.style.translate = ''; el.classList.remove('alive-near'); x = y = 0; }
      };
    },
    tilt(el) {
      const sh = make('alive-sheen', el), sp = make('', sh);
      let rx = 0, ry = 0, a = 0, sx = 0, sy = 0;
      return {
        tick(dt, r) {
          const d = drive(r, true), k = coarse.matches ? .4 : 1, k0 = 1;
          const tx = d ? (d[0] + .5) * r.width : sx, ty = d ? (d[1] + .5) * r.height : sy;
          const c = clear(r.left + tx, r.top + ty) * k0;
          const trx = d ? -d[1] * 5.5 * k * c : 0, try_ = d ? d[0] * 5.5 * k * c : 0, ta = d ? (coarse.matches ? .5 : 1) * c : 0;
          rx = ease(rx, trx, dt, .28); ry = ease(ry, try_, dt, .28); a = ease(a, ta, dt, .4);
          sx = ease(sx, tx, dt, .2); sy = ease(sy, ty, dt, .2);
          el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
          sp.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
          sp.style.opacity = a.toFixed(3);
          return !(near(rx, trx, .01) && near(ry, try_, .01) && near(a, ta, .01) && near(sx, tx, .5) && near(sy, ty, .5));
        },
        reset() { el.style.transform = ''; sp.style.cssText = ''; rx = ry = a = 0; }
      };
    },
    halo(el) {
      const h = make('alive-halo', D.body);
      let x = 0, y = 0, a = 0, s = 1;
      return {
        tick(dt) {
          const r = this.r, inside = P.in && !coarse.matches && r && P.x > r.left && P.x < r.right && P.y > r.top && P.y < r.bottom;
          const ta = inside ? clear(P.x, P.y, 1) : 0, ts = inside && P.hot ? 1.7 : 1;
          if (inside && a < .05) { x = P.x; y = P.y; }
          x = ease(x, P.x, dt, .14); y = ease(y, P.y, dt, .14); a = ease(a, ta, dt, .3); s = ease(s, ts, dt, .22);
          h.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
          h.style.opacity = a.toFixed(3);
          return !(near(a, ta, .01) && near(x, P.x, .3) && near(y, P.y, .3) && near(s, ts, .01));
        },
        reset() { h.style.cssText = ''; a = 0; }
      };
    },
    depth(el) {
      needScroll = true;
      const L = Q('[data-depth]', el), cur = L.map(() => 0);
      return {
        tick(dt, r) {
          const off = r.top + r.height / 2 - W.innerHeight / 2;
          let busy = false;
          L.forEach((e, i) => {
            const t = clamp(-off * .04 * (+e.dataset.depth || 1), -60, 60);
            cur[i] = ease(cur[i], t, dt, .22);
            if (!near(cur[i], t, .05)) busy = true;
            e.style.translate = `0 ${cur[i].toFixed(2)}px`;
          });
          return busy;
        },
        reset() { L.forEach((e, i) => { e.style.translate = ''; cur[i] = 0; }); }
      };
    },
    card(el) { // shop card: still layer shows through. Pointer devices: CSS hover. Touch: scroll position.
      needScroll = true;
      const s = el.querySelector('[data-alive-still]');
      let o = 0;
      return !s ? null : {
        tick(dt, r) {
          if (!coarse.matches) return false;
          const t = (1 - clamp(Math.abs((r.top + r.height / 2) / W.innerHeight - .5) * 2.6, 0, 1)) * .55;
          o = ease(o, t, dt, .25); s.style.opacity = o.toFixed(3);
          return !near(o, t, .005);
        },
        reset() { s.style.opacity = ''; o = 0; }
      };
    },
    swap(el) { // crossfade between [data-variant] layers; one video plays at a time
      const V = Q('[data-variant]', el);
      let cur = -1, vis = false;
      const vid = v => v.querySelector('video');
      const sync = () => V.forEach((v, i) => {
        const m = vid(v); if (!m) return;
        if (i === cur && vis && run()) {
          if (!m.src && m.dataset.src) { m.src = m.dataset.src; m.muted = true; m.addEventListener('playing', () => v.classList.add('alive-ready'), { once: true }); }
          const p = m.play(); if (p && p.catch) p.catch(() => {});
        } else m.pause();
      });
      const o = new IntersectionObserver(e => { vis = e[e.length - 1].isIntersecting; sync(); }, { rootMargin: '120px' });
      o.observe(el);
      const api = {
        sync,
        show(id) {
          const i = V.findIndex(v => v.dataset.variant === id);
          if (i < 0 || i === cur) return;
          cur = i; V.forEach((v, j) => v.classList.toggle('alive-show', j === i)); sync();
        }
      };
      if (el.id) swaps[el.id] = api;
      api.show((V[0] || { dataset: {} }).dataset.variant);
      el._swap = api;
      return { swap: api, tick: () => false, reset: sync };
    }
  };

  const io = new IntersectionObserver(es => es.forEach(e => {
    const a = e.target._alive; if (!a) return;
    a.vis = e.isIntersecting;
    if (a.vis) { a.r = e.target.getBoundingClientRect(); wake(); } else a.reset();
  }), { rootMargin: '80px' });

  function scan(root = D) {
    Q('[data-alive]', root).forEach(el => {
      if (seen.has(el)) return; seen.add(el);
      const parts = [];
      el.dataset.alive.split(/\s+/).forEach(t => {
        if (t === 'reveal') rio.observe(el);
        else if (F[t]) { const i = F[t](el); if (i) parts.push(i); }
      });
      if (!parts.length) return;
      el._alive = {
        vis: false, r: null,
        tick(dt, r) { this.r = r; let b = false; parts.forEach(p => { if (p.tick.call(this, dt, r)) b = true; }); return b; },
        reset() { parts.forEach(p => p.reset()); }
      };
      if (/\bhalo\b/.test(el.dataset.alive) && !el.hasAttribute('data-alive-over')) // halo stays off headings unless they opt in
        Q('h1,h2,h3', el).forEach(h => { if (!h.closest('[data-alive-over]')) ex.push({ el: h, R: 48, h: 1, r: h.getBoundingClientRect() }); });
      acts.push(el._alive); io.observe(el);
    });
    Q('[data-alive-part],[data-alive-calm]', root).forEach(el => {
      if (seen.has(el)) return; seen.add(el);
      const calm = el.hasAttribute('data-alive-calm') && !el.hasAttribute('data-alive-part');
      const R = parseFloat(el.getAttribute(calm ? 'data-alive-calm' : 'data-alive-part')) || (calm ? 80 : 180);
      ex.push({ el, R, r: el.getBoundingClientRect() }); dirty = true; wake();
    });
    Q('[data-alive-to]', root).forEach(el => {
      if (seen.has(el)) return; seen.add(el);
      const [id, v] = el.dataset.aliveTo.split(':');
      sio.observe(el); el._to = () => swaps[id] && swaps[id].show(v);
    });
    Q('[data-alive-go]', root).forEach(b => {
      if (seen.has(b)) return; seen.add(b);
      b.addEventListener('click', () => { const [id, v] = b.dataset.aliveGo.split(':'); swaps[id] && swaps[id].show(v); });
    });
  }
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('alive-in'); rio.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target._to(); }), { rootMargin: '-45% 0px -45% 0px' });

  function frame(t) {
    raf = 0; if (!run()) return;
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    if (dirty) { dirty = false; ex.forEach(z => { z.r = z.el.getBoundingClientRect(); }); Q('[data-alive]').forEach(e => { const a = e._alive; if (a && a.vis) a.r = e.getBoundingClientRect(); }); }
    let busy = false;
    for (const a of acts) if (a.vis && a.r && a.tick(dt, a.r)) busy = true;
    if (busy) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && run()) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function apply() {
    reduced = mq.matches;
    H.classList.toggle('alive-on', !reduced);
    H.classList.toggle('alive-paused', paused);
    if (!run()) { if (raf) cancelAnimationFrame(raf); raf = 0; acts.forEach(a => a.reset()); }
    else wake();
    Q('[data-alive~=swap]').forEach(e => e._swap && e._swap.sync());
    if (btn) btn.setAttribute('aria-pressed', paused);
  }
  function setPaused(p) {
    paused = !!p;
    try { sessionStorage.setItem('alive-paused', paused ? '1' : '0'); } catch (e) { /* ok */ }
    apply();
  }

  // listeners: passive, state only, no layout reads
  const pm = e => {
    if (e.pointerType === 'touch') return;
    P.x = e.clientX; P.y = e.clientY; P.in = true;
    P.hot = !!(e.target.closest && e.target.closest('a,button,[data-alive-grow]'));
    wake();
  };
  D.addEventListener('pointermove', pm, { passive: true });
  H.addEventListener('mouseleave', () => { P.in = false; wake(); });
  W.addEventListener('blur', () => { P.in = false; wake(); });
  W.addEventListener('scroll', () => { if (coarse.matches && !needScroll) return; dirty = true; wake(); }, { passive: true }); // touch: only features that follow scroll need it
  W.addEventListener('resize', () => { dirty = true; wake(); }, { passive: true });
  mq.addEventListener('change', apply);

  const ori = e => {
    if (e.gamma == null) return;
    O.on = true; O.x = clamp(e.gamma / 60, -.5, .5); O.y = clamp((e.beta - 45) / 60, -.5, .5); wake();
  };
  const listenOri = () => W.addEventListener('deviceorientation', ori, { passive: true });
  const DOE = W.DeviceOrientationEvent;
  if (DOE && coarse.matches && typeof DOE.requestPermission !== 'function') listenOri(); // iOS: only via the button below

  let btn = D.querySelector('[data-alive-pause]');
  const start = () => {
    if (!btn && D.querySelector('[data-alive]') && H.dataset.alivePause !== 'none') {
      btn = D.createElement('button'); btn.type = 'button'; btn.className = 'alive-pause'; btn.dataset.auto = '';
      btn.textContent = 'Pause motion'; D.body.appendChild(btn);
    }
    if (btn) btn.addEventListener('click', () => setPaused(btn.getAttribute('aria-pressed') !== 'true'));
    Q('[data-alive-motion-permission]').forEach(b => b.addEventListener('click', () => {
      if (DOE && typeof DOE.requestPermission === 'function') DOE.requestPermission().then(s => s === 'granted' && listenOri()).catch(() => {});
    }));
    scan(); apply();
  };
  W.Alive = { scan, pause: setPaused, swap: (id, v) => swaps[id] && swaps[id].show(v) };
  D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', start) : start();
})();

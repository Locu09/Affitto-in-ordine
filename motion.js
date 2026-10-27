(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.documentElement.classList.add('fx-ready');

  /* ---------- Intestazione reattiva allo scroll ---------- */
  const siteHead = $('.site-head');
  let headerFrame = 0;
  function updateHeader() {
    headerFrame = 0;
    if (!siteHead) return;
    siteHead.classList.toggle('is-scrolled', window.scrollY > 36);
  }
  window.addEventListener('scroll', () => {
    if (headerFrame) return;
    headerFrame = requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  /* ---------- Luce che segue il puntatore sulle superfici ---------- */
  const cardSelectors = [
    '.stage',
    '.pain-card',
    '.bento-card',
    '.step-card',
    '.price-card',
    '.price-side-card',
    '.access-form',
    '.legal-toc',
    '.kpi',
    '.property-card',
    '.card'
  ].join(',');

  const cards = $$(cardSelectors);
  cards.forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    if (getComputedStyle(card).position === 'static') card.classList.add('fx-relative');
    card.classList.add('fx-card');
    if (!card.querySelector(':scope > .fx-sheen')) {
      const sheen = document.createElement('span');
      sheen.className = 'fx-sheen';
      sheen.setAttribute('aria-hidden', 'true');
      card.prepend(sheen);
    }
  });

  if (finePointer.matches && !reduceMotion.matches) {
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--fx-x', `${Math.round(event.clientX - rect.left)}px`);
        card.style.setProperty('--fx-y', `${Math.round(event.clientY - rect.top)}px`);
      }, { passive: true });
    });
  }

  /* ---------- Inclinazione 3D delle superfici ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    const tiltSelector = [
      '.stage',
      '.pain-card',
      '.bento-card',
      '.step-card',
      '.price-card',
      '.price-side-card',
      '.fit-card',
      '.kpi',
      '.property-card',
      '.card',
      '.legal-toc'
    ].join(',');

    const canTilt = (host) => {
      if (host.matches('.stage, .legal-toc')) return true;
      if (host.closest('.notice-layer, .modal, .theme-panel')) return false;
      if (host.matches('.access-form, .table-card')) return false;
      if (host.querySelector('input, select, textarea, .payments-table')) return false;
      return true;
    };

    $$(tiltSelector).forEach((host) => {
      if (!(host instanceof HTMLElement) || !canTilt(host)) return;

      const isStage = host.matches('.stage');
      const isStrong = host.matches('.pain-card, .bento-card, .step-card, .price-card, .price-side-card, .fit-card');
      const maxX = isStage ? 3.4 : isStrong ? 2.8 : 1.8;
      const maxY = isStage ? 4.6 : isStrong ? 4 : 2.6;
      let frame = 0;
      let lastEvent = null;

      if (!isStage) host.classList.add('fx-tilt-3d');

      function applyTilt() {
        frame = 0;
        if (!lastEvent) return;
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = Math.max(0, Math.min(1, (lastEvent.clientX - rect.left) / rect.width)) - 0.5;
        const py = Math.max(0, Math.min(1, (lastEvent.clientY - rect.top) / rect.height)) - 0.5;
        host.style.setProperty('--fx-3d-rx', `${(-py * maxX).toFixed(2)}deg`);
        host.style.setProperty('--fx-3d-ry', `${(px * maxY).toFixed(2)}deg`);
      }

      function resetTilt() {
        lastEvent = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        host.style.setProperty('--fx-3d-rx', '0deg');
        host.style.setProperty('--fx-3d-ry', '0deg');
      }

      host.addEventListener('pointermove', (event) => {
        lastEvent = event;
        if (frame) return;
        frame = requestAnimationFrame(applyTilt);
      }, { passive: true });
      host.addEventListener('pointerleave', resetTilt, { passive: true });
      host.addEventListener('pointercancel', resetTilt, { passive: true });
    });
  }

  /* ---------- Ripple sui controlli ---------- */
  if (!reduceMotion.matches) {
    document.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const host = event.target.closest('button, .btn');
      if (!host || host.disabled || host.getAttribute('aria-disabled') === 'true') return;
      if (!(host instanceof HTMLElement)) return;

      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.35;
      const ripple = document.createElement('span');
      ripple.className = 'fx-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.setProperty('--fx-size', `${size}px`);
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      host.classList.add('fx-ripple-host');
      host.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    }, { passive: true });
  }

  /* ---------- Scintille su azioni della demo ---------- */
  const sparkTriggers = '[data-pay-id], [data-cell-id], #exportPayments, #copyReminder';
  let sparkLayer = null;

  function ensureSparkLayer() {
    if (sparkLayer && sparkLayer.isConnected) return sparkLayer;
    sparkLayer = document.createElement('div');
    sparkLayer.className = 'fx-spark-layer';
    sparkLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sparkLayer);
    return sparkLayer;
  }

  function spawnSparks(x, y) {
    if (reduceMotion.matches) return;
    const layer = ensureSparkLayer();
    const colors = ['var(--lime)', 'var(--coral)', 'var(--violet)', 'var(--amber)'];
    for (let i = 0; i < 12; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'fx-spark';
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.35;
      const distance = 34 + Math.random() * 62;
      bit.style.setProperty('--fx-sx', `${x}px`);
      bit.style.setProperty('--fx-sy', `${y}px`);
      bit.style.setProperty('--fx-dx', `${Math.cos(angle) * distance}px`);
      bit.style.setProperty('--fx-dy', `${Math.sin(angle) * distance - 18}px`);
      bit.style.setProperty('--fx-rot', `${Math.round((Math.random() - 0.5) * 420)}deg`);
      bit.style.setProperty('--fx-color', colors[i % colors.length]);
      layer.appendChild(bit);
      window.setTimeout(() => bit.remove(), 900);
    }
  }

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const trigger = event.target.closest(sparkTriggers);
    if (!trigger) return;
    spawnSparks(event.clientX, event.clientY);
  }, { passive: true });

  /* ---------- Micro-parallasse desktop ---------- */
  if (finePointer.matches && !reduceMotion.matches && window.innerWidth > 900) {
    const parallaxItems = [
      ...$$('.hero-gridlines').map((el) => ({ el, speed: 0.035 })),
      ...$$('.pain-num').map((el) => ({ el, speed: 0.025 }))
    ];
    let parallaxFrame = 0;

    function updateParallax() {
      parallaxFrame = 0;
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      parallaxItems.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        const center = window.scrollY + rect.top + rect.height / 2;
        const shift = Math.max(-24, Math.min(24, (viewportCenter - center) * speed));
        el.style.setProperty('--fx-parallax', `${shift.toFixed(1)}px`);
      });
    }

    window.addEventListener('scroll', () => {
      if (parallaxFrame) return;
      parallaxFrame = requestAnimationFrame(updateParallax);
    }, { passive: true });
    updateParallax();
  }

  /* ---------- Cambio tema con piccolo lampo ---------- */
  if (!reduceMotion.matches) {
    let themeTimer = 0;
    const observer = new MutationObserver(() => {
      document.documentElement.classList.remove('fx-theme-flash');
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add('fx-theme-flash');
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(() => {
        document.documentElement.classList.remove('fx-theme-flash');
      }, 420);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode', 'data-palette'] });
  }
})();

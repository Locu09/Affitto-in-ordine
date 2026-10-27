/* Affitto in Ordine — vita del sito: transizioni, ambiente, cursore, reveal e micro-feedback.
   Nessun dato esce dal browser. Tutto si spegne con prefers-reduced-motion. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (selector, scope = doc) => scope.querySelector(selector);
  const $$ = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const isLanding = !!$('.hero');
  const isDemo = body.classList.contains('demo-page');
  const isLegal = body.classList.contains('legal-page');
  const NAV_FLAG = 'aio-motion-nav';
  const palette = ['var(--lime)', 'var(--violet)', 'var(--coral)', 'var(--mint)', 'var(--amber)'];

  root.classList.add('fx-alive');

  if (reduceMotion.matches) return;

  /* ------------------------------------------------------------------ */
  /* Arrivo pagina: sipario cinematografico, saltabile con click o tasto */
  /* ------------------------------------------------------------------ */

  function initArrival() {
    let arrivedByTransition = false;
    try {
      arrivedByTransition = sessionStorage.getItem(NAV_FLAG) === '1';
      sessionStorage.removeItem(NAV_FLAG);
    } catch (_) { /* storage non disponibile: nessun problema */ }

    if (!isLanding && !isLegal) return;
    if (document.querySelector('.notice-layer')) return;
    if (window.innerWidth < 721) return;
    if (navigator.connection && navigator.connection.saveData) return;

    if (arrivedByTransition) return;

    const veil = doc.createElement('div');
    veil.className = 'fx-veil';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = `
      <div class="fx-veil-top">
        <span>Affitto in ordine</span>
        <span>Prototipo in validazione</span>
      </div>
      <div class="fx-veil-word">
        <span class="fx-veil-row"><span>Affitto</span></span>
        <span class="fx-veil-row"><span>in ordine</span></span>
      </div>
      <p class="fx-veil-caption">
        <span>Date fuori dalla testa.</span>
        <small>Scadenze · incassi · ISTAT</small>
      </p>
      <div class="fx-veil-bottom">
        <span class="fx-veil-hint">Clicca o premi un tasto per entrare</span>
        <span class="fx-veil-bar" aria-hidden="true"><i></i></span>
      </div>`;
    body.appendChild(veil);

    let closed = false;

    const onKeydown = (event) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
      dismiss(false);
    };

    const dismiss = (instant) => {
      if (closed) return;
      closed = true;
      doc.removeEventListener('keydown', onKeydown);
      veil.classList.add('is-leaving');
      veil.style.pointerEvents = 'none';
      window.setTimeout(() => veil.remove(), instant ? 0 : 480);
    };

    veil.addEventListener('pointerdown', () => dismiss(false), { passive: true });
    doc.addEventListener('keydown', onKeydown);
    window.setTimeout(() => dismiss(true), 2820);
  }

  /* ------------------------------------------------------------------ */
  /* Forme ambientali e grana                                            */
  /* ------------------------------------------------------------------ */

  function initAmbient() {
    const hosts = $$('.hero, .problem, .how, .features, .fit-band, .showcase, .pricing, .faq-section, .access, .legal-hero');
    if (!hosts.length) return;

    const variants = [
      { type: 'ring', x: '87%', y: '14%', size: 116, opacity: 0.17, color: 'var(--violet)', rotate: '-12deg' },
      { type: 'plus', x: '5%', y: '70%', size: 54, opacity: 0.2, color: 'var(--coral)', rotate: '8deg' },
      { type: 'dots', x: '78%', y: '76%', size: 104, opacity: 0.14, color: 'var(--violet)', rotate: '0deg' },
      { type: 'star', x: '7%', y: '16%', size: 68, opacity: 0.18, color: 'var(--amber)', rotate: '-9deg' },
      { type: 'blob', x: '82%', y: '55%', size: 178, opacity: 0.13, color: 'var(--lime)', rotate: '0deg' },
      { type: 'squiggle', x: '14%', y: '84%', size: 84, opacity: 0.16, color: 'var(--mint)', rotate: '-7deg' }
    ];

    const shapes = [];

    hosts.forEach((host, hostIndex) => {
      host.classList.add('fx-ambient-host');
      const first = variants[hostIndex % variants.length];
      const second = variants[(hostIndex + 2) % variants.length];

      [first, second].forEach((spec, shapeIndex) => {
        if (shapeIndex === 1 && host.matches('.hero, .legal-hero')) return;
        const shape = doc.createElement('span');
        shape.className = `fx-ambient-shape fx-ambient-shape--${spec.type}`;
        shape.setAttribute('aria-hidden', 'true');
        const horizontal = parseFloat(spec.x);
        if (horizontal > 50) shape.style.right = `${100 - horizontal}%`;
        else shape.style.left = spec.x;
        shape.style.top = spec.y;
        shape.style.setProperty('--fx-size', `${spec.size}px`);
        shape.style.setProperty('--fx-shape-opacity', spec.opacity);
        shape.style.setProperty('--fx-shape-color', spec.color);
        shape.style.setProperty('--fx-rotate', spec.rotate);
        shape.style.setProperty('--fx-duration', `${random(11, 19).toFixed(1)}s`);
        shape.style.setProperty('--fx-delay', `${random(-6, 0).toFixed(1)}s`);
        shape._host = host;
        shape._depth = random(0.35, 0.9);
        host.appendChild(shape);
        shapes.push(shape);
      });
    });

    let pointerX = 0;
    let pointerY = 0;
    let layoutReady = false;

    function measure() {
      shapes.forEach((shape) => {
        shape._hostTop = shape._host.offsetTop;
        shape._selfTop = shape.offsetTop;
        shape._height = shape.offsetHeight || 1;
      });
      layoutReady = true;
    }

    function paint() {
      if (!layoutReady) return;
      const viewCenter = window.scrollY + window.innerHeight / 2;
      shapes.forEach((shape) => {
        const shapeCenter = shape._hostTop + shape._selfTop + shape._height / 2;
        const scrollLift = clamp((viewCenter - shapeCenter) * 0.045, -28, 28);
        const lift = scrollLift + pointerY * 9 * shape._depth;
        const side = pointerX * 12 * shape._depth;
        shape.style.setProperty('--fx-parallax', `${lift.toFixed(2)}px`);
        shape.style.setProperty('--fx-px', `${side.toFixed(2)}px`);
      });
    }

    let frame = 0;
    function schedule() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        paint();
      });
    }

    window.requestAnimationFrame(measure);
    window.addEventListener('resize', () => {
      layoutReady = false;
      window.requestAnimationFrame(measure);
      schedule();
    }, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pointermove', (event) => {
      if (!finePointer.matches) return;
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
      schedule();
    }, { passive: true });

    const grain = doc.createElement('div');
    grain.className = 'fx-grain';
    grain.setAttribute('aria-hidden', 'true');
    body.appendChild(grain);
  }

  /* ------------------------------------------------------------------ */
  /* Cursore custom: freccia, anello e scia leggera                      */
  /* ------------------------------------------------------------------ */

  function initCursor() {
    if ((!isLanding && !isDemo) || !finePointer.matches || window.innerWidth < 901) return;

    const ring = doc.createElement('div');
    ring.className = 'fx-cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    const dot = doc.createElement('div');
    dot.className = 'fx-cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    const pointer = doc.createElement('div');
    pointer.className = 'fx-cursor-pointer';
    pointer.setAttribute('aria-hidden', 'true');
    pointer.innerHTML = `
      <svg viewBox="0 0 22 28" aria-hidden="true" focusable="false">
        <path d="M1 1 19.5 11.5 11.6 13.4 7.1 26 1 1Z"></path>
      </svg>`;
    body.append(ring, dot, pointer);
    root.classList.add('fx-custom-cursor');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let shown = false;
    let overText = false;
    let lastTrail = 0;

    const cursorParts = [ring, dot, pointer];

    function setShown(value) {
      shown = value;
      cursorParts.forEach((part) => part.classList.toggle('is-on', value));
    }

    function setTextMode(value) {
      overText = value;
      cursorParts.forEach((part) => part.classList.toggle('is-text', value));
    }

    function syncTarget(target) {
      if (!(target instanceof Element)) return;
      setTextMode(!!target.closest('input, textarea, select, [contenteditable="true"]'));
      const interactive = !overText && !!target.closest('a, button, summary, label, [role="button"], [data-tilt], [data-3d-drag]');
      ring.classList.toggle('is-link', interactive);
      pointer.classList.toggle('is-link', interactive);
    }

    function dropTrail(x, y) {
      const particle = doc.createElement('span');
      particle.className = 'fx-cursor-tail';
      particle.setAttribute('aria-hidden', 'true');
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--fx-tail-x', `${random(-18, 18).toFixed(1)}px`);
      particle.style.setProperty('--fx-tail-y', `${random(-20, 10).toFixed(1)}px`);
      particle.style.setProperty('--fx-tail-color', palette[Math.floor(Math.random() * palette.length)]);
      body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 600);
    }

    function loop() {
      ringX += (targetX - ringX) * 0.2;
      ringY += (targetY - ringY) * 0.2;
      ring.style.left = `${ringX.toFixed(1)}px`;
      ring.style.top = `${ringY.toFixed(1)}px`;
      window.requestAnimationFrame(loop);
    }

    doc.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;
      pointer.style.left = `${targetX}px`;
      pointer.style.top = `${targetY}px`;
      syncTarget(event.target);
      if (!shown) setShown(true);
      if (overText) return;
      const now = performance.now();
      if (now - lastTrail > 70) {
        lastTrail = now;
        dropTrail(targetX, targetY);
      }
    }, { passive: true });

    doc.addEventListener('pointerover', (event) => {
      syncTarget(event.target);
    }, { passive: true });

    doc.addEventListener('pointerdown', () => {
      ring.classList.add('is-down');
      pointer.classList.add('is-down');
    }, { passive: true });
    doc.addEventListener('pointerup', () => {
      ring.classList.remove('is-down');
      pointer.classList.remove('is-down');
    }, { passive: true });

    function hide() {
      setShown(false);
      setTextMode(false);
      ring.classList.remove('is-link', 'is-down');
      pointer.classList.remove('is-link', 'is-down');
    }

    doc.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);

    window.requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ */
  /* Rail laterale della landing                                         */
  /* ------------------------------------------------------------------ */

  function initRail() {
    if (!isLanding) return;

    const items = [
      ['problema', 'Il problema'],
      ['come-funziona', 'Come funziona'],
      ['funzioni', 'Funzioni'],
      ['demo', 'La demo'],
      ['prezzi', 'Prezzo'],
      ['domande', 'Domande'],
      ['accesso', 'Accesso']
    ];

    const sections = items
      .map(([id, label]) => ({ id, label, section: doc.getElementById(id) }))
      .filter((item) => item.section);
    if (sections.length < 3) return;

    const nav = doc.createElement('nav');
    nav.className = 'fx-rail';
    nav.setAttribute('aria-label', 'Sezioni della pagina');
    nav.innerHTML = `
      <span class="fx-rail-progress" aria-hidden="true"><i></i></span>
      <ol>
        ${sections.map((item, index) => `
          <li>
            <a href="#${item.id}" title="${item.label}">
              <span class="fx-rail-num">${String(index + 1).padStart(2, '0')}</span>
              <span class="fx-rail-text">${item.label}</span>
            </a>
          </li>`).join('')}
      </ol>`;
    body.appendChild(nav);

    const links = $$('a', nav);
    const progress = $('.fx-rail-progress i', nav);
    let active = -2;
    let frame = 0;

    function update() {
      const line = window.scrollY + window.innerHeight * 0.42;
      let next = -1;
      sections.forEach((item, index) => {
        if (item.section.offsetTop <= line) next = index;
      });
      if (window.scrollY + window.innerHeight >= doc.documentElement.scrollHeight - 6) {
        next = sections.length - 1;
      }
      if (next !== active) {
        active = next;
        links.forEach((link, index) => {
          const isActive = index === active;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
      const max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.setProperty('--fx-rail-progress', String(clamp(window.scrollY / max, 0, 1)));
    }

    function schedule() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Bottoni magnetici e pressione                                       */
  /* ------------------------------------------------------------------ */

  function initMagnets() {
    if (!finePointer.matches) return;

    const elements = $$('.btn, .link-btn, .price-choice, .theme-toggle, .top-actions .btn');
    elements.forEach((element) => {
      if (element.hasAttribute('data-magnetic') || element.closest('.fx-rail')) return;
      element.classList.add('fx-magnet');

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left - rect.width / 2) * 0.045, -4, 4);
        const y = clamp((event.clientY - rect.top - rect.height / 2) * 0.06, -3, 3);
        element.style.setProperty('--fx-mx', `${x.toFixed(2)}px`);
        element.style.setProperty('--fx-my', `${y.toFixed(2)}px`);
      });
      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--fx-mx', '0px');
        element.style.setProperty('--fx-my', '0px');
        element.classList.remove('is-pressed');
      });
      element.addEventListener('pointerdown', () => element.classList.add('is-pressed'));
      element.addEventListener('pointerup', () => element.classList.remove('is-pressed'));
      element.addEventListener('pointercancel', () => element.classList.remove('is-pressed'));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveal e sottolineature dei titoli                                  */
  /* ------------------------------------------------------------------ */

  function initReveals() {
    const litTargets = $$('.section-head, .faq-intro, .access-copy, .price-side-card, .showcase-head, .fit-copy, .legal-section, .legal-warning');
    const revealTargets = isLegal ? $$('.legal-section, .legal-warning') : [];

    litTargets.forEach((element) => element.classList.add('fx-lit'));
    revealTargets.forEach((element) => element.classList.add('fx-reveal-up'));

    if (!('IntersectionObserver' in window)) {
      litTargets.forEach((element) => element.classList.add('is-lit'));
      revealTargets.forEach((element) => element.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-lit');
        if (entry.target.classList.contains('fx-reveal-up')) entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    litTargets.forEach((element) => observer.observe(element));
  }

  /* ------------------------------------------------------------------ */
  /* Scintille e feedback                                                */
  /* ------------------------------------------------------------------ */

  function spawnSparks(x, y, count = 5, colorSet = palette) {
    if (reduceMotion.matches) return;
    for (let index = 0; index < count; index += 1) {
      const spark = doc.createElement('span');
      spark.className = 'fx-mini-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      const angle = Math.random() * Math.PI * 2;
      const distance = random(26, 74);
      spark.style.setProperty('--fx-sx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
      spark.style.setProperty('--fx-sy', `${(Math.sin(angle) * distance - random(8, 30)).toFixed(1)}px`);
      spark.style.setProperty('--fx-sr', `${random(45, 180).toFixed(0)}deg`);
      spark.style.setProperty('--fx-spark-color', colorSet[index % colorSet.length]);
      spark.addEventListener('animationend', () => spark.remove(), { once: true });
      body.appendChild(spark);
    }
  }

  function actionPop(x, y, label) {
    if (reduceMotion.matches) return;
    const pop = doc.createElement('span');
    pop.className = 'fx-action-pop';
    pop.setAttribute('aria-hidden', 'true');
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    pop.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>' + label;
    body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 1200);
  }

  function initInteractions() {
    doc.addEventListener('pointerdown', (event) => {
      const target = event.target.closest('a, button, summary, .price-choice, .cell-btn, .pay-action, .chaos-check');
      if (!target || target.closest('.notice, .fx-rail')) return;
      if (target.matches('input[type="checkbox"], .chaos-check input')) return;
      const strong = target.matches('.cell-btn, .pay-action');
      spawnSparks(event.clientX, event.clientY, strong ? 8 : 4);
    }, { passive: true });

    $$('.chaos-check input').forEach((input) => {
      input.addEventListener('change', () => {
        const box = input.closest('.chaos-check') || input;
        const rect = box.getBoundingClientRect();
        spawnSparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 9);
        const score = $('[data-chaos-score]');
        if (score) {
          score.classList.remove('fx-bump');
          void score.offsetWidth;
          score.classList.add('fx-bump');
        }
        const all = $$('.chaos-check input');
        if (all.length && all.every((item) => item.checked)) {
          const test = $('[data-chaos-test]');
          const testRect = test ? test.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
          spawnSparks(testRect.left + testRect.width / 2, testRect.top + testRect.height / 2, 22);
        }
      });
    });

    const propertyForm = $('#propertyForm');
    if (propertyForm) {
      propertyForm.addEventListener('submit', () => {
        const rect = propertyForm.getBoundingClientRect();
        window.setTimeout(() => {
          spawnSparks(rect.left + rect.width / 2, rect.top + 80, 16);
        }, 90);
      });
    }

    if (isDemo) {
      doc.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-pay-id], [data-cell-id]');
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        window.setTimeout(() => actionPop(rect.left + rect.width / 2, rect.top, 'Stato aggiornato'), 35);
      });

      ['resetDemo', 'resetDemoTop'].forEach((id) => {
        const button = doc.getElementById(id);
        if (!button) return;
        button.addEventListener('click', () => {
          body.classList.remove('fx-reset-pulse');
          void body.offsetWidth;
          body.classList.add('fx-reset-pulse');
          window.setTimeout(() => body.classList.remove('fx-reset-pulse'), 800);
        });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Demo: viste, grafico e accento                                      */
  /* ------------------------------------------------------------------ */

  function initDemo() {
    if (!isDemo) return;

    const chart = $('#collectionsChart');
    if (chart) chart.classList.add('fx-chart-live');

    const accents = {
      overview: 'var(--lime)',
      properties: 'var(--violet)',
      payments: 'var(--amber)',
      deadlines: 'var(--coral)',
      tools: 'var(--mint)'
    };

    function enterView() {
      const panel = $('[data-view-panel]:not([hidden])');
      if (!panel) return;
      if (!reduceMotion.matches) {
        panel.classList.remove('fx-view-enter');
        void panel.offsetWidth;
        panel.classList.add('fx-view-enter');
      }

      const activeNav = $('.nav-item.active');
      const accent = activeNav ? accents[activeNav.dataset.view] : null;
      if (accent) root.style.setProperty('--fx-live', accent);
    }

    doc.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-item, [data-go]')) return;
      window.requestAnimationFrame(enterView);
    });

    const initialNav = $('.nav-item.active');
    if (initialNav && accents[initialNav.dataset.view]) {
      root.style.setProperty('--fx-live', accents[initialNav.dataset.view]);
    }
    enterView();
  }

  /* ------------------------------------------------------------------ */
  /* Accento che cambia con la sezione                                   */
  /* ------------------------------------------------------------------ */

  function initSectionAccent() {
    if (!isLanding || !('IntersectionObserver' in window)) return;

    const map = [
      ['#problema', 'var(--coral)'],
      ['#come-funziona', 'var(--lime)'],
      ['#funzioni', 'var(--violet)'],
      ['#demo', 'var(--mint)'],
      ['#prezzi', 'var(--amber)'],
      ['#domande', 'var(--lime)'],
      ['#accesso', 'var(--violet)']
    ]
      .map(([selector, color]) => ({ element: $(selector), color }))
      .filter((item) => item.element);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = map.find((item) => item.element === visible.target);
      if (match) root.style.setProperty('--fx-live', match.color);
    }, { rootMargin: '-28% 0px -56% 0px', threshold: 0 });

    map.forEach((item) => observer.observe(item.element));
  }

  /* ------------------------------------------------------------------ */
  /* Orologio locale nel hero                                            */
  /* ------------------------------------------------------------------ */

  function initClock() {
    if (!isLanding) return;
    const host = $('.hero-copy');
    if (!host) return;

    const clock = doc.createElement('p');
    clock.className = 'fx-live-clock';
    clock.innerHTML = '<span class="dot" aria-hidden="true"></span><span data-fx-clock>Oggi · ora locale</span>';
    host.appendChild(clock);
    const text = $('[data-fx-clock]', clock);

    function tick() {
      const now = new Date();
      const day = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'long' }).format(now);
      const time = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(now);
      if (text) text.textContent = `Oggi · ${day} · ${time} · ora locale`;
    }

    tick();
    window.setInterval(tick, 30000);
  }

  /* ------------------------------------------------------------------ */
  /* Transizione tra pagine                                              */
  /* ------------------------------------------------------------------ */

  function initRouteTransition() {
    let navigating = false;
    let overlay = null;

    function showRoute(destination) {
      if (navigating) return;
      navigating = true;
      overlay = doc.createElement('div');
      overlay.className = 'fx-route';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '<span>Affitto in ordine</span>';
      body.appendChild(overlay);
      window.requestAnimationFrame(() => overlay.classList.add('is-on'));
      try { sessionStorage.setItem(NAV_FLAG, '1'); } catch (_) { /* nessun problema */ }
      window.setTimeout(() => {
        window.location.assign(destination);
      }, 390);
    }

    doc.addEventListener('click', (event) => {
      if (reduceMotion.matches) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.target === '_parent' || link.target === '_top') return;
      if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return;
      if (link.closest('.notice')) return;

      let url;
      try { url = new URL(link.getAttribute('href'), window.location.href); } catch (_) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!url.pathname.endsWith('.html') && !url.pathname.endsWith('/')) return;

      event.preventDefault();
      showRoute(url.href);
    });

    window.addEventListener('pageshow', () => {
      navigating = false;
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Avvio                                                              */
  /* ------------------------------------------------------------------ */

  initArrival();
  initAmbient();
  initCursor();
  initRail();
  initMagnets();
  initReveals();
  initInteractions();
  initDemo();
  initSectionAccent();
  initClock();
  initRouteTransition();
})();

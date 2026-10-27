(() => {
  'use strict';

  const STORAGE_KEY = 'aio-notice-v1';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
  } catch (_) { /* storage non disponibile: l'avviso resta utile */ }

  if (document.documentElement.dataset.notice === 'off') return;

  const layer = document.createElement('div');
  layer.className = 'notice-layer';
  layer.innerHTML = `
    <section class="notice-card" role="dialog" aria-modal="true" aria-labelledby="noticeTitle" aria-describedby="noticeCopy" tabindex="-1">
      <div class="notice-ribbon" aria-hidden="true"><strong>0</strong> cookie</div>
      <div class="notice-scroll">
        <p class="notice-kicker">Trasparenza · primo accesso</p>
        <h2 id="noticeTitle">Cookie: zero.<br><span>Memoria tecnica: sì.</span></h2>
        <div id="noticeCopy">
          <p class="notice-lead">Questo sito <strong>non usa cookie</strong>, analytics, pixel o tracker. Per far funzionare la demo e ricordare le tue preferenze salva soltanto dati tecnici nel browser.</p>
          <ul class="notice-list">
            <li><strong>Demo locale.</strong> Immobili e incassi restano sul tuo dispositivo.</li>
            <li><strong>Tema.</strong> Modalità e palette restano nel browser.</li>
            <li><strong>Zero invii.</strong> Nessun account, nessuna profilazione.</li>
            <li><strong>Zero pubblicità.</strong> Non condividiamo dati con terzi.</li>
          </ul>
          <p class="notice-small">Non c'è un consenso pubblicitario da prestare: non ci sono cookie non tecnici. Questo avviso spiega cosa resta sul dispositivo e richiede una presa d'atto prima di continuare.</p>
        </div>
        <p class="notice-foot">Nessun cookie HTTP o JavaScript. Dati cancellabili dalle impostazioni del browser o con “Ripristina i dati demo”.</p>
      </div>
      <div class="notice-actions">
        <button class="notice-accept" type="button">
          Ho capito, continua
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <a class="notice-link" href="legale.html#cookie">Informativa cookie <span aria-hidden="true">→</span></a>
      </div>
    </section>
  `;

  document.body.appendChild(layer);

  const card = layer.querySelector('.notice-card');
  const accept = layer.querySelector('.notice-accept');
  const siblings = [...document.body.children].filter((el) => el !== layer && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName));
  const previousInert = siblings.map((el) => [el, el.inert]);
  let closed = false;

  function lockPage() {
    document.body.classList.add('notice-open');
    siblings.forEach((el) => { el.inert = true; });
  }

  function unlockPage() {
    document.body.classList.remove('notice-open');
    previousInert.forEach(([el, value]) => { el.inert = value; });
  }

  function focusMain() {
    const main = document.querySelector('main');
    if (!main) return;
    const hadTabindex = main.hasAttribute('tabindex');
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
    main.addEventListener('blur', () => {
      if (!hadTabindex) main.removeAttribute('tabindex');
    }, { once: true });
  }

  function close() {
    if (closed) return;
    closed = true;
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) { /* storage non disponibile */ }
    layer.classList.remove('is-open');
    layer.classList.add('is-closing');
    const delay = reduceMotion.matches ? 0 : 230;
    window.setTimeout(() => {
      layer.remove();
      unlockPage();
      focusMain();
    }, delay);
  }

  accept.addEventListener('click', close);

  document.addEventListener('keydown', (event) => {
    if (closed || !layer.isConnected) return;

    if (event.key === 'Tab') {
      const focusable = [...card.querySelectorAll('a[href], button:not([disabled])')];
      if (!focusable.length) {
        event.preventDefault();
        card.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === card) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!card.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
  });

  lockPage();
  window.requestAnimationFrame(() => {
    layer.classList.add('is-open');
    card.focus({ preventScroll: true });
  });
})();

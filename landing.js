(() => {
  'use strict';

  const CONTACT_EMAIL = 'alelocu09@gmail.com'; // Email di contatto: modificare qui se cambia.
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile menu ---------- */
  const menu = $('#mobileMenu');
  const menuToggle = $('[data-menu-toggle]');
  const menuClose = $('[data-menu-close]');
  let menuTimer = null;

  function setPageInert(value) {
    $$('main, .site-head, .site-foot').forEach((el) => {
      el.inert = value;
    });
  }

  function openMenu() {
    if (!menu || !menuToggle) return;
    clearTimeout(menuTimer);
    menu.hidden = false;
    document.body.classList.add('menu-open');
    setPageInert(true);
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Chiudi il menu');
    requestAnimationFrame(() => {
      menu.classList.add('is-open');
      const first = $('.mobile-nav a', menu) || menuClose;
      if (first) first.focus();
    });
  }

  function closeMenu(restoreFocus = true) {
    if (!menu || !menuToggle || menu.hidden) return;
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    setPageInert(false);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri il menu');
    menuTimer = setTimeout(() => {
      menu.hidden = true;
      if (restoreFocus) menuToggle.focus();
    }, 240);
  }

  if (menu && menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    if (menuClose) menuClose.addEventListener('click', () => closeMenu());

    $$('a', menu).forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (!menu.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = $$('a[href], button:not([disabled])', menu).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!menu.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Scroll progress & nav spy ---------- */
  const progressBar = $('[data-scroll-progress]');
  const navLinks = $$('.site-nav a[href^="#"]');
  const navSections = navLinks
    .map((link) => ({ link, section: $(link.getAttribute('href')) }))
    .filter((item) => item.section);

  function updateScrollUI() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;

    if (navSections.length) {
      const line = window.scrollY + window.innerHeight * 0.34;
      let active = null;
      for (const item of navSections) {
        if (item.section.offsetTop <= line) active = item.link;
      }
      navLinks.forEach((link) => link.classList.toggle('is-active', link === active));
    }
  }

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateScrollUI();
      scrollFrame = 0;
    });
  }, { passive: true });
  updateScrollUI();

  /* ---------- Legal table of contents ---------- */
  const tocLinks = $$('.legal-toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const tocMap = new Map();
    tocLinks.forEach((link) => {
      const section = $(link.getAttribute('href'));
      if (section) tocMap.set(section, link);
    });

    const tocObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => {
          const active = link === tocMap.get(entry.target);
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-18% 0px -66% 0px' });

    tocMap.forEach((_link, section) => tocObserver.observe(section));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealSelectors = [
    '.section-head',
    '.pain-card',
    '.chaos-test',
    '.closing-line',
    '.step-card',
    '.bento-card',
    '.fit-card',
    '.showcase-frame',
    '.showcase-caption',
    '.price-switch-wrap',
    '.price-card',
    '.price-side-card',
    '.faq-intro',
    '.faq details',
    '.access-copy',
    '.access-form'
  ];

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const revealTargets = $$(revealSelectors.join(','));
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    revealTargets.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.94) {
        el.style.setProperty('--d', `${Math.min(index % 5, 4) * 0.045}s`);
        el.classList.add('will-reveal');
        revealObserver.observe(el);
      }
    });
  }

  /* ---------- Ticker pause ---------- */
  const tape = $('[data-tape]');
  const tapeToggle = $('[data-tape-toggle]');
  if (tape && tapeToggle) {
    tapeToggle.addEventListener('click', () => {
      const paused = tape.classList.toggle('is-paused');
      tapeToggle.setAttribute('aria-pressed', String(paused));
      tapeToggle.setAttribute('aria-label', paused ? 'Riprendi il nastro scorrevole' : 'Metti in pausa il nastro scorrevole');
      const use = $('use', tapeToggle);
      if (use) use.setAttribute('href', paused ? '#i-play' : '#i-pause');
    });
  }

  /* ---------- Confetti ---------- */
  function burst(target, count = 18) {
    if (reduceMotion.matches) return;
    const host = target && target.querySelector('[data-confetti]');
    if (!host) return;
    const current = getComputedStyle(document.documentElement);
    const accent = current.getPropertyValue('--lime').trim() || '#dcff45';
    const colors = [accent, '#ff6b4a', '#8367ff', '#bfffe0', '#f7f2e7'];
    host.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'confetti-bit';
      bit.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 340)}px`);
      bit.style.setProperty('--dy', `${Math.round((Math.random() - 0.36) * 280)}px`);
      bit.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 720)}deg`);
      bit.style.setProperty('--delay', `${(Math.random() * 0.1).toFixed(2)}s`);
      bit.style.setProperty('--confetti-color', colors[i % colors.length]);
      host.appendChild(bit);
    }
    setTimeout(() => { host.innerHTML = ''; }, 1100);
  }

  /* ---------- Hero chaos stage ---------- */
  const stage = $('[data-stage]');
  if (stage) {
    const stageButton = $('[data-stage-toggle]', stage);
    const stageState = $('[data-stage-state]', stage);
    const stageWord = $('[data-stage-word]', stage);
    const stageCopy = $('[data-stage-copy]', stage);
    const stageLabel = $('[data-stage-btn-label]', stage);
    const stageLive = $('[data-stage-live]', stage);
    const stageBoard = $('[data-stage-board]', stage);
    let ordered = false;
    let lastToggle = 0;

    function updateStage() {
      stage.dataset.mode = ordered ? 'order' : 'chaos';
      stageButton.setAttribute('aria-pressed', String(ordered));
      stageState.textContent = ordered ? 'ORDINE · 100' : 'CAOS · 87';
      stageWord.textContent = ordered ? 'ORDINE' : 'CAOS';
      stageCopy.textContent = ordered
        ? 'Tutto in un posto. Anche il respiro.'
        : 'Sei tu, con sette schede aperte.';
      stageLabel.textContent = ordered ? 'Rigenera il caos' : 'Metti in ordine';
      stageLive.textContent = ordered
        ? 'Simulazione: le scadenze sono state raccolte in un unico posto.'
        : 'Simulazione: le scadenze sono sparse tra schede, email e memoria.';
    }

    stageButton.addEventListener('click', () => {
      ordered = !ordered;
      updateStage();
      if (ordered) {
        const now = Date.now();
        if (now - lastToggle > 250) burst(stageBoard, 20);
        lastToggle = now;
      }
    });
  }

  /* ---------- Chaos checklist ---------- */
  const chaosTest = $('[data-chaos-test]');
  if (chaosTest) {
    const checks = $$('input[type="checkbox"]', chaosTest);
    const scoreEl = $('[data-chaos-score]', chaosTest);
    const messageEl = $('[data-chaos-message]', chaosTest);
    const messages = [
      'Quattro domande. Zero giudizi.',
      'Uno. Già un buon motivo per dare un’occhiata.',
      'Due. Il caos comincia a farsi sentire.',
      'Tre. Sei a un passo dal foglio di calcolo che si vendica.',
      'Quattro. Ok, forse è il momento di un unico posto.'
    ];

    function updateChaos() {
      const count = checks.filter((box) => box.checked).length;
      scoreEl.textContent = `${count}/4`;
      messageEl.textContent = messages[count];
      chaosTest.classList.toggle('is-full', count === 4);
    }

    checks.forEach((box) => box.addEventListener('change', updateChaos));
    updateChaos();
  }

  /* ---------- Price switch ---------- */
  const priceChoices = $$('[data-price-choice]');
  const priceCard = $('.price-card');
  if (priceChoices.length && priceCard) {
    const priceData = {
      founder: {
        name: 'Fondatore',
        badge: 'Primi 20 posti',
        amount: '39',
        monthly: '≈ 3,25 € al mese',
        desc: 'Per i primi 20 proprietari. Fino a 5 immobili, supporto diretto e una call di configurazione.'
      },
      standard: {
        name: 'Standard',
        badge: 'Dopo la validazione',
        amount: '79',
        monthly: '≈ 6,58 € al mese',
        desc: 'Prezzo standard previsto per la versione completa. Stesse funzioni, senza i vantaggi riservati ai primi 20.'
      }
    };

    const amountEl = $('[data-price-amount]', priceCard);
    const nameEl = $('[data-price-name]', priceCard);
    const badgeEl = $('[data-price-badge]', priceCard);
    const descEl = $('[data-price-desc]', priceCard);
    const monthlyEl = $('[data-price-monthly]', priceCard);

    function selectPrice(key) {
      const data = priceData[key];
      if (!data) return;
      priceChoices.forEach((button) => {
        const active = button.dataset.priceChoice === key;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      amountEl.textContent = data.amount;
      nameEl.textContent = data.name;
      badgeEl.textContent = data.badge;
      descEl.textContent = data.desc;
      monthlyEl.textContent = data.monthly;
      priceCard.classList.remove('is-changing');
      void priceCard.offsetWidth;
      priceCard.classList.add('is-changing');
      setTimeout(() => priceCard.classList.remove('is-changing'), 400);
    }

    priceChoices.forEach((button) => {
      button.addEventListener('click', () => selectPrice(button.dataset.priceChoice));
    });
  }

  /* ---------- Magnetic buttons, tilt, cursor ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        el.style.setProperty('--mx', `${Math.max(-5, Math.min(5, x))}px`);
        el.style.setProperty('--my', `${Math.max(-4, Math.min(4, y))}px`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--rx', `${(-py * 3.2).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(px * 4.2).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
      el.addEventListener('pointercancel', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    const cursor = $('.cursor-glow');
    if (cursor) {
      let cursorFrame = 0;
      window.addEventListener('pointermove', (event) => {
        if (cursorFrame) return;
        cursorFrame = requestAnimationFrame(() => {
          cursor.style.setProperty('--cx', `${event.clientX}px`);
          cursor.style.setProperty('--cy', `${event.clientY}px`);
          cursor.classList.add('is-on');
          cursorFrame = 0;
        });
      }, { passive: true });
      document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    }
  }

  /* ---------- Access form ---------- */
  const form = $('#waitlistForm');
  if (!form) return;

  const note = $('#formNote');
  const nameInput = $('#wName');
  const emailInput = $('#wEmail');
  const countInput = $('#wCount');
  const privacyInput = $('#wPrivacy');
  const emailError = $('#emailError');
  const privacyError = $('#privacyError');
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(input, errorEl, message) {
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input, errorEl) {
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  emailInput.addEventListener('input', () => {
    if (EMAIL_PATTERN.test(emailInput.value.trim())) clearError(emailInput, emailError);
  });

  privacyInput.addEventListener('change', () => {
    if (privacyInput.checked) clearError(privacyInput, privacyError);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError(emailInput, emailError);
    clearError(privacyInput, privacyError);

    const email = emailInput.value.trim();
    let firstInvalid = null;

    if (!email) {
      showError(emailInput, emailError, 'Inserisci un indirizzo email per poterti ricontattare.');
      firstInvalid = firstInvalid || emailInput;
    } else if (!EMAIL_PATTERN.test(email)) {
      showError(emailInput, emailError, 'Controlla l’indirizzo email: manca qualcosa o il formato non è valido.');
      firstInvalid = firstInvalid || emailInput;
    }

    if (!privacyInput.checked) {
      showError(privacyInput, privacyError, 'Conferma di aver letto l’informativa privacy per inviare la richiesta.');
      firstInvalid = firstInvalid || privacyInput;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const name = nameInput.value.trim() || '—';
    const count = countInput.value;
    const subject = encodeURIComponent('Accesso fondatore · Affitto in Ordine');
    const body = encodeURIComponent(
      `Ciao,\n\nvorrei provare Affitto in Ordine.\n\n` +
      `Nome: ${name}\n` +
      `Email: ${email}\n` +
      `Immobili: ${count}\n` +
      `Informativa privacy letta e confermata: sì\n\n` +
      `Vorrei capire come funziona l’accesso fondatore.\n\nGrazie.`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    note.innerHTML = `Si sta aprendo il tuo programma email. Se non succede, scrivi a <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
  });
})();

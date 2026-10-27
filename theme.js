(() => {
  'use strict';

  const STORAGE_KEY = 'aio-theme-v1';
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const allowedModes = new Set(['light', 'dark', 'system']);
  const allowedPalettes = new Set(['lime', 'sky', 'coral', 'violet', 'mint', 'amber']);
  const paletteNames = {
    lime: 'Acido',
    sky: 'Cielo',
    coral: 'Corallo',
    violet: 'Viola',
    mint: 'Menta',
    amber: 'Ambra'
  };
  const defaults = { mode: 'system', palette: 'lime' };
  let state = { ...defaults };
  let panel = null;
  let triggers = [];
  let lastTrigger = null;

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object') return { ...defaults };
      return {
        mode: allowedModes.has(value.mode) ? value.mode : defaults.mode,
        palette: allowedPalettes.has(value.palette) ? value.palette : defaults.palette
      };
    } catch (_) {
      return { ...defaults };
    }
  }

  function writeState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* La preferenza resta valida per la sessione, anche se lo storage non è disponibile. */
    }
  }

  function effectiveMode() {
    if (state.mode === 'system') return systemDark.matches ? 'dark' : 'light';
    return state.mode;
  }

  function apply() {
    const mode = effectiveMode();
    const paletteName = paletteNames[state.palette] || paletteNames.lime;
    const modeLabel = state.mode === 'system'
      ? `Auto (${mode === 'dark' ? 'scuro' : 'chiaro'})`
      : (mode === 'dark' ? 'Scuro' : 'Chiaro');

    root.dataset.mode = mode;
    root.dataset.modeChoice = state.mode;
    root.dataset.palette = state.palette;
    root.style.colorScheme = mode;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0a0d0a' : '#f7f2e7');

    document.querySelectorAll('input[name="theme-mode"]').forEach((input) => {
      input.checked = input.value === state.mode;
    });
    document.querySelectorAll('input[name="theme-palette"]').forEach((input) => {
      input.checked = input.value === state.palette;
    });

    document.querySelectorAll('[data-theme-shot]').forEach((image) => {
      const source = mode === 'dark' ? image.dataset.dark : image.dataset.light;
      if (source && image.getAttribute('src') !== source) image.setAttribute('src', source);
    });

    triggers.forEach((trigger) => {
      trigger.setAttribute('aria-label', `Tema ${modeLabel}, palette ${paletteName}. Scegli tema e palette`);
    });

    const status = document.querySelector('[data-theme-status]');
    if (status) status.textContent = `Tema ${modeLabel} · palette ${paletteName}`;

    window.dispatchEvent(new CustomEvent('aio:themechange', {
      detail: { mode: state.mode, effectiveMode: mode, palette: state.palette }
    }));
  }

  function updateState(patch) {
    state = { ...state, ...patch };
    writeState();
    apply();
  }

  function openPanel(trigger) {
    if (!panel) return;
    lastTrigger = trigger || triggers[0] || null;
    panel.hidden = false;
    triggers.forEach((item) => item.setAttribute('aria-expanded', 'true'));
    const selected = panel.querySelector('input[name="theme-mode"]:checked')
      || panel.querySelector('input');
    if (selected) requestAnimationFrame(() => selected.focus());
  }

  function closePanel(restoreFocus = true) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    triggers.forEach((item) => item.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && lastTrigger) lastTrigger.focus();
  }

  function bind() {
    panel = document.querySelector('[data-theme-panel]');
    triggers = [...document.querySelectorAll('[data-theme-toggle]')];

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        if (!panel) return;
        if (panel.hidden) openPanel(trigger);
        else closePanel();
      });
    });

    const closeButton = panel ? panel.querySelector('[data-theme-close]') : null;
    if (closeButton) closeButton.addEventListener('click', () => closePanel());

    if (panel) {
      panel.addEventListener('change', (event) => {
        const input = event.target.closest('input');
        if (!input) return;
        if (input.name === 'theme-mode') updateState({ mode: input.value });
        if (input.name === 'theme-palette') updateState({ palette: input.value });
      });

      document.addEventListener('pointerdown', (event) => {
        if (panel.hidden) return;
        if (panel.contains(event.target)) return;
        if (triggers.some((trigger) => trigger.contains(event.target))) return;
        closePanel(false);
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panel && !panel.hidden) {
        event.preventDefault();
        closePanel();
      }
    });

    const onSystemChange = () => {
      if (state.mode === 'system') apply();
    };
    if (typeof systemDark.addEventListener === 'function') {
      systemDark.addEventListener('change', onSystemChange);
    } else if (typeof systemDark.addListener === 'function') {
      systemDark.addListener(onSystemChange);
    }

    root.classList.add('theme-ready');
    apply();
  }

  state = readState();
  apply();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();

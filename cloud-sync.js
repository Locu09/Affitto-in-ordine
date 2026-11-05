/*
  Orchestrazione della sincronizzazione facoltativa con Google Drive.

  Regole:
  - la demo funziona sempre in locale, anche senza rete o senza Drive;
  - la sincronizzazione automatica è la funzione premium;
  - il flag is_premium presente su Drive non viene mai considerato attendibile:
    viene ricalcolato dalla licenza firmata verificata in locale;
  - in caso di conflitto vince il dato più recente e una copia locale viene
    conservata in aio-cloud-conflict-v1.
*/
(() => {
  'use strict';

  const cfg = window.AIO_CLOUD_CONFIG || {};
  const service = window.AIODriveService;
  const license = window.AIOLicense;
  const card = document.getElementById('cloudCard');
  if (!service || !license || !card) return;

  const licenseConfigured = Boolean(cfg.licensePublicKey);
  const purchaseConfigured = Boolean(
    cfg.purchase &&
    cfg.purchase.enabled !== false &&
    (cfg.purchase.requestEmail || cfg.purchase.requestUrl)
  );
  if (!service.isConfigured() && !licenseConfigured && !purchaseConfigured && !cfg.showWhenUnconfigured) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  const META_KEY = 'aio-drive-meta-v1';
  const CONFLICT_KEY = 'aio-cloud-conflict-v1';
  const APP_ID = cfg.appId || 'affitto-in-ordine';
  const SCHEMA = 1;
  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const PREMIUM_ONLY = cfg.autoSyncPremiumOnly !== false;
  const SYNC_KEYS = Array.isArray(cfg.syncKeys) && cfg.syncKeys.length
    ? cfg.syncKeys
    : ['affitto-in-ordine-demo-v1'];

  const $ = (id) => document.getElementById(id);
  const badge = $('cloudBadge');
  const status = $('cloudStatus');
  const connectButton = $('cloudConnect');
  const syncButton = $('cloudSync');
  const disconnectButton = $('cloudDisconnect');
  const licenseForm = $('licenseForm');
  const licenseInput = $('licenseCode');
  const licenseButton = $('licenseApply');
  const licenseClear = $('licenseClear');
  const licenseStatus = $('licenseStatus');

  let connected = false;
  let busy = false;
  let licenseBusy = false;
  let licenseFeedback = '';
  let syncTimer = 0;
  let phase = 'local';
  let lastError = '';

  const meta = readMeta();
  if (!meta.deviceId) {
    meta.deviceId = newDeviceId();
    saveMeta();
  }

  function readMeta() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY) || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed;
    } catch (_) {
      return {};
    }
  }

  function saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (_) { /* la sincronizzazione resta possibile per questa sessione */ }
  }

  function newDeviceId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (_) { /* fallback */ }
    return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function readSnapshot() {
    const data = {};
    for (const key of SYNC_KEYS) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) data[key] = value;
      } catch (_) { /* storage non disponibile */ }
    }
    return data;
  }

  function applySnapshot(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('file');
    for (const key of SYNC_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, key) && typeof data[key] === 'string') {
        localStorage.setItem(key, data[key]);
      }
    }
  }

  function backupLocalSnapshot() {
    try {
      localStorage.setItem(CONFLICT_KEY, JSON.stringify({
        at: new Date().toISOString(),
        reason: 'remote-newer',
        data: readSnapshot()
      }));
    } catch (_) { /* copia di sicurezza facoltativa */ }
  }

  function parseRemote(text) {
    if (!text || text.length > MAX_FILE_BYTES) throw new Error('file');
    const payload = JSON.parse(text);
    if (!payload || payload.schema !== SCHEMA || payload.app !== APP_ID) {
      throw new Error('file');
    }
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
      throw new Error('file');
    }
    return payload;
  }

  function remoteTimestamp(payload, file) {
    const fromPayload = Number(payload && payload.updatedAt);
    if (Number.isFinite(fromPayload) && fromPayload > 0) return fromPayload;
    const fromDrive = Date.parse((file && file.modifiedTime) || '');
    return Number.isFinite(fromDrive) ? fromDrive : 0;
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function notify(message) {
    if (!message) return;
    window.dispatchEvent(new CustomEvent('aio:toast', { detail: { message } }));
  }

  function errorMessage(error) {
    const code = (error && (error.code || error.message)) || '';
    if (code === 'not-configured') return 'Configurazione Google non presente.';
    if (code === 'offline' || code === 'NetworkError' || !navigator.onLine) {
      return 'Sei offline: i dati restano in locale.';
    }
    if (code === 'AUTH_REQUIRED' || code === 'popup_closed' || code === 'access_denied') {
      return 'Accesso Google non disponibile. Ricollega il Drive.';
    }
    if (code === 'FORBIDDEN') return 'Google Drive ha negato l’accesso alla cartella dell’app.';
    if (code === 'NOT_FOUND') return 'File di configurazione non trovato su Drive.';
    if (code === 'file') return 'Il file su Drive non è leggibile o non è compatibile.';
    if (code === 'UPLOAD' || code === 'DRIVE') return 'Drive non raggiungibile. Riprova più tardi.';
    return 'Sincronizzazione non riuscita. I dati restano in locale.';
  }

  function licenseErrorMessage(error) {
    if (error === 'not-configured') return 'La verifica delle licenze non è ancora configurata.';
    if (error === 'expired') return 'La licenza è scaduta.';
    if (error === 'not-active') return 'La licenza non è ancora attiva.';
    if (error === 'signature') return 'Firma della licenza non valida.';
    if (error === 'payload' || error === 'format') return 'Codice licenza non riconosciuto.';
    return 'Licenza non valida.';
  }

  function canAutoSync() {
    if (!connected) return false;
    return !PREMIUM_ONLY || license.isPremium();
  }

  function render() {
    if (!badge || !status) return;
    const configured = service.isConfigured();
    const premium = license.isPremium();
    const ready = license.getStatus().ready;

    let badgeText = 'Solo locale';
    let badgeState = 'local';
    let message = 'I dati restano in questo browser. Il collegamento a Google Drive è facoltativo.';

    if (busy) {
      badgeText = 'Sincronizzo';
      badgeState = 'busy';
      message = phase === 'preparing'
        ? 'Preparo le librerie Google. Tra un istante potrai accedere.'
        : 'Sto parlando con Google Drive…';
    } else if (!configured) {
      badgeText = 'Da configurare';
      badgeState = 'error';
      message = 'Google Drive non è configurato in questa build. La demo continua in locale.';
    } else if (lastError) {
      badgeText = 'Errore';
      badgeState = 'error';
      message = lastError;
    } else if (connected && meta.pending) {
      badgeText = 'Da sincronizzare';
      badgeState = 'pending';
      message = premium
        ? 'Modifiche locali in attesa. La sincronizzazione automatica partirà tra poco.'
        : 'Modifiche locali in attesa. Premi “Sincronizza ora” per caricarle.';
    } else if (connected) {
      badgeText = 'Drive';
      badgeState = 'connected';
      message = meta.lastSyncedAt
        ? `Drive collegato · ultima sincronizzazione ${formatDate(meta.lastSyncedAt)}.`
        : 'Drive collegato.';
    } else if (meta.enabled) {
      badgeText = 'Ricollega';
      badgeState = 'auth';
      message = 'La sessione Google è terminata. Ricollega il Drive per riprendere.';
    } else if (premium) {
      badgeText = 'Premium';
      badgeState = 'premium';
      message = 'Licenza attiva. Collega Google Drive per il backup automatico.';
    }

    badge.textContent = badgeText;
    badge.dataset.state = badgeState;
    status.textContent = message;

    if (connectButton) {
      const reauth = Boolean(meta.enabled && !connected);
      connectButton.textContent = phase === 'ready'
        ? 'Accedi con Google'
        : reauth ? 'Ricollega Google Drive' : 'Collega Google Drive';
      connectButton.hidden = connected;
      connectButton.disabled = busy || !configured;
    }
    if (syncButton) {
      syncButton.hidden = !connected;
      syncButton.disabled = busy;
    }
    if (disconnectButton) {
      disconnectButton.hidden = !connected && !meta.enabled;
      disconnectButton.disabled = busy;
    }
    if (licenseButton) licenseButton.disabled = licenseBusy;
    if (licenseClear) licenseClear.hidden = !premium;

    if (licenseStatus) {
      if (!ready) {
        licenseStatus.textContent = 'Verifica della licenza in corso…';
      } else if (premium) {
        licenseStatus.textContent = licenseFeedback || 'Licenza premium attiva · sincronizzazione automatica inclusa.';
      } else if (licenseFeedback) {
        licenseStatus.textContent = licenseFeedback;
      } else if (license.getStatus().error === 'not-configured') {
        licenseStatus.textContent = 'Verifica licenza non configurata in questa build.';
      } else {
        licenseStatus.textContent = 'Nessuna licenza attiva. La sincronizzazione manuale resta disponibile.';
      }
    }

    document.documentElement.dataset.premium = premium ? 'true' : 'false';
  }

  async function findRemote() {
    const file = await service.findFile(meta.fileId);
    if (file && file.id) {
      meta.fileId = file.id;
    } else {
      meta.fileId = '';
    }
    saveMeta();
    return file;
  }

  async function runSync(reason) {
    lastError = '';
    phase = 'sync';
    render();

    try {
      await license.ready;
      await service.ensureToken(false);
      const file = await findRemote();
      let remotePayload = null;

      if (file) {
        const text = await service.download(file.id);
        remotePayload = parseRemote(text);
        if (remotePayload.license) {
          await license.validate(remotePayload.license);
        }
      }

      const localChanged = Number(meta.lastLocalChangeAt) || 0;
      const remoteChanged = remotePayload ? remoteTimestamp(remotePayload, file) : 0;
      const localWins = Boolean(remotePayload && meta.pending && localChanged > remoteChanged);

      if (!remotePayload || localWins) {
        await push(remotePayload);
      } else {
        await pull(file, remotePayload, remoteChanged);
      }

      connected = true;
      meta.enabled = true;
      lastError = '';
      phase = 'connected';
      if (reason === 'manual' || reason === 'connect') notify('Sincronizzazione completata.');
    } catch (error) {
      connected = false;
      lastError = errorMessage(error);
      phase = 'error';
      if (error && (error.code === 'AUTH_REQUIRED' || error.code === 'popup_closed' || error.code === 'access_denied')) {
        meta.enabled = true;
      }
      saveMeta();
    } finally {
      busy = false;
      render();
    }
  }

  async function push(remotePayload) {
    const token = license.getToken();
    const payload = {
      schema: SCHEMA,
      app: APP_ID,
      updatedAt: Date.now(),
      deviceId: meta.deviceId,
      is_premium: license.isPremium(),
      license: token || null,
      data: readSnapshot()
    };

    let file;
    try {
      file = await service.upload(meta.fileId, JSON.stringify(payload));
    } catch (error) {
      if (!meta.fileId || (error && error.code !== 'NOT_FOUND')) throw error;
      meta.fileId = '';
      saveMeta();
      file = await service.upload('', JSON.stringify(payload));
    }
    meta.fileId = file.id;
    meta.enabled = true;
    meta.pending = false;
    meta.lastSyncedAt = Date.now();
    meta.lastRemoteUpdatedAt = payload.updatedAt;
    meta.lastLocalChangeAt = payload.updatedAt;
    saveMeta();

    // Se il file remoto conteneva una licenza valida, il token locale è già
    // stato verificato prima della decisione di sincronizzazione.
    if (!payload.license && remotePayload && remotePayload.license) {
      await license.validate(remotePayload.license);
    }
  }

  async function pull(file, payload, remoteChanged) {
    const hadPendingChanges = Boolean(meta.pending);
    if (hadPendingChanges) backupLocalSnapshot();
    applySnapshot(payload.data);
    if (payload.license) await license.validate(payload.license);

    meta.fileId = file.id;
    meta.enabled = true;
    meta.pending = false;
    meta.lastSyncedAt = Date.now();
    meta.lastRemoteUpdatedAt = remoteChanged;
    meta.lastLocalChangeAt = remoteChanged;
    saveMeta();

    window.dispatchEvent(new CustomEvent('aio:cloud-pull', {
      detail: { updatedAt: remoteChanged, conflict: hadPendingChanges }
    }));
  }

  function scheduleSync() {
    window.clearTimeout(syncTimer);
    if (!canAutoSync()) return;
    syncTimer = window.setTimeout(() => {
      syncTimer = 0;
      syncNow('auto');
    }, 1200);
  }

  async function syncNow(reason = 'manual') {
    if (busy) return;
    if (reason === 'auto' && !meta.pending) return;
    if (!service.isConfigured()) {
      lastError = errorMessage(new Error('not-configured'));
      render();
      return;
    }
    busy = true;
    await runSync(reason);
  }

  async function connect() {
    if (busy) return;
    if (!service.isConfigured()) {
      lastError = errorMessage(new Error('not-configured'));
      render();
      return;
    }
    busy = true;
    lastError = '';
    phase = 'connecting';
    render();

    try {
      /*
        Il primo clic carica le librerie Google. Il secondo clic apre il
        popup OAuth senza un caricamento di rete nel mezzo: l'attivazione
        utente del browser resta valida e il popup non viene bloccato.
      */
      if (typeof service.isReady === 'function' && !service.isReady()) {
        phase = 'preparing';
        render();
        await service.load();
        phase = 'ready';
        busy = false;
        render();
        notify('Google è pronto. Premi di nuovo per accedere con il tuo account.');
        return;
      }

      await service.connect();
      connected = true;
      meta.enabled = true;
      saveMeta();
      await runSync('connect');
    } catch (error) {
      connected = false;
      lastError = errorMessage(error);
      phase = 'error';
      render();
      busy = false;
    }
  }

  async function disconnect() {
    if (busy) return;
    busy = true;
    render();
    try {
      await service.disconnect();
    } catch (_) { /* il collegamento locale va comunque rimosso */ }
    connected = false;
    meta.enabled = false;
    meta.pending = false;
    phase = 'local';
    lastError = '';
    saveMeta();
    busy = false;
    render();
    notify('Google Drive scollegato. I dati restano in locale.');
  }

  async function applyLicense(event) {
    if (event) event.preventDefault();
    if (licenseBusy) return;
    const code = licenseInput ? licenseInput.value.trim() : '';
    if (!code) {
      licenseFeedback = 'Inserisci il codice ricevuto.';
      render();
      return;
    }

    licenseBusy = true;
    licenseFeedback = '';
    render();
    const result = await license.validate(code);
    licenseBusy = false;

    if (result.ok) {
      licenseFeedback = 'Licenza attivata.';
      if (licenseInput) licenseInput.value = '';
      if (connected) {
        meta.pending = true;
        meta.lastLocalChangeAt = Date.now();
        saveMeta();
        scheduleSync();
      }
    } else {
      licenseFeedback = licenseErrorMessage(result.error);
    }
    render();
  }

  function onLocalChange(event) {
    if (event && event.detail && event.detail.key && !SYNC_KEYS.includes(event.detail.key)) return;
    meta.lastLocalChangeAt = Date.now();
    meta.pending = true;
    saveMeta();
    render();
    scheduleSync();
  }

  function onStorage(event) {
    if (event.key && !SYNC_KEYS.includes(event.key)) return;
    onLocalChange({ detail: { key: event.key || '' } });
  }

  function onOnline() {
    if (connected && canAutoSync()) scheduleSync();
    else render();
  }

  function onOffline() {
    if (!connected) render();
    else {
      lastError = 'Sei offline: i dati restano in locale.';
      render();
    }
  }

  async function resume() {
    if (!service.isConfigured() || !meta.enabled) return;
    busy = true;
    phase = 'resume';
    render();
    try {
      await service.ensureToken(false);
      connected = true;
      await runSync('resume');
    } catch (error) {
      connected = false;
      lastError = errorMessage(error);
      phase = 'auth';
      busy = false;
      render();
    }
  }

  if (connectButton) connectButton.addEventListener('click', connect);
  if (syncButton) syncButton.addEventListener('click', () => syncNow('manual'));
  if (disconnectButton) disconnectButton.addEventListener('click', disconnect);
  if (licenseForm) licenseForm.addEventListener('submit', applyLicense);
  if (licenseInput) {
    licenseInput.addEventListener('input', () => {
      if (licenseFeedback) {
        licenseFeedback = '';
        render();
      }
    });
  }
  if (licenseClear) {
    licenseClear.addEventListener('click', () => {
      license.clear();
      licenseFeedback = 'Licenza rimossa da questo browser.';
      if (connected) {
        meta.pending = true;
        meta.lastLocalChangeAt = Date.now();
        saveMeta();
        syncNow('manual');
      }
      render();
    });
  }

  window.addEventListener('aio:data-changed', onLocalChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  window.addEventListener('aio:license-change', () => {
    if (!license.isPremium() && licenseFeedback === 'Licenza attivata.') {
      licenseFeedback = '';
    }
    render();
    if (connected && license.isPremium() && meta.pending) scheduleSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && canAutoSync() && meta.pending) scheduleSync();
  });

  license.ready.then(render);
  render();

  if (meta.enabled && service.isConfigured()) {
    window.setTimeout(resume, 800);
  }
})();

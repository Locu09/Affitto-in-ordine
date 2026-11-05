/*
  Servizio Google Drive per la sola cartella privata dell'app.

  Carica le librerie Google solo quando viene richiesto un collegamento.
  Il token OAuth resta in memoria e non viene scritto nel localStorage.
  Lo scope usato è drive.appdata: il file è visibile solo a questa app e
  non al resto del Drive dell'utente.
*/
(() => {
  'use strict';

  const cfg = window.AIO_CLOUD_CONFIG || {};
  const GSI_SRC = 'https://accounts.google.com/gsi/client';
  const GAPI_SRC = 'https://apis.google.com/js/api.js';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE_NAME = cfg.driveFileName || 'config_immobili.json';

  let initPromise = null;
  let tokenClient = null;
  let tokenPromise = null;
  let token = '';
  let expiresAt = 0;
  let resolvePendingToken = null;
  let rejectPendingToken = null;

  function clientConfigured() {
    return Boolean(cfg.googleClientId && !cfg.googleClientId.includes('INCOLLA'));
  }

  function loadScript(src, id, globalCheck) {
    return new Promise((resolve, reject) => {
      if (globalCheck && globalCheck()) {
        resolve();
        return;
      }

      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.aioLoaded === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset.aioLoaded = '1';
        resolve();
      };
      script.onerror = () => reject(new Error('script'));
      document.head.appendChild(script);
    });
  }

  function ensureGapiClient() {
    if (window.gapi && window.gapi.client) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (!window.gapi || typeof window.gapi.load !== 'function') {
        reject(new Error('gapi'));
        return;
      }
      window.gapi.load('client', {
        callback: () => resolve(),
        onerror: () => reject(new Error('gapi'))
      });
    });
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (!clientConfigured()) throw new Error('not-configured');
      if (!navigator.onLine) throw new Error('offline');

      await Promise.all([
        loadScript(GSI_SRC, 'aio-gsi', () => Boolean(window.google && window.google.accounts && window.google.accounts.oauth2)),
        loadScript(GAPI_SRC, 'aio-gapi', () => Boolean(window.gapi && typeof window.gapi.load === 'function'))
      ]);

      await ensureGapiClient();

      const initOptions = { discoveryDocs: [DISCOVERY_DOC] };
      if (cfg.googleApiKey) initOptions.apiKey = cfg.googleApiKey;
      await window.gapi.client.init(initOptions);

      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: cfg.googleClientId,
        scope: SCOPE,
        callback: (response) => handleTokenResponse(response),
        error_callback: (error) => handleTokenError(error)
      });

      return true;
    })();

    try {
      return await initPromise;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  }

  function handleTokenResponse(response) {
    if (!resolvePendingToken) return;

    if (!response || response.error || !response.access_token) {
      const error = new Error(response && response.error ? response.error : 'auth');
      error.code = 'AUTH_REQUIRED';
      rejectPendingToken(error);
      clearPending();
      return;
    }

    token = response.access_token;
    const expiresIn = Number(response.expires_in) || 3600;
    expiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;
    try {
      window.gapi.client.setToken({ access_token: token });
    } catch (_) { /* il token resta comunque disponibile per la richiesta */ }
    resolvePendingToken(token);
    clearPending();
  }

  function handleTokenError(error) {
    if (!rejectPendingToken) return;
    const normalized = new Error(error && error.type ? error.type : 'auth');
    normalized.code = 'AUTH_REQUIRED';
    rejectPendingToken(normalized);
    clearPending();
  }

  function clearPending() {
    resolvePendingToken = null;
    rejectPendingToken = null;
    tokenPromise = null;
  }

  function tokenIsFresh() {
    return Boolean(token) && expiresAt > Date.now() + 30 * 1000;
  }

  function requestToken(interactive) {
    if (tokenIsFresh()) return Promise.resolve(token);
    if (tokenPromise) return tokenPromise;

    tokenPromise = new Promise((resolve, reject) => {
      resolvePendingToken = resolve;
      rejectPendingToken = reject;
      try {
        tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
      } catch (error) {
        clearPending();
        reject(error);
      }
    });

    return tokenPromise;
  }

  async function ensureToken(interactive = false) {
    await init();
    if (tokenIsFresh()) return token;
    return requestToken(interactive);
  }

  async function connect() {
    await init();
    await requestToken(true);
    return true;
  }

  function revokeToken() {
    const oldToken = token;
    token = '';
    expiresAt = 0;
    if (window.google && window.google.accounts && window.google.accounts.oauth2 && oldToken) {
      window.google.accounts.oauth2.revoke(oldToken, () => {});
    }
    try {
      if (window.gapi && window.gapi.client) window.gapi.client.setToken(null);
    } catch (_) { /* nessun token da rimuovere */ }
  }

  async function disconnect() {
    revokeToken();
    return true;
  }

  function normalizeError(error, fallbackCode) {
    if (error && error.code) return error;
    const status = error && (error.status || (error.result && error.result.error && error.result.error.code));
    const normalized = new Error((error && error.message) || 'drive');
    if (status === 401) normalized.code = 'AUTH_REQUIRED';
    else if (status === 404) normalized.code = 'NOT_FOUND';
    else if (status === 403) normalized.code = 'FORBIDDEN';
    else normalized.code = fallbackCode || 'DRIVE';
    return normalized;
  }

  async function findFile(cachedId) {
    await ensureToken(false);

    if (cachedId) {
      try {
        const response = await window.gapi.client.drive.files.get({
          fileId: cachedId,
          fields: 'id,name,modifiedTime,size'
        });
        if (response.result && response.result.id) return response.result;
      } catch (error) {
        if (normalizeError(error).code !== 'NOT_FOUND') throw normalizeError(error);
      }
    }

    try {
      const response = await window.gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        q: `name = '${FILE_NAME.replace(/'/g, "\\'")}' and trashed = false`,
        fields: 'files(id,name,modifiedTime,size)',
        orderBy: 'modifiedTime desc',
        pageSize: 10
      });
      const files = response.result && response.result.files;
      return Array.isArray(files) && files.length ? files[0] : null;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async function download(fileId) {
    await ensureToken(false);
    try {
      const response = await window.gapi.client.drive.files.get({ fileId, alt: 'media' });
      if (typeof response.body === 'string') return response.body;
      if (response.result && typeof response.result === 'object') return JSON.stringify(response.result);
      return String(response.body || '');
    } catch (error) {
      throw normalizeError(error);
    }
  }

  function multipartBody(metadata, content, boundary) {
    return [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      content,
      `--${boundary}--`,
      ''
    ].join('\r\n');
  }

  async function upload(fileId, content) {
    await ensureToken(false);
    const boundary = `aio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json'
    };
    if (!fileId) metadata.parents = ['appDataFolder'];

    const path = `https://www.googleapis.com/upload/drive/v3/files${fileId ? `/${encodeURIComponent(fileId)}` : ''}`;
    try {
      const response = await window.gapi.client.request({
        path,
        method: fileId ? 'PATCH' : 'POST',
        params: { uploadType: 'multipart', fields: 'id,name,modifiedTime' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartBody(metadata, content, boundary)
      });
      if (!response.result || !response.result.id) throw new Error('upload');
      return response.result;
    } catch (error) {
      throw normalizeError(error, 'UPLOAD');
    }
  }

  window.AIODriveService = Object.freeze({
    isConfigured: clientConfigured,
    isReady: () => Boolean(tokenClient),
    scope: SCOPE,
    fileName: FILE_NAME,
    load: init,
    connect,
    ensureToken: async (interactive = false) => {
      await ensureToken(interactive);
      return true;
    },
    disconnect,
    revoke: revokeToken,
    findFile,
    download,
    upload,
    hasToken: tokenIsFresh
  });
})();

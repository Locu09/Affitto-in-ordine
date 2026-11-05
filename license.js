/*
  Verifica locale di licenze premium firmate.

  Il codice di licenza non contiene segreti: è un token firmato verificato
  con la chiave pubblica configurata in cloud-config.js. La chiave privata
  deve restare fuori dal repository e non va mai servita al browser.

  Formato del token:
    AIO1.<payload-base64url>.<firma-base64url>

  La firma ECDSA P-256 / SHA-256 copre la stringa "AIO1.<payload>".
  Il payload è JSON e deve contenere almeno:
    { "v": 1, "app": "affitto-in-ordine", "tier": "premium" }

  Una verifica lato client è un controllo di esperienza, non una barriera
  di sicurezza: chi controlla il browser può modificare il codice. Per una
  protezione reale serve una verifica lato server. L'offuscamento di questo
  file non cambia questo limite.
*/
(() => {
  'use strict';

  const cfg = window.AIO_CLOUD_CONFIG || {};
  const STORAGE_KEY = 'aio-license-v1';
  const PRODUCT = cfg.licenseProduct || 'affitto-in-ordine';
  const PREFIX = 'AIO1';

  const state = {
    ready: false,
    valid: false,
    payload: null,
    error: ''
  };

  let publicKeyPromise = null;
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  function publicStatus() {
    return {
      ready: state.ready,
      valid: state.valid,
      payload: state.valid ? state.payload : null,
      error: state.error
    };
  }

  function notify() {
    window.dispatchEvent(new CustomEvent('aio:license-change', { detail: publicStatus() }));
  }

  function base64UrlToBytes(value) {
    const normalized = String(value)
      .replace(/\s+/g, '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function keyBytes(value) {
    let text = String(value || '').trim();
    if (!text) return null;
    if (text.includes('BEGIN PUBLIC KEY')) {
      text = text
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '');
    }
    try {
      const bytes = base64UrlToBytes(text);
      return bytes.length > 40 ? bytes : null;
    } catch (_) {
      return null;
    }
  }

  function importPublicKey() {
    if (publicKeyPromise) return publicKeyPromise;
    publicKeyPromise = (async () => {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('crypto');
      }
      const bytes = keyBytes(cfg.licensePublicKey);
      if (!bytes) throw new Error('not-configured');
      return window.crypto.subtle.importKey(
        'spki',
        bytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
    })();
    return publicKeyPromise;
  }

  /*
    WebCrypto richiede la firma ECDSA nel formato IEEE P1363 (r || s).
    Accettiamo anche il formato DER prodotto da alcuni strumenti, così i
    token possono essere generati senza dipendere da una singola libreria.
  */
  function derToP1363(signature) {
    if (signature.length === 64) return signature;
    if (signature.length < 8 || signature[0] !== 0x30) return signature;

    let offset = 1;
    const lengthByte = signature[offset];
    offset += 1;
    if (lengthByte & 0x80) offset += lengthByte & 0x7f;

    if (signature[offset] !== 0x02) throw new Error('format');
    const rLength = signature[offset + 1];
    offset += 2;
    const r = signature.slice(offset, offset + rLength);
    offset += rLength;

    if (signature[offset] !== 0x02) throw new Error('format');
    const sLength = signature[offset + 1];
    offset += 2;
    const s = signature.slice(offset, offset + sLength);

    const result = new Uint8Array(64);
    function copyInteger(source, start) {
      let first = 0;
      while (first < source.length - 1 && source[first] === 0) first += 1;
      const value = source.slice(first);
      if (value.length > 32) throw new Error('format');
      result.set(value, start + (32 - value.length));
    }
    copyInteger(r, 0);
    copyInteger(s, 32);
    return result;
  }

  async function verifyToken(token) {
    if (!token) return { ok: false, error: 'missing' };
    if (!cfg.licensePublicKey) return { ok: false, error: 'not-configured' };

    const parts = String(token).trim().split('.');
    if (parts.length !== 3 || parts[0] !== PREFIX || !parts[1] || !parts[2]) {
      return { ok: false, error: 'format' };
    }

    let payload;
    try {
      const decoded = new TextDecoder().decode(base64UrlToBytes(parts[1]));
      payload = JSON.parse(decoded);
    } catch (_) {
      return { ok: false, error: 'format' };
    }

    if (!payload || payload.v !== 1 || payload.app !== PRODUCT || payload.tier !== 'premium') {
      return { ok: false, error: 'payload' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.nbf !== undefined) {
      const notBefore = Number(payload.nbf);
      if (!Number.isFinite(notBefore) || notBefore > now + 300) {
        return { ok: false, error: 'not-active' };
      }
    }
    if (payload.exp !== undefined) {
      const expires = Number(payload.exp);
      if (!Number.isFinite(expires) || expires <= now) {
        return { ok: false, error: 'expired' };
      }
    }

    try {
      const key = await importPublicKey();
      const signature = derToP1363(base64UrlToBytes(parts[2]));
      const isValid = await window.crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        signature,
        new TextEncoder().encode(`${PREFIX}.${parts[1]}`)
      );
      if (!isValid) return { ok: false, error: 'signature' };
      return { ok: true, payload };
    } catch (error) {
      return { ok: false, error: error && error.message === 'not-configured' ? 'not-configured' : 'signature' };
    }
  }

  function setValid(token, payload) {
    state.valid = true;
    state.token = token;
    state.payload = payload;
    state.error = '';
  }

  function setInvalid(error) {
    state.valid = false;
    state.token = '';
    state.payload = null;
    state.error = error;
  }

  async function init() {
    let stored = '';
    try {
      stored = localStorage.getItem(STORAGE_KEY) || '';
    } catch (_) { /* storage non disponibile */ }

    if (!stored) {
      setInvalid(cfg.licensePublicKey ? 'missing' : 'not-configured');
    } else {
      const result = await verifyToken(stored);
      if (result.ok) setValid(stored, result.payload);
      else setInvalid(result.error);
    }

    state.ready = true;
    resolveReady(publicStatus());
    notify();
  }

  window.AIOLicense = Object.freeze({
    ready,

    isPremium() {
      return state.valid;
    },

    getStatus: publicStatus,

    getToken() {
      return state.valid ? state.token : '';
    },

    async validate(code) {
      const token = String(code || '').trim();
      if (token && state.valid && state.token === token) {
        return { ok: true, payload: state.payload };
      }
      const result = await verifyToken(token);
      if (result.ok) {
        setValid(token, result.payload);
        try {
          localStorage.setItem(STORAGE_KEY, token);
        } catch (_) { /* la licenza resta valida per questa sessione */ }
        notify();
        return { ok: true, payload: result.payload };
      }
      return { ok: false, error: result.error };
    },

    clear() {
      setInvalid(cfg.licensePublicKey ? 'missing' : 'not-configured');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) { /* storage non disponibile */ }
      notify();
    }
  });

  init();
})();

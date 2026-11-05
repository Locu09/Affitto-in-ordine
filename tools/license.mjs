#!/usr/bin/env node
/*
  Strumento locale per generare la coppia di chiavi e firmare le licenze.

  La chiave privata non deve mai essere pubblicata né inserita nel repository.
  Il browser riceve solo la chiave pubblica presente in cloud-config.js.

  Esempi (Node 18+):
    node tools/license.mjs keygen
    node tools/license.mjs issue --days 365
    node tools/license.mjs issue --out licenza.txt --ref ordine-001

  Il percorso predefinito della chiave privata è fuori dal repository:
    ~/.affitto-in-ordine/license-private-key.pem
*/

import {
  createPrivateKey,
  generateKeyPairSync,
  randomUUID,
  sign
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const APP = 'affitto-in-ordine';
const PREFIX = 'AIO1';
const DEFAULT_KEY_PATH = join(homedir(), '.affitto-in-ordine', 'license-private-key.pem');

function usage() {
  console.log(`Uso:
  node tools/license.mjs keygen [--out PERCORSO] [--force]
  node tools/license.mjs issue [--key PERCORSO] [--days N] [--ref TESTO] [--out FILE]

La chiave pubblica da incollare in cloud-config.js viene stampata da keygen.
La chiave privata predefinita è: ${DEFAULT_KEY_PATH}
`);
}

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function b64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function keygen() {
  const out = resolve(arg('out', DEFAULT_KEY_PATH));
  if (existsSync(out) && !hasFlag('force')) {
    throw new Error(`La chiave esiste già: ${out}. Usa --force solo se vuoi sostituirla.`);
  }

  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicSpki = publicKey.export({ type: 'spki', format: 'der' });

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, privatePem, { mode: 0o600 });

  console.log(`Chiave privata scritta in: ${out}`);
  console.log('Conservala offline e non caricarla su GitHub o sul sito.\n');
  console.log('Chiave pubblica per cloud-config.js (licensePublicKey):\n');
  console.log(b64url(publicSpki));
  console.log('\nFormato PEM equivalente:\n');
  console.log(publicKey.export({ type: 'spki', format: 'pem' }).trim());
}

function issue() {
  const keyPath = resolve(arg('key', DEFAULT_KEY_PATH));
  if (!existsSync(keyPath)) {
    throw new Error(`Chiave privata non trovata: ${keyPath}. Esegui prima keygen.`);
  }

  const days = Math.max(1, Math.min(3660, Number(arg('days', '365')) || 365));
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    app: APP,
    tier: 'premium',
    iat: now,
    nbf: now - 60,
    exp: now + days * 86400,
    jti: randomUUID()
  };

  const reference = arg('ref', '').trim();
  if (reference) payload.ref = reference.slice(0, 80);

  const header = Buffer.from(JSON.stringify(payload), 'utf8');
  const signed = `${PREFIX}.${b64url(header)}`;
  const privateKey = createPrivateKey(readFileSync(keyPath));
  const signature = sign('sha256', Buffer.from(signed, 'utf8'), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  });
  const token = `${signed}.${b64url(signature)}`;

  const out = arg('out', '');
  if (out) {
    writeFileSync(resolve(out), `${token}\n`, { mode: 0o600 });
    console.log(`Licenza scritta in: ${resolve(out)}`);
  } else {
    console.log(token);
  }

  console.log(`\nScadenza: ${new Date(payload.exp * 1000).toISOString()} (${days} giorni)`);
  if (payload.ref) console.log(`Riferimento: ${payload.ref}`);
}

try {
  const command = process.argv[2];
  if (command === 'keygen') keygen();
  else if (command === 'issue') issue();
  else {
    usage();
    process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(`Errore: ${error.message}`);
  process.exitCode = 1;
}

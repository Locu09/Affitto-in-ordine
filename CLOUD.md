# Backup Google Drive e licenze

Questa è una funzione **facoltativa**. Il backup Google Drive resta disattivato finché non viene configurato un client OAuth; la demo continua a funzionare in locale senza Google e senza rete. La verifica delle licenze è predisposta: la chiave pubblica è in `cloud-config.js`, mentre la chiave privata resta fuori dal repository.

## File

| File | Ruolo |
|---|---|
| `cloud-config.js` | Configurazione pubblica: client ID Google, nome file Drive, chiave pubblica delle licenze. Non contiene segreti. |
| `license.js` | Verifica locale di token firmati ECDSA P-256. |
| `drive-service.js` | Caricamento lazy di Google Identity Services e Google API, OAuth, lettura e scrittura nella cartella `appDataFolder`. |
| `cloud-sync.js` | Sincronizzazione, stato UI, gestione errori, conflitti e collegamento alla licenza. |
| `demo.html` / `demo.css` | Riquadro “Licenza premium e Drive”, paywall della demo e stile. |
| `tools/license.mjs` | Generazione chiavi e firma dei token da riga di comando. |

## Configurazione Google

1. Crea un progetto in Google Cloud e abilita **Google Drive API**.
2. Configura la schermata di consenso OAuth con nome del prodotto, informativa privacy e dominio pubblicato.
3. Crea un client OAuth di tipo **Web application**. Non serve un client secret nel browser.
4. Aggiungi tra le **origini JavaScript autorizzate**:
   - `https://TUO-UTENTE.github.io` per la pubblicazione;
   - `http://localhost:8000` o l'origine usata per i test locali.
5. Aggiungi lo scope `https://www.googleapis.com/auth/drive.appdata`. Non usare `https://googleapis.com`: non è uno scope OAuth valido.
6. Inserisci il client ID in `cloud-config.js`:

```js
googleClientId: '1234567890-abcdef.apps.googleusercontent.com',
googleApiKey: '', // facoltativa; se la console la richiede, inseriscila qui
showWhenUnconfigured: true
```

Il client ID e l'eventuale API key sono pubblici: non sono segreti. Non inserire invece client secret, refresh token, chiavi private o dati personali.

Se `showWhenUnconfigured` resta `false`, il riquadro Drive non appare finché `googleClientId` è vuoto. È il comportamento predefinito per non mostrare una funzione non configurata. Il riquadro “Licenza premium e Drive” può comunque apparire se è configurata la chiave pubblica o la richiesta di licenza (`purchase.requestEmail`), anche senza client ID: in quel caso il collegamento Drive resta disabilitato.

Il primo clic su “Collega Google Drive” carica le librerie Google; il secondo apre il popup OAuth. Questo evita che il caricamento asincrono faccia perdere l'attivazione utente del browser e che il popup venga bloccato.

## Licenze firmate

La licenza non viene verificata con una password nascosta nel JavaScript: sarebbe estraibile. Il browser contiene solo una **chiave pubblica**; il token è firmato con una chiave privata che resta fuori dal repository.

Formato:

```text
AIO1.<payload-base64url>.<firma-base64url>
```

Payload minimo:

```json
{
  "v": 1,
  "app": "affitto-in-ordine",
  "tier": "premium",
  "exp": 1893456000,
  "jti": "ordine-123"
}
```

La firma ECDSA P-256 / SHA-256 copre la stringa `AIO1.<payload-base64url>`. `exp` e `nbf` sono opzionali, espressi in secondi Unix.

### Generare chiavi e token

Lo script incluso usa solo moduli Node e non ha dipendenze:

```powershell
# Genera la chiave privata fuori dal repository e stampa la chiave pubblica
node tools/license.mjs keygen

# Firma una licenza annuale per un ordine (nessun dato personale nel token)
node tools/license.mjs issue --days 365 --ref ORDINE-001
```

La chiave privata predefinita è `~/.affitto-in-ordine/license-private-key.pem` (su Windows `C:\Users\TUO-UTENTE\.affitto-in-ordine\license-private-key.pem`). Conservala offline, con un backup sicuro: senza quella chiave non puoi emettere nuove licenze. Non caricarla su GitHub, non incollarla nel sito e non inviarla al cliente.

Metti **solo** la chiave pubblica in `cloud-config.js`:

```js
licensePublicKey: 'LA_CHIAVE_PUBBLICA_SPKI_BASE64URL'
```

Il comando `keygen` stampa la chiave pubblica in base64url e in PEM. Il comando `issue` stampa il token; con `--out licenza.txt` lo salva in un file locale. Per ruotare la chiave, genera una nuova coppia, aggiorna la chiave pubblica e considera che i token vecchi smettono di funzionare: pianifica la migrazione.

### Attivazione manuale e bonifico SEPA

Il sito non ha un checkout. Il riquadro premium apre un'email precompilata verso `purchase.requestEmail`; il Titolare risponde con coordinate bancarie, condizioni e istruzioni. Dopo la conferma del bonifico genera un token e invialo al cliente.

- Non inserire IBAN, dati del venditore o condizioni definitive in `cloud-config.js` o nel repository.
- Prima di incassare, completa identità del venditore, condizioni di vendita, prezzo, recesso, ricevute/fatture e gestione rimborsi in `legale.html`.
- Il token non contiene nome o email del cliente: usa `--ref` con un identificativo d'ordine, non con dati personali.
- Annota separatamente ordine, pagamento, token emesso e scadenza.
- Il token è un controllo di esperienza, non una ricevuta fiscale.

Per una protezione reale, in futuro emetti e verifica i diritti di licenza da un backend autenticato; non presentare l'attivazione client-side come una barriera antifrode.

### Limite di sicurezza

La verifica locale è un controllo di esperienza, non una protezione inviolabile:

- un utente può modificare il JavaScript o il DOM;
- l'offuscamento con `javascript-obfuscator` aumenta solo il costo di manomissione;
- il flag `is_premium` scritto su Drive è **informativo** e non viene mai usato come prova di acquisto;
- la verifica di una licenza firmata impedisce la falsificazione del token senza chiave privata, ma non impedisce di aggirare il codice che lo controlla;
- per una protezione reale serve una verifica lato server, con un account e un diritto di licenza verificato.

## Sincronizzazione

- Lo scope richiesto è solo `drive.appdata`; il file è nella cartella privata dell'app, non nel resto del Drive.
- Nome file predefinito: `config_immobili.json`.
- Contenuto: chiavi localStorage elencate in `syncKeys`, metadati minimi, token di licenza (se presente), flag `is_premium` ricalcolato, timestamp e identificativo casuale del dispositivo.
- Il token OAuth resta nella memoria della pagina e non viene scritto in `localStorage`.
- Al primo collegamento, se il file esiste, il browser sceglie la copia con il timestamp più recente. Se il file non esiste, crea il primo backup.
- Se ci sono modifiche locali non ancora caricate e il file Drive è più recente, il contenuto locale viene conservato in `aio-cloud-conflict-v1` prima di applicare la copia remota. Non esiste un merge automatico.
- La sincronizzazione automatica è la funzione premium. Senza licenza restano disponibili “Collega Google Drive” e “Sincronizza ora”. Con `autoSyncPremiumOnly: false` si può disattivare questo limite, ma allora la licenza non sblocca più questa funzione.
- Se Drive non è raggiungibile, si è offline o la sessione Google scade, la demo continua con `localStorage`. Il token non viene mai salvato su disco.

## Google e privacy

Attivare Drive introduce un trattamento presso Google:

- il browser carica le librerie Google solo dopo un'azione dell'utente o un tentativo di ripresa di un collegamento già attivo;
- il file viene inviato direttamente dal browser a Google Drive;
- Google può usare cookie o memoria del browser secondo la propria informativa;
- il Titolare del sito non riceve il file e non ha un server applicativo;
- l'utente può scollegare l'app, revocare l'accesso da Google e cancellare il file dal Drive;
- il sito non deve più dichiarare “nessun dato lascia il browser” quando la funzione è attiva: la documentazione legale va aggiornata e verificata.

La privacy policy deve descrivere il trattamento Google, la finalità di backup, la conservazione, i trasferimenti e i diritti. Se il progetto usa le API Google per utenti esterni, verifica anche i requisiti della Google API Services User Data Policy e della schermata di consenso OAuth.

## Test minimi

- [x] La demo funziona con `googleClientId` vuoto e non carica script Google.
- [x] Il riquadro licenza/premium appare con chiave pubblica o richiesta configurata; il collegamento Drive resta disabilitato se manca il client ID.
- [x] La demo gratuita mostra 1 immobile e blocca aggiunta, export, promemoria, ISTAT e immobili extra.
- [x] Una licenza valida sblocca 3 immobili di esempio, export, promemoria e ISTAT; la rimozione torna al limite gratuito.
- [x] Un codice manomesso o non valido non attiva il premium.
- [x] Una licenza scaduta, non ancora attiva o con prodotto errato non attiva il premium; una firma o un payload manomessi vengono rifiutati.
- [ ] Il collegamento apre il consenso Google con lo scope `drive.appdata`.
- [ ] Il file `config_immobili.json` viene creato in `appDataFolder`.
- [ ] Una modifica locale crea l'aggiornamento multipart senza duplicare il file.
- [ ] Un secondo browser/dispositivo, dopo il collegamento, legge il file e aggiorna la demo.
- [ ] Offline, sessione scaduta e popup annullato lasciano i dati locali intatti.
- [ ] `is_premium: true` su Drive senza token valido non sblocca nulla.
- [ ] Il conflitto conserva una copia locale e non duplica il file.
- [ ] La funzione è utilizzabile da tastiera, a 320 px e con movimento ridotto.
- [ ] I testi legal/privacy e la schermata di consenso descrivono davvero il trattamento.

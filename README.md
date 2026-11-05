# Affitto in Ordine

**Sito pubblicato:** https://locu09.github.io/Affitto-in-ordine/
**Repository:** https://github.com/Locu09/Affitto-in-ordine

**Prototipo di micro-SaaS per piccoli proprietari immobiliari.**
Non è una macchina per fare soldi. È un prodotto digitale che prova a risolvere un problema specifico e a farsi pagare per farlo.

> **Onestà prima di tutto.** Nessun software, bot o “sistema” può rendere ricco automaticamente chi lo usa. Il denaro arriva da clienti che pagano per un problema risolto, non dal codice. Questo progetto è un esperimento di business: serve a capire, con persone reali, se il problema esiste e se qualcuno è disposto a pagare. Non c'è alcuna garanzia di guadagno.

---

## Cosa c'è dentro

| File / cartella | Descrizione |
|---|---|
| `index.html` | Landing page del prodotto: posizionamento, funzioni, prezzo fondatore, FAQ, form di accesso. |
| `landing.css` / `landing.js` | Stile e comportamento della landing. |
| `theme.css` / `theme.js` | Temi chiaro/scuro/automatico, 12 palette, superfici coordinate e dissolvenza al cambio tema. |
| `readability.css` | Livello di leggibilità: testi, tabelle, etichette e misure di riga. |
| `loading.css` | Schermate di attesa brevi per avvio demo, export e ripristino. |
| `demo.html` | Demo interattiva del prodotto: dashboard, immobili, incassi, scadenze, strumenti. |
| `demo.css` / `demo.js` | Stile e logica della demo. Di base i dati sono salvati nel browser (localStorage); il backup Google Drive è facoltativo. |
| `cloud-config.js` | Configurazione pubblica del backup Drive e della chiave pubblica delle licenze. Non contiene segreti. |
| `license.js` | Verifica locale dei token di licenza firmati (ECDSA P-256). |
| `tools/license.mjs` | Generazione della coppia di chiavi e firma manuale dei token; la chiave privata resta fuori dal repository. |
| `drive-service.js` | Caricamento lazy di Google Identity Services e Google API, OAuth e accesso alla sola cartella `appDataFolder`. |
| `cloud-sync.js` | Sincronizzazione facoltativa, gestione conflitti, stato UI e limite premium. |
| `motion.css` / `motion.js` | Micro-interazioni condivise: tilt, reveal, riflessi e feedback. |
| `alive.css` / `alive.js` | Livello “vivo”: apertura lunga e saltabile, transizioni tra pagine con stato di caricamento, forme ambientali, cursore custom, rail delle sezioni, orologio locale e animazioni delle viste demo. |
| `legale.html` | Privacy, cookie, termini d'uso, informazioni sui consumatori, note legali e accessibilità. |
| `legal.css` | Stile delle pagine legali. |
| `COMPLIANCE.md` | Checklist operativa: cosa è coperto, quali dati mancano, cosa fare prima del lancio. |
| `CLOUD.md` | Configurazione Google OAuth, formato delle licenze, limiti di sicurezza e test del backup Drive. |
| `assets/demo-preview.png` | Screenshot desktop usato nella landing. |
| `assets/demo-mobile.png` | Screenshot mobile usato nella landing. |
| `assets/favicon.svg` | Icona del sito, coerente con il marchio. |
| `README.md` | Questo documento: ipotesi, piano di validazione, limiti, prossimi passi. |

### Come aprirlo

Apri `index.html` con doppio clic. Funziona senza server, senza dipendenze e senza connessione (tranne il link email e l'eventuale backup Drive, che richiede rete e configurazione).

- “Prova la demo” porta a `demo.html`.
- La demo gratuita mostra **1 immobile** e permette di esplorare panoramica, incassi e scadenze. Con la licenza fondatore si sbloccano fino a 5 immobili, aggiunta/rimozione, export CSV, promemoria, calcolatore ISTAT e sincronizzazione automatica Drive.
- Di base i dati della demo restano nel browser. “Ripristina” riporta i dati di esempio.
- Il backup su Google Drive è facoltativo e disattivato finché non viene configurato: salva un file nella cartella privata dell'app del tuo account Google. Vedi `CLOUD.md`.
- L'attivazione della licenza è manuale: richiesta via email, bonifico SEPA concordato e codice firmato inviato dopo la conferma. Il sito non ha un checkout e non conserva l'IBAN.
- Il selettore in alto permette di scegliere modalità chiara, scura o automatica e 12 palette di colore. Il cambio è una dissolvenza breve; con “riduci movimento” resta immediato.
- Le schermate di attesa compaiono solo durante l'apertura della demo, il passaggio tra pagine e le azioni locali più importanti (export CSV, ripristino). Non simulano operazioni online: senza Drive i dati restano nel browser.
- Le informazioni legali sono in `legale.html`: privacy, cookie, termini, consumatori, note legali e accessibilità.

### Pubblicazione gratuita su GitHub Pages

Il sito è statico e non richiede build, database o variabili d'ambiente.

1. Crea un repository **pubblico** su GitHub, per esempio `affitto-in-ordine`.
2. Carica tutti i file nella radice del repository, sul ramo `main`.
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**, ramo `main`, cartella `/ (root)`.
5. Salva e attendi la pubblicazione. L'indirizzo è `https://locu09.github.io/Affitto-in-ordine/`.

Il file `.nojekyll` evita l'elaborazione Jekyll e mantiene le risorse così come sono. La prima pubblicazione richiede account GitHub e repository pubblico; di base i dati della demo restano nel browser dell'utente. La chiave pubblica delle licenze è già configurata; la funzione Drive resta spenta finché `cloud-config.js` non contiene un client ID OAuth valido.

> **Prima di considerarlo pubblico:** `legale.html` resta `noindex,nofollow` e contiene ancora campi `[DA COMPILARE]`. GitHub Pages è un hosting reale e registra dati tecnici di navigazione: aggiorna l'informativa con fornitore, dominio e tempi effettivi e fai verificare i testi legali prima di promuovere il sito o raccogliere dati reali. Se attivi Google Drive, aggiorna anche la schermata di consenso OAuth e verifica la privacy policy Google: la funzione è facoltativa, ma introduce un trattamento presso Google.

---

## Il prodotto

**Promessa:** “Le scadenze del tuo affitto, sotto controllo.”

Per chi affitta da 1 a 5 immobili e gestisce tutto da solo. Il problema non è la contabilità: è tenere insieme **date, incassi e promemoria** che oggi vivono tra Excel, email, agenda e memoria.

### Cosa fa la demo

- **Demo gratuita:** panoramica con 1 immobile, scadenze e incassi degli ultimi 6 mesi; il canone dell'immobile visibile può essere segnato come incassato.
- **Licenza fondatore:** fino a 5 immobili, aggiunta e rimozione, export CSV, promemoria pronti, calcolatore ISTAT e sincronizzazione automatica su Google Drive.
- **Backup Google Drive facoltativo** nella cartella privata dell'app, con sincronizzazione manuale per tutti e automatica come funzione premium verificata localmente.
- Dati di esempio realistici e azioni modificabili, per far capire il valore in due minuti.

### Cosa non fa (volutamente)

- Non è un software di contabilità.
- Non è consulenza fiscale o legale.
- Non gestisce affitti brevi, calendari turistici o agenzie con decine di immobili.
- Non invia email automaticamente: nella demo i testi sono pronti da copiare.
- Non crea un account sul sito e non offre una verifica di licenza lato server: la licenza premium è un controllo locale, modificabile da chi controlla il browser.

Questa restrizione è il posizionamento, non un limite tecnico: un prodotto piccolo e chiaro è più facile da vendere di un gestionale generico.

---

## L'ipotesi di business

| Voce | Ipotesi |
|---|---|
| Cliente | Proprietario persona fisica, 1–5 immobili residenziali, gestione diretta. |
| Problema | Dimentica scadenze, aumenti ISTAT e canoni non pagati; usa Excel o la memoria. |
| Soluzione | Un cruscotto semplice con scadenze, incassi e testi pronti. |
| Prezzo fondatore | 39 €/anno, fino a 5 immobili, primi 20 clienti. |
| Prezzo standard | 79 €/anno. |
| Canale iniziale | Gruppi Facebook di proprietari, contenuti SEO sulle scadenze, passaparola, agenti immobiliari locali. |
| Metriche di validazione | 20 interviste, almeno 3 licenze fondatore attivate a 39 €/anno. |

### Perché questo prezzo

39 €/anno è abbastanza basso da ridurre l'attrito, ma abbastanza alto da testare la volontà di pagare. Non è un prezzo “da ricchi”: serve a validare. Un prodotto a 39 €/anno richiede centinaia o migliaia di clienti per generare un reddito serio; è un punto di partenza, non un traguardo.

---

## Validazione in 14 giorni

L'obiettivo non è costruire altre funzioni. È capire se qualcuno paga.

### Giorni 1–2 — Pubblica e rendi misurabile

1. Verifica che l'email di contatto `alelocu09@gmail.com` sia quella definitiva.
2. Verifica disponibilità del nome e del dominio. “Affitto in Ordine” è un nome di lavoro: controlla marchio e dominio prima di investirci.
3. Pubblica la landing su Netlify Drop, GitHub Pages o Cloudflare Pages (sono tutti statici).
4. Sostituisci il form `mailto` con Tally, Formspree o un Google Form: il `mailto` va bene per il prototipo, non per misurare le conversioni. Prima di farlo, aggiorna l'informativa privacy con il fornitore, il luogo del trattamento e la conservazione.
5. Installa analytics privacy-friendly (Plausible, Umami o GA4). Se lo strumento usa cookie o identificatori non tecnici, aggiungi prima un banner di consenso e aggiorna la cookie policy.

### Giorni 3–5 — Contenuti e presenza

- Pagina SEO: **“Aumento ISTAT affitto: come si calcola”** con il calcolatore come contenuto gratuito.
- Pagina SEO: **“Scadenze del contratto di affitto: cosa controllare”**.
- Un post utile (non pubblicitario) in 3 gruppi Facebook di proprietari/affittuari, rispettando le regole dei gruppi.
- Contatta 5 agenti immobiliari o commercialisti locali: chiedi se possono presentarti 2 proprietari. Offri una call, non una commissione.

### Giorni 6–10 — 20 conversazioni

Non vendere subito. Chiedi cosa fanno oggi e dove si rompe il processo.

**Script di apertura (messaggio):**

> Ciao, sto costruendo uno strumento semplice per chi affitta 1–5 case: scadenze di contratto, aumenti ISTAT e canoni non pagati in un unico posto. Non vendo nulla adesso: mi piacerebbe capire come gestisci queste cose oggi. Hai 10 minuti per due domande?

**Domande per l'intervista:**

1. Quanti immobili affitti e come li gestisci oggi?
2. Qual è stata l'ultima volta che hai rischiato di dimenticare una scadenza? Cosa è successo?
3. Dove tieni le date di contratto, registrazione e aumento ISTAT?
4. Come ti accorgi che un canone non è arrivato?
5. Come gestisci i solleciti? Cosa ti frena nel mandarli?
6. Hai mai usato un gestionale o Excel? Perché lo hai lasciato?
7. Quanto tempo al mese dedichi a queste attività?
8. Se esistesse un cruscotto semplice, cosa dovrebbe assolutamente fare?
9. Quanto sarebbe giusto pagare all'anno per non pensarci più?
10. Conosci altri proprietari nella tua situazione? Posso parlare con loro?

**Regola:** non chiedere “ti piace la mia idea?”. Chiedi cosa fanno oggi e quanto costa loro il problema.

### Giorni 11–13 — Chiedi un impegno

Mostra la demo. Poi proponi una delle due cose:

- **Licenza fondatore:** 39 €/anno, primi 20 posti, fino a 5 immobili. Richiesta via email, coordinate per bonifico SEPA, codice inviato dopo la conferma.
- **Lettera d'intento:** “Sono interessato alla versione fondatore a 39 €/anno” (senza pagamento).

> **Attenzione:** anche un bonifico manuale è una vendita a distanza. Prima di incassare servono identità del venditore, condizioni complete, prezzo, diritto di recesso, ricevute/fatture e gestione rimborsi. Se non hai ancora questi elementi, raccogli solo lettere d'intento senza pagamento. Il sito non deve simulare un checkout: la richiesta via email non è un ordine.

Un “sì, però…” non è un sì. Un “lo comprerei” non è una licenza attivata.

### Giorno 14 — Decisione

| Segnale | Soglia minima |
|---|---|
| Interviste completate | 20 |
| Hanno avuto un problema reale negli ultimi 12 mesi | ≥ 8 |
| Userebbero il prodotto almeno una volta al mese | ≥ 5 |
| Licenze fondatore attivate a 39 €/anno | ≥ 3 |
| Disponibilità a pagare 79 €/anno dopo la validazione | ≥ 2 |

Se non raggiungi le soglie, non costruire il backend: cambia nicchia, posizionamento o prezzo. Se le raggiungi, costruisci solo ciò che serve ai primi clienti.

### Procedura per il primo cliente pagante

1. Il cliente apre la demo, vede il limite di 1 immobile e clicca **“Attiva premium”**.
2. Il pulsante apre un'email precompilata con prezzo e richiesta delle coordinate SEPA. Non inserire IBAN nel sito.
3. Prima di rispondere, verifica di avere i dati del venditore e le condizioni di vendita completi in `legale.html`.
4. Invia coordinate bancarie, importo, causale, condizioni, informativa privacy e istruzioni per il recesso.
5. Ricevuto il bonifico, emetti ricevuta/fattura e conserva la documentazione fiscale.
6. Genera il codice con `node tools/license.mjs issue --days 365 --ref ORDINE-001`. La chiave privata deve restare offline.
7. Invia il codice all'indirizzo che ha effettuato la richiesta, senza inserire dati personali nel token.
8. Chiedi conferma dell'attivazione e annota la scadenza. Non usare lo stesso codice come se fosse un abbonamento automatico: alla scadenza serve un nuovo token.

Il token è un controllo di esperienza, non una ricevuta e non una prova di identità. Conserva separatamente ordine, pagamento e codice emesso.

---

## Canali di acquisizione

### 1. SEO a intento alto

Cerca e presidia query come:

- “aumento ISTAT affitto 2026”
- “scadenza registrazione contratto affitto”
- “sollecito affitto non pagato”
- “calcolo cedolare secca affitto”
- “scadenzario affitti”

Un calcolatore gratuito e una checklist scaricabile sono più efficaci di una pagina “prezzi” senza traffico.

### 2. Gruppi Facebook e community

Gruppi di proprietari, affittuari, piccoli investitori immobiliari e residenti locali. Non spammare: rispondi a domande concrete, poi proponi la demo a chi ha il problema. I gruppi hanno regole diverse: leggile prima.

### 3. Partnership locali

Agenti immobiliari, amministratori di condominio, commercialisti. Non chiedere una commissione subito: chiedi una presentazione. Se il prodotto funziona, una commissione del 20–30% sul primo anno è sostenibile.

### 4. Ads solo dopo la landing

Testa Google Ads a basso budget (10 €/giorno) solo su query esatte, dopo aver verificato che la landing converte. Non bruciare budget prima di sapere quale messaggio funziona.

---

## Numeri, senza illusioni

A 79 €/anno:

| Clienti | Ricavo annuo lordo |
|---|---|
| 10 | 790 € |
| 100 | 7.900 € |
| 500 | 39.500 € |
| 1.000 | 79.000 € |

Da questi ricavi vanno sottratti hosting, email, pagamenti, supporto, tasse e il tempo di acquisizione. Non è un piano per diventare milionari: è un modo per costruire un prodotto vero, con ricavi verificabili, partendo da un problema circoscritto.

Per ambire a numeri più alti servono più clienti, un prezzo più alto, più prodotti o un mercato più ampio. Aggiungere funzioni non sostituisce la distribuzione.

---

## Cosa manca per la versione di produzione

La demo funziona di base in locale; il backup Drive richiede ancora OAuth e la licenza è predisposta con chiave pubblica e firma manuale. Per vendere davvero servono:

1. **Account e database** (es. Supabase): autenticazione, immobili, contratti, pagamenti.
2. **Email transazionali** (Resend, Postmark): promemoria a data fissa, non spam.
3. **Pagamenti** (Stripe): abbonamento annuale, fattura, gestione rinnovi e disdette.
4. **Verifica licenze lato server**: la verifica ECDSA nel browser è solo un controllo di esperienza; per impedire l'attivazione fraudolenta serve un diritto di licenza verificato dal backend.
5. **Google OAuth e Drive**: client ID web, origini autorizzate, schermata di consenso, scope `drive.appdata`, privacy policy e test su più dispositivi. Vedi `CLOUD.md`.
6. **Privacy e GDPR**: informativa, basi giuridiche, conservazione, export e cancellazione. La base documentale è in `legale.html`; per la produzione servono DPA con i fornitori, registro dei trattamenti, procedura data breach e retention automatizzata.
7. **Backup e sicurezza**: cifratura, log degli accessi, gestione incidenti.
8. **Documenti**: upload di contratti e ricevute, con controllo degli accessi.
9. **Supporto**: email o WhatsApp, con tempi dichiarati.
10. **Termini di servizio** e disclaimer chiaro: non è consulenza fiscale o legale. La bozza è in `legale.html`, ma va completata e verificata prima della vendita.

Non costruire queste cose prima di averle promesse a qualcuno che ha detto “sì”.

---

## Rischi e come ridurli

| Rischio | Mitigazione |
|---|---|
| Mercato affollato di gestionali generici | Posizionamento stretto: 1–5 immobili, semplicità, scadenze, promemoria. |
| Uso raro → abbonamento annuale percepito come caro | Promemoria mensili, incassi, export; prezzo annuale basso. |
| Responsabilità fiscale/legale | Nessuna consulenza; testi modificabili; invito a verificare con il consulente. |
| Dati sensibili | Demo locale di default; Drive facoltativo con scope minimo; in produzione GDPR, cifratura, backup e policy. |
| Supporto troppo alto per un solo fondatore | FAQ, video, onboarding guidato, limite di immobili. |
| Nome/dominio già usati | Verifica marchio e dominio prima di pubblicare. |

---

## Compliance: cosa è pronto e cosa manca

> **Nessuna certificazione automatica.** “Essere in linea con tutte le normative” non è un interruttore: dipende dai dati reali, dai fornitori, dal Paese di residenza dei clienti e dal modo in cui il servizio viene venduto. Questa è una base operativa, non un parere legale. Prima di pubblicare e prima di incassare soldi, fai rivedere i testi e i flussi da un professionista.

### Cosa è già stato implementato

- **Privacy:** informativa con titolare, dati, finalità, basi giuridiche, destinatari, trasferimenti, conservazione e diritti in `legale.html#privacy`.
- **Cookie:** dichiarazione di assenza di cookie proprietari e spiegazione della memoria tecnica (`localStorage` e la chiave temporanea `sessionStorage` per la navigazione) in `legale.html#cookie`. Il backup Drive è opt-in e carica librerie Google solo dopo l'azione dell'utente; non è un banner di consenso pubblicitario.
- **Termini:** condizioni d'uso della demo e del prototipo in `legale.html#termini`.
- **Consumatori:** informazioni precontrattuali, recesso, garanzia legale e reclami in `legale.html#consumatori`. L'attivazione è su richiesta e il sito non ha un checkout.
- **Note legali:** campi per identità del titolare, P.IVA, PEC, REA e hosting in `legale.html#note-legali`.
- **Accessibilità:** skip link, focus visibile, modale con focus trap, label, contrasto, responsive e dichiarazione in `legale.html#accessibilita`. Le animazioni decorative e le transizioni si spengono con `prefers-reduced-motion: reduce`; il cursore accessorio non sostituisce mai il puntatore di sistema.
- **Trasparenza commerciale:** la landing dichiara che la demo gratuita è limitata a 1 immobile e che l'attivazione avviene su richiesta via email, con pagamento SEPA fuori dal sito; niente testimonianze inventate o guadagni garantiti.
- **Dati demo:** di base la demo non trasmette dati al Titolare; usa `localStorage` e una chiave tecnica temporanea in `sessionStorage`. Se l'utente attiva Google Drive, il file viene inviato direttamente al suo spazio Google tramite OAuth. I nomi sono fittizi e il footer lo dichiara.
- **Licenza premium locale:** token firmato ECDSA P-256 verificato con una chiave pubblica; il flag `is_premium` su Drive non è attendibile. Resta un controllo lato client, non una protezione anti-manomissione.

### Dati e decisioni che mancano

Compila questi campi in `legale.html` prima di pubblicare:

- [ ] Nome e cognome o ragione sociale del titolare.
- [ ] Forma giuridica e sede legale completa.
- [ ] P.IVA e codice fiscale.
- [ ] PEC (se disponibile) e iscrizione REA (se società).
- [ ] Fornitore di hosting, sede e tempi di conservazione dei log.
- [ ] Dominio effettivo.
- [ ] Tempi di risposta per privacy, accessibilità e reclami.
- [ ] Città del foro per i professionisti (per i consumatori vale il foro di legge).

### Prima di raccogliere dati o vendere

1. **Email:** Gmail consumer non è pensato per un uso professionale strutturato. Valuta Google Workspace con DPA e verifica il trasferimento extra-SEE, oppure un provider con data residency UE.
2. **Form:** se sostituisci il `mailto`, scegli un fornitore con DPA, indica il luogo del trattamento e imposta una conservazione coerente con l'informativa.
3. **Hosting:** preferisci una regione UE, conserva il DPA e aggiorna l'elenco dei destinatari.
4. **Pagamenti:** prima di incassare, aggiungi condizioni di vendita complete, prezzo IVA inclusa, rinnovo, disdetta, ricevute, diritto di recesso e garanzia legale. Per il bonifico SEPA manuale servono un conto intestato al venditore e una procedura di riconciliazione; non pubblicare l'IBAN nel repository e non conservare dati di carta.
5. **Analytics:** se usi cookie o identificatori non tecnici, aggiungi un banner con accetta/rifiuta, revoca e registro del consenso. Non usare cookie wall.
6. **Accessibilità:** fai un test con tastiera, zoom 200%, screen reader e un audit WCAG 2.1 AA. L'European Accessibility Act si applica ai servizi di e-commerce coperti: verifica l'ambito prima del lancio.
7. **Sicurezza:** 2FA sugli account, password manager, backup, log, procedura per data breach (notifica al Garante entro 72 ore quando applicabile).
8. **Registro dei trattamenti:** tieni un registro semplice con finalità, categorie di dati, destinatari, trasferimenti e tempi di conservazione.
9. **Marchio e dominio:** verifica “Affitto in Ordine” e il dominio prima di investire in contenuti e ads.
10. **Google Drive:** configura le origini OAuth autorizzate, verifica la schermata di consenso e lo scope `drive.appdata`, aggiorna la privacy con il trattamento Google e prova il flusso su due dispositivi. Vedi `CLOUD.md`.
11. **Licenze:** conserva la chiave privata fuori dal repository, distribuisci solo la chiave pubblica e ricorda che la verifica nel browser può essere aggirata. Per una protezione reale serve un controllo lato server.

### Norme da rivalutare quando il prodotto cresce

- **AI Act:** non usiamo AI generativa né decisioni automatizzate. Se aggiungerai funzioni di questo tipo, servirà una valutazione separata.
- **DSA:** non siamo un intermediario online; se ospiterai contenuti di terzi, cambia il quadro.
- **NIS2:** probabilmente non applicabile a un micro-SaaS, ma da verificare se crescono dimensioni e criticità.
- **Cyber Resilience Act:** se il software sarà distribuito come prodotto con elementi digitali, verifica gli obblighi del Reg. UE 2024/2847 e il calendario di applicazione.
- **Dati degli inquilini:** se il servizio conterrà dati inseriti dai clienti, prepara un accordo ex art. 28 GDPR (DPA) e chiarisci che il cliente è titolare e Affitto in Ordine è responsabile.
- **Vendita a consumatori UE:** oltre al Codice del Consumo italiano, considera le tutele inderogabili del Paese di residenza del cliente e gli adempimenti IVA/OSS.

Per la checklist completa e i riferimenti, vedi `COMPLIANCE.md`.

---

## Prima di pubblicare

- [x] Email di contatto impostata su `alelocu09@gmail.com`.
- [x] Privacy, cookie, termini, note legali e accessibilità aggiunti in `legale.html`.
- [x] Checkbox privacy e link all'informativa nel form della landing.
- [x] Demo dichiarata come locale di default, con nomi fittizi; il backup Drive è facoltativo e spento finché non configurato.
- [x] Demo gratuita limitata a 1 immobile; licenza fondatore 39 €/anno con richiesta via email e bonifico SEPA.
- [x] Chiave pubblica della licenza configurata; chiave privata conservata fuori dal repository.
- [ ] Completare tutti i campi `[DA COMPILARE]` in `legale.html` (titolare, sede, P.IVA/CF, PEC, REA, hosting, dominio, tempi di risposta, condizioni di vendita).
- [ ] Far rivedere testi e flussi da un legale o consulente privacy.
- [ ] Rimuovere il meta `noindex` da `legale.html` solo dopo aver completato e verificato i dati legali.
- [ ] Verificare disponibilità di nome e dominio.
- [ ] Scegliere hosting UE e conservare il DPA; aggiornare l'informativa.
- [ ] Se si attiva Google Drive, configurare OAuth, consenso, scope e privacy Google; provare login, revoca, offline e conflitto.
- [x] Configurare la chiave pubblica della licenza e testare token validi, scaduti e manomessi; non commettere la chiave privata.
- [x] Limitare la demo gratuita a 1 immobile e predisporre richiesta licenza, bonifico SEPA e firma manuale del token.
- [ ] Sostituire il form `mailto` con un form che salva i contatti, dopo aver aggiornato privacy e conservazione.
- [ ] Se si aggiungono analytics o marketing, implementare banner di consenso e aggiornare la cookie policy.
- [ ] Fare un audit di accessibilità (tastiera, zoom, screen reader, WCAG 2.1 AA).
- [ ] Controllare che i dati demo siano chiaramente etichettati come finti.
- [ ] Non promettere “risparmio garantito”, “zero sanzioni” o “guadagno garantito”.
- [ ] Non incassare bonifici finché non esistono identità del venditore, condizioni di vendita, recesso, rimborso e ricevute/fatture.
- [ ] Testare la demo su telefono e desktop.
- [ ] Preparare una lista di 50 proprietari/community da contattare.

---

## Prossimo passo

Apri `index.html`, prova la demo e poi fai le prime 3 conversazioni. Se trovi 3 persone disposte a impegnarsi a 39 €/anno, costruiamo account, database ed email. Se non le trovi, abbiamo risparmiato mesi di sviluppo e possiamo cambiare nicchia con dati reali.

Questo è il modo onesto di usare il software per fare soldi: **costruire qualcosa che qualcuno paga**, non simulare ricchezza.

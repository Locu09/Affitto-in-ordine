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
| `demo.html` | Demo interattiva del prodotto: dashboard, immobili, incassi, scadenze, strumenti. |
| `demo.css` / `demo.js` | Stile e logica della demo. I dati demo sono salvati nel browser (localStorage). |
| `motion.css` / `motion.js` | Micro-interazioni condivise: tilt, reveal, riflessi e feedback. |
| `alive.css` / `alive.js` | Livello “vivo”: apertura lunga e saltabile, transizioni tra pagine, forme ambientali, cursore custom, rail delle sezioni, orologio locale e animazioni delle viste demo. |
| `legale.html` | Privacy, cookie, termini d'uso, informazioni sui consumatori, note legali e accessibilità. |
| `legal.css` | Stile delle pagine legali. |
| `COMPLIANCE.md` | Checklist operativa: cosa è coperto, quali dati mancano, cosa fare prima del lancio. |
| `assets/demo-preview.png` | Screenshot desktop usato nella landing. |
| `assets/demo-mobile.png` | Screenshot mobile usato nella landing. |
| `assets/favicon.svg` | Icona del sito, coerente con il marchio. |
| `README.md` | Questo documento: ipotesi, piano di validazione, limiti, prossimi passi. |

### Come aprirlo

Apri `index.html` con doppio clic. Funziona senza server, senza dipendenze e senza connessione (tranne il link email).

- “Prova la demo” porta a `demo.html`.
- Nella demo puoi aggiungere un immobile, segnare un canone come incassato, esportare un CSV, calcolare un aumento ISTAT e generare un promemoria.
- I dati della demo restano nel browser. “Ripristina” riporta i dati di esempio.
- Le informazioni legali sono in `legale.html`: privacy, cookie, termini, consumatori, note legali e accessibilità.

### Pubblicazione gratuita su GitHub Pages

Il sito è statico e non richiede build, database o variabili d'ambiente.

1. Crea un repository **pubblico** su GitHub, per esempio `affitto-in-ordine`.
2. Carica tutti i file nella radice del repository, sul ramo `main`.
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**, ramo `main`, cartella `/ (root)`.
5. Salva e attendi la pubblicazione. L'indirizzo è `https://locu09.github.io/Affitto-in-ordine/`.

Il file `.nojekyll` evita l'elaborazione Jekyll e mantiene le risorse così come sono. La prima pubblicazione richiede account GitHub e repository pubblico; i dati della demo restano nel browser dell'utente.

> **Prima di considerarlo pubblico:** `legale.html` resta `noindex,nofollow` e contiene ancora campi `[DA COMPILARE]`. GitHub Pages è un hosting reale e registra dati tecnici di navigazione: aggiorna l'informativa con fornitore, dominio e tempi effettivi e fai verificare i testi legali prima di promuovere il sito o raccogliere dati reali.

---

## Il prodotto

**Promessa:** “Le scadenze del tuo affitto, sotto controllo.”

Per chi affitta da 1 a 5 immobili e gestisce tutto da solo. Il problema non è la contabilità: è tenere insieme **date, incassi e promemoria** che oggi vivono tra Excel, email, agenda e memoria.

### Cosa fa la demo

- **Panoramica** con immobili, canone mensile, incassato e arretrati.
- **Scadenzario** per fine contratto, registrazioni/annualità e adeguamenti ISTAT.
- **Incassi** degli ultimi 6 mesi, con stato di ogni canone e export CSV.
- **Promemoria pronti** per solleciti, aumenti e scadenze del contratto.
- **Calcolatore ISTAT** con quota 100% o 75%, da verificare sempre con il consulente.
- Dati di esempio realistici e azioni modificabili, per far capire il valore in due minuti.

### Cosa non fa (volutamente)

- Non è un software di contabilità.
- Non è consulenza fiscale o legale.
- Non gestisce affitti brevi, calendari turistici o agenzie con decine di immobili.
- Non invia email automaticamente: nella demo i testi sono pronti da copiare.

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
| Metriche di validazione | 20 interviste, almeno 3 pre-ordini/lettere d'intento a 39 €/anno. |

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

Mostra la demo. Poi chiedi una delle due cose:

- **Pre-ordine fondatore:** 39 €/anno, primi 20 posti, con rimborso se il prodotto non viene lanciato.
- **Lettera d'intento:** “Sono interessato a provare la versione fondatore a 39 €/anno” (senza pagamento).

> **Attenzione:** un pre-ordine con pagamento è una vendita a distanza. Prima di incassare servono condizioni di vendita complete, diritto di recesso, ricevute/fatture, gestione rimborsi e un processore di pagamento con DPA. Se non hai ancora questi elementi, raccogli solo lettere d'intento senza pagamento.

Un “sì, però…” non è un sì. Un “lo comprerei” non è un pre-ordine.

### Giorno 14 — Decisione

| Segnale | Soglia minima |
|---|---|
| Interviste completate | 20 |
| Hanno avuto un problema reale negli ultimi 12 mesi | ≥ 8 |
| Userebbero il prodotto almeno una volta al mese | ≥ 5 |
| Pre-ordini o lettere d'intento a 39 €/anno | ≥ 3 |
| Disponibilità a pagare 79 €/anno dopo la validazione | ≥ 2 |

Se non raggiungi le soglie, non costruire il backend: cambia nicchia, posizionamento o prezzo. Se le raggiungi, costruisci solo ciò che serve ai primi clienti.

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

La demo è volutamente locale. Per vendere davvero servono:

1. **Account e database** (es. Supabase): autenticazione, immobili, contratti, pagamenti.
2. **Email transazionali** (Resend, Postmark): promemoria a data fissa, non spam.
3. **Pagamenti** (Stripe): abbonamento annuale, fattura, gestione rinnovi e disdette.
4. **Privacy e GDPR**: informativa, basi giuridiche, conservazione, export e cancellazione. La base documentale è in `legale.html`; per la produzione servono DPA con i fornitori, registro dei trattamenti, procedura data breach e retention automatizzata.
5. **Backup e sicurezza**: cifratura, log degli accessi, gestione incidenti.
6. **Documenti**: upload di contratti e ricevute, con controllo degli accessi.
7. **Supporto**: email o WhatsApp, con tempi dichiarati.
8. **Termini di servizio** e disclaimer chiaro: non è consulenza fiscale o legale. La bozza è in `legale.html`, ma va completata e verificata prima della vendita.

Non costruire queste cose prima di averle promesse a qualcuno che ha detto “sì”.

---

## Rischi e come ridurli

| Rischio | Mitigazione |
|---|---|
| Mercato affollato di gestionali generici | Posizionamento stretto: 1–5 immobili, semplicità, scadenze, promemoria. |
| Uso raro → abbonamento annuale percepito come caro | Promemoria mensili, incassi, export; prezzo annuale basso. |
| Responsabilità fiscale/legale | Nessuna consulenza; testi modificabili; invito a verificare con il consulente. |
| Dati sensibili | Demo locale; in produzione GDPR, cifratura, backup e policy. |
| Supporto troppo alto per un solo fondatore | FAQ, video, onboarding guidato, limite di immobili. |
| Nome/dominio già usati | Verifica marchio e dominio prima di pubblicare. |

---

## Compliance: cosa è pronto e cosa manca

> **Nessuna certificazione automatica.** “Essere in linea con tutte le normative” non è un interruttore: dipende dai dati reali, dai fornitori, dal Paese di residenza dei clienti e dal modo in cui il servizio viene venduto. Questa è una base operativa, non un parere legale. Prima di pubblicare e prima di incassare soldi, fai rivedere i testi e i flussi da un professionista.

### Cosa è già stato implementato

- **Privacy:** informativa con titolare, dati, finalità, basi giuridiche, destinatari, trasferimenti, conservazione e diritti in `legale.html#privacy`.
- **Cookie:** dichiarazione di assenza di cookie e spiegazione della memoria tecnica (`localStorage` e la chiave temporanea `sessionStorage` per la navigazione) in `legale.html#cookie`. Nessun banner perché non ci sono cookie non tecnici.
- **Termini:** condizioni d'uso della demo e del prototipo in `legale.html#termini`.
- **Consumatori:** informazioni precontrattuali, recesso, garanzia legale e reclami in `legale.html#consumatori`. Oggi non c'è vendita.
- **Note legali:** campi per identità del titolare, P.IVA, PEC, REA e hosting in `legale.html#note-legali`.
- **Accessibilità:** skip link, focus visibile, modale con focus trap, label, contrasto, responsive e dichiarazione in `legale.html#accessibilita`. Le animazioni decorative e le transizioni si spengono con `prefers-reduced-motion: reduce`; il cursore accessorio non sostituisce mai il puntatore di sistema.
- **Trasparenza commerciale:** la landing dice chiaramente che il prodotto è in validazione e che non è possibile pagare; niente testimonianze inventate o guadagni garantiti.
- **Dati demo:** la demo non trasmette dati; i dati demo usano solo `localStorage`, mentre una chiave tecnica temporanea per la navigazione usa `sessionStorage`. I nomi sono fittizi e il footer lo dichiara.

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
4. **Pagamenti:** prima di incassare, aggiungi condizioni di vendita complete, prezzo IVA inclusa, rinnovo, disdetta, ricevute, diritto di recesso e garanzia legale. Usa un processore di pagamento con DPA e non conservare dati di carta.
5. **Analytics:** se usi cookie o identificatori non tecnici, aggiungi un banner con accetta/rifiuta, revoca e registro del consenso. Non usare cookie wall.
6. **Accessibilità:** fai un test con tastiera, zoom 200%, screen reader e un audit WCAG 2.1 AA. L'European Accessibility Act si applica ai servizi di e-commerce coperti: verifica l'ambito prima del lancio.
7. **Sicurezza:** 2FA sugli account, password manager, backup, log, procedura per data breach (notifica al Garante entro 72 ore quando applicabile).
8. **Registro dei trattamenti:** tieni un registro semplice con finalità, categorie di dati, destinatari, trasferimenti e tempi di conservazione.
9. **Marchio e dominio:** verifica “Affitto in Ordine” e il dominio prima di investire in contenuti e ads.

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
- [x] Demo dichiarata come locale, con nomi fittizi e nessun invio di dati.
- [ ] Completare tutti i campi `[DA COMPILARE]` in `legale.html` (titolare, sede, P.IVA/CF, PEC, REA, hosting, dominio, tempi di risposta).
- [ ] Far rivedere testi e flussi da un legale o consulente privacy.
- [ ] Rimuovere il meta `noindex` da `legale.html` solo dopo aver completato e verificato i dati legali.
- [ ] Verificare disponibilità di nome e dominio.
- [ ] Scegliere hosting UE e conservare il DPA; aggiornare l'informativa.
- [ ] Sostituire il form `mailto` con un form che salva i contatti, dopo aver aggiornato privacy e conservazione.
- [ ] Se si aggiungono analytics o marketing, implementare banner di consenso e aggiornare la cookie policy.
- [ ] Fare un audit di accessibilità (tastiera, zoom, screen reader, WCAG 2.1 AA).
- [ ] Controllare che i dati demo siano chiaramente etichettati come finti.
- [ ] Non promettere “risparmio garantito”, “zero sanzioni” o “guadagno garantito”.
- [ ] Non avviare pre-ordini o pagamenti finché non esistono condizioni di vendita, recesso, rimborso e ricevute.
- [ ] Testare la demo su telefono e desktop.
- [ ] Preparare una lista di 50 proprietari/community da contattare.

---

## Prossimo passo

Apri `index.html`, prova la demo e poi fai le prime 3 conversazioni. Se trovi 3 persone disposte a impegnarsi a 39 €/anno, costruiamo account, database ed email. Se non le trovi, abbiamo risparmiato mesi di sviluppo e possiamo cambiare nicchia con dati reali.

Questo è il modo onesto di usare il software per fare soldi: **costruire qualcosa che qualcuno paga**, non simulare ricchezza.

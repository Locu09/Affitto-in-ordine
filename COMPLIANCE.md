# Compliance — Affitto in Ordine

> **Questo documento non è consulenza legale e non certifica la conformità.** È una checklist operativa per rendere il prototipo presentabile e per preparare il lancio. Le norme cambiano, i fornitori cambiano e l'applicazione dipende dal modello di business. Prima di pubblicare e, soprattutto, prima di incassare pagamenti, fai verificare testi, flussi e contratti da un legale o da un consulente privacy.

Ultimo aggiornamento: **23 ottobre 2026**.

---

## 1. Stato attuale

| Area | Stato | Note |
|---|---|---|
| Privacy GDPR | Base pronta | `legale.html#privacy`; mancano dati del titolare, hosting e tempi. |
| Cookie / ePrivacy | Base pronta | Nessun cookie; `localStorage` tecnico della demo. Nessun banner necessario. |
| Termini d'uso | Base pronta | `legale.html#termini`; da rivedere prima della vendita. |
| Informazioni consumatori | Base pronta | `legale.html#consumatori`; oggi non c'è vendita. |
| Note legali / e-commerce | Da completare | Mancano P.IVA, sede, PEC, REA, hosting. |
| Accessibilità | Base pronta | Skip link, focus, modale accessibile; manca audit indipendente. |
| Pratiche commerciali | Base pronta | Nessuna scarsità finta, nessun guadagno garantito. |
| Pagamenti | Non attivi | Nessun checkout, nessun incasso. |
| Account / backend | Non presenti | La demo è locale. |
| AI Act | Non applicabile allo stato attuale | Nessuna AI generativa o decisione automatizzata. Da rivalutare se aggiunta. |
| DSA | Non applicabile allo stato attuale | Non siamo un intermediario online. Da rivalutare se ospitiamo contenuti di terzi. |
| NIS2 | Probabilmente non applicabile | Micro-SaaS; da verificare se crescono dimensioni e criticità. |
| Cyber Resilience Act | Da valutare | Reg. UE 2024/2847; applicabile ai prodotti con elementi digitali secondo calendario e ambito. Un SaaS puro potrebbe essere fuori ambito: verifica prima del lancio. |

---

## 2. Dati da completare prima della pubblicazione

Sostituisci in `legale.html` tutti i campi `[DA COMPILARE]`:

- [ ] Nome e cognome o ragione sociale del titolare.
- [ ] Forma giuridica (persona fisica, ditta individuale, società).
- [ ] Sede legale completa (via, CAP, città, provincia, Paese).
- [ ] P.IVA e codice fiscale.
- [ ] PEC, se disponibile o richiesta.
- [ ] Iscrizione REA, se società.
- [ ] Fornitore di hosting, sede e tempi di conservazione dei log.
- [ ] Dominio effettivo.
- [ ] Tempi di risposta per privacy, accessibilità e reclami.
- [ ] Città del foro per i professionisti.
- [ ] Eventuale DPO, se nominato (non dovrebbe essere necessario per questo trattamento, ma verifica l'art. 37 GDPR).

Se non hai ancora aperto una partita IVA, non presentare il sito come un'attività commerciale attiva. Prima di vendere, verifica gli adempimenti fiscali e previdenziali con un commercialista.

---

## 3. GDPR — mappa dei trattamenti

### 3.1 Registro semplificato

| Trattamento | Dati | Finalità | Base giuridica | Conservazione | Destinatari |
|---|---|---|---|---|---|
| Richieste dalla landing | Nome, email, numero immobili, messaggio | Rispondere alla richiesta e valutare l'accesso fondatore | Art. 6(1)(b) GDPR (misure precontrattuali) | 24 mesi dall'ultimo contatto | Gmail/Google; eventuale form provider |
| Demo locale | Immobili, nomi, canoni, note | Fornire la demo | Non c'è trasmissione al Titolare; trattamento sul dispositivo dell'utente | Fino a reset o cancellazione del browser | Nessuno |
| Futuro contratto | Dati anagrafici, contatti, dati di fatturazione, dati d'uso | Eseguire il servizio | Art. 6(1)(b) | Durata del contratto + 10 anni per obblighi fiscali | Hosting, pagamenti, email, consulenti |
| Sicurezza | Log tecnici, IP | Protezione e diagnostica | Art. 6(1)(f) | Tempi tecnici brevi, da definire | Hosting |
| Marketing futuro | Email | Newsletter/comunicazioni | Art. 6(1)(a), consenso separato | Fino a revoca | Email provider |

### 3.2 Punti aperti

- [ ] Verificare se il form `mailto` basta per la fase di validazione. Se passi a Tally/Formspree/Google Form, aggiungi il fornitore nell'informativa e nel registro.
- [ ] Aggiornare l'informativa quando scegli l'hosting e indica la conservazione dei log.
- [ ] Conservare il DPA/accordo di trattamento con ogni fornitore che tratta dati per tuo conto.
- [ ] Definire una procedura per accesso, rettifica, cancellazione, limitazione, opposizione e portabilità.
- [ ] Definire una procedura per data breach: valutazione, notifica al Garante entro 72 ore quando applicabile, comunicazione agli interessati se necessario.
- [ ] Non inserire dati sanitari, giudiziari o biometrici nella demo né chiedere agli utenti di farlo.
- [ ] Se tratti dati di inquilini per conto dei clienti, chiarisci i ruoli (titolare/contitolare/responsabile) e aggiorna contratti e informativa.
- [ ] Prepara un accordo ex art. 28 GDPR (DPA) per i clienti che inseriranno dati di inquilini: istruzioni, sub-responsabili, misure di sicurezza, assistenza per i diritti, cancellazione/restituzione a fine contratto.
- [ ] Verificare l'età minima (18+) e non raccogliere dati di minori.
- [ ] Se aggiungi profiling o decisioni automatizzate, fai una valutazione separata e aggiorna l'informativa.

### 3.3 Trasferimenti extra-SEE

Gmail può comportare trasferimenti verso gli Stati Uniti. Verifica il meccanismo applicabile:

- decisione di adeguatezza, incluso il **Data Privacy Framework UE-USA**, se il fornitore è certificato;
- in alternativa, **clausole contrattuali standard** con valutazione d'impatto e misure supplementari.

Per la produzione, valuta un provider con data residency UE. Conserva la documentazione del fornitore e aggiorna l'informativa se cambia il meccanismo.

---

## 4. Cookie e memoria locale

### Audit attuale

- Cookie HTTP: **nessuno**.
- Cookie JS: **nessuno**.
- Analytics: **nessuno**.
- Pixel/social plugin: **nessuno**.
- Google Fonts: **nessuno** (font di sistema).
- `localStorage`: usato dalla demo per salvare lo stato. È tecnico e necessario alla funzione richiesta dall'utente.
- `sessionStorage`: usato solo per la chiave temporanea `aio-motion-nav`, che evita di ripetere l'animazione d'ingresso durante una navigazione interna. Non contiene dati personali e viene rimossa alla pagina successiva.
- Banner cookie: **non necessario** finché non introduci cookie o identificatori non tecnici.

### Se aggiungi analytics o marketing

1. Scegli lo strumento e il fornitore.
2. Verifica se usa cookie o identificatori non tecnici.
3. Implementa un banner con **accetta**, **rifiuta** e **revoca**, senza consenso preselezionato e senza cookie wall.
4. Blocca gli script non necessari prima del consenso.
5. Aggiorna la cookie policy con nome, fornitore, finalità, durata e trasferimenti.
6. Conserva la prova del consenso.

---

## 5. Consumatori ed e-commerce

### Oggi

Non c'è vendita, non c'è checkout, non ci sono pagamenti. La landing e i termini lo dicono chiaramente. Questo riduce gli obblighi, ma non elimina quelli su privacy, pubblicità e pratiche commerciali.

### Prima di vendere

- [ ] Identità del venditore, sede, P.IVA, PEC, REA e contatti facilmente accessibili.
- [ ] Informazioni precontrattuali ex art. 49 Codice del Consumo: caratteristiche, prezzo totale IVA inclusa, durata, rinnovo, pagamento, attivazione, assistenza, reclami.
- [ ] Diritto di recesso di 14 giorni e modulo/istruzioni chiare; eccezioni dell'art. 59 applicate solo nei limiti di legge.
- [ ] Garanzia legale di conformità per i servizi digitali (artt. 135-octies e seguenti).
- [ ] Condizioni di rinnovo e disdetta senza ostacoli artificiosi.
- [ ] Ricevute/fatture conformi; verifica fatturazione elettronica e IVA con il commercialista.
- [ ] IVA: per le vendite B2C verso consumatori UE, verifica l'aliquota del Paese del cliente e l'eventuale regime OSS; per le vendite B2B, verifica reverse charge e adempimenti.
- [ ] Procedura reclami e informazioni su ADR, senza imporre arbitrato obbligatorio.
- [ ] Nessuna scarsità finta: i “primi 20 posti” devono corrispondere a un'offerta reale e verificabile.
- [ ] Nessuna testimonianza inventata e nessuna promessa di guadagno.
- [ ] Verifica delle clausole vessatorie nei termini (art. 33 Codice del Consumo): le limitazioni di responsabilità verso i consumatori possono essere nulle.
- [ ] Se vendi a consumatori di altri Paesi UE, verifica le tutele inderogabili del Paese di residenza.

### Pre-ordini

Un pre-ordine con pagamento è una vendita a distanza a tutti gli effetti, anche se il prodotto non è pronto. Prima di incassare:

- definisci cosa viene venduto, quando sarà disponibile e cosa succede se non viene lanciato;
- prevedi rimborso, recesso e comunicazioni chiare;
- usa un processore di pagamento con DPA e non conservare dati di carta;
- emetti ricevuta/fattura secondo la normativa applicabile;
- aggiorna termini e privacy.

Se non vuoi assumerti questi obblighi adesso, raccogli solo lettere d'intento senza pagamento.

---

## 6. Accessibilità

Obiettivo: **WCAG 2.1 AA**, **EN 301 549** e, quando applicabile, **European Accessibility Act** (Direttiva UE 2019/882, D.Lgs. 82/2022).

### Già implementato

- HTML semantico, `lang="it"`, titoli e landmark.
- Skip link.
- Focus visibile su link, pulsanti, campi e summary.
- Modale con focus trap, Esc e ritorno del focus.
- Label e messaggi nativi del form.
- Layout responsive, contrasto curato, `prefers-reduced-motion`.
- Testi alternativi per le immagini.
- Nessun autoplay, nessun contenuto lampeggiante.

### Da fare

- [ ] Test completo da tastiera su landing e demo.
- [ ] Test con zoom 200% e larghezza 320 px.
- [ ] Test con screen reader (NVDA su Windows, VoiceOver su macOS/iOS).
- [ ] Verifica del contrasto con uno strumento dedicato.
- [ ] Audit WCAG 2.1 AA e correzione dei risultati.
- [ ] Dichiarazione di accessibilità aggiornata con limiti noti e tempi di risposta.
- [ ] Verifica dell'ambito EAA prima del lancio.

---

## 7. Sicurezza e continuità

- [ ] Password manager e password uniche per email, hosting, dominio, pagamenti.
- [ ] Autenticazione a due fattori su tutti gli account amministrativi.
- [ ] Backup automatici e test di ripristino per la futura versione con database.
- [ ] Cifratura in transito (HTTPS) e a riposo per i dati dei clienti.
- [ ] Log degli accessi e principio del minimo privilegio.
- [ ] Procedura di gestione degli incidenti e data breach.
- [ ] Aggiornamenti di sicurezza e dipendenze.
- [ ] Nessun dato reale nella demo pubblica.

---

## 8. Ordine di priorità

### P0 — prima di pubblicare la landing

1. Completa i dati del titolare e dell'hosting in `legale.html`.
2. Fai una revisione legale dei testi.
3. Verifica che non ci siano pagamenti o promesse di guadagno.
4. Testa il sito su desktop e mobile.

### P1 — prima di raccogliere contatti su larga scala

1. Scegli un form provider con DPA e aggiorna privacy.
2. Scegli hosting UE e aggiorna privacy.
3. Imposta una procedura per i diritti GDPR.
4. Se aggiungi analytics, implementa il consenso.

### P2 — prima di vendere

1. Condizioni di vendita complete, recesso, garanzia e reclami.
2. Pagamenti, fatturazione e rimborsi.
3. Account, database, backup e sicurezza.
4. Audit di accessibilità.
5. Registro dei trattamenti e DPA di tutti i fornitori.

---

## 9. Riferimenti utili

- Regolamento (UE) 2016/679 (GDPR).
- D.Lgs. 196/2003 e D.Lgs. 101/2018 (Codice privacy italiano).
- Direttiva 2002/58/CE (ePrivacy) e linee guida del Garante sui cookie.
- D.Lgs. 206/2005 (Codice del Consumo), in particolare artt. 20–23, 33, 49, 52–59, 66-bis, 135-octies e seguenti.
- D.Lgs. 70/2003 (commercio elettronico), art. 7.
- Direttiva (UE) 2019/882 e D.Lgs. 82/2022 (accessibilità).
- Regolamento (UE) 2022/2065 (DSA), da valutare solo se cambia il modello.
- Direttiva (UE) 2022/2555 (NIS2), da valutare solo se crescono dimensioni e criticità.
- Regolamento (UE) 2024/2847 (Cyber Resilience Act), da valutare se il software sarà distribuito come prodotto con elementi digitali.
- Regolamento (UE) 2024/1689 (AI Act), da valutare solo se aggiungi AI.

---

## 10. Nota finale

“Tutte le normative” non è un traguardo permanente. La conformità va mantenuta: cambiano i fornitori, i clienti, i Paesi di vendita e le norme. Questo repository contiene una base ragionevole per un prototipo onesto; non contiene una garanzia legale. Prima di rischiare soldi o dati altrui, chiedi a un professionista.

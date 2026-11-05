/*
  Configurazione pubblica dell'integrazione facoltativa con Google Drive.
  Non inserire segreti, chiavi private o dati personali in questo file:
  tutto ciò che è qui viene servito pubblicamente.

  Per attivare il collegamento:
  1. crea un client OAuth di tipo "Web application" in Google Cloud;
  2. abilita Google Drive API;
  3. aggiungi l'origine del sito (per esempio https://example.github.io)
     tra le origini JavaScript autorizzate;
  4. incolla il client ID qui sotto;
  5. configura una chiave pubblica per le licenze firmate.

  Lo scope richiesto dal codice è:
  https://www.googleapis.com/auth/drive.appdata
  Consente di leggere e scrivere solo nella cartella privata dei dati
  dell'app, non nel resto del Drive.
*/
window.AIO_CLOUD_CONFIG = {
  googleClientId: '',
  googleApiKey: '',

  driveFileName: 'config_immobili.json',
  appId: 'affitto-in-ordine',
  licenseProduct: 'affitto-in-ordine',

  // Chiave pubblica ECDSA P-256 in formato SPKI base64url o PEM.
  // La chiave privata deve restare fuori dal repository.
  // Se compili solo questa chiave, il riquadro licenza appare anche senza
  // client ID Google; il collegamento Drive resta disabilitato.
  licensePublicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXGPjPVqfOMG-zdu_3SwpbpwL1E9rvs5ex-hKe6I0tzw1yKt2lYPEoEYLLF0jk2VBxaXy4bcKZK-aKur4mF0LXA',

  // Chiavi localStorage incluse nel file di sincronizzazione.
  syncKeys: ['affitto-in-ordine-demo-v1'],

  // La sincronizzazione automatica è la funzione premium.
  // Con false anche gli utenti senza licenza sincronizzano a ogni modifica.
  autoSyncPremiumOnly: true,

  // Se false, il riquadro Drive resta nascosto finché non viene impostato
  // un client ID. Utile per non mostrare una funzione non configurata.
  showWhenUnconfigured: false,

  // Attivazione manuale della licenza fondatore.
  // Il sito non ha un checkout: il pulsante apre un'email e il pagamento
  // viene concordato via bonifico SEPA. Non inserire qui l'IBAN.
  purchase: {
    enabled: true,
    priceLabel: '39 €/anno fondatore',
    offerLabel: 'Primi 20 clienti · fino a 5 immobili',
    paymentLabel: 'Bonifico SEPA',
    requestEmail: 'alelocu09@gmail.com',
    requestSubject: 'Licenza fondatore Affitto in Ordine',
    note: 'La richiesta non è un ordine: ricevi conferma, coordinate bancarie e condizioni via email. Nessun rinnovo automatico.'
  }
};

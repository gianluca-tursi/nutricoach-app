# Changelog

Tutte le modifiche notevoli a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- File CHANGELOG.md per tracciare le modifiche
- MobileOptimizer per ottimizzazioni specifiche mobile
- Classi CSS ottimizzate per dispositivi a bassa performance
- Configurazioni animazioni adattive per mobile
- Nuova pagina Ricette con gestione completa
- Tabella recipes nel database con RLS
- Link "Archivio Pasti" nella pagina Progressi
- Menu bottom aggiornato con "Ricette" invece di "Archivio"

### Changed
- Nome app da "NutriCoach" a "Lumari"
- URL di condivisione WhatsApp aggiornato a https://lumariai.netlify.app
- Ottimizzazioni performance mobile per animazioni e transizioni
- Durate animazioni ridotte su mobile (200-250ms vs 300-400ms)
- Disabilitazione animazioni complesse su dispositivi lenti
- Riduzione complessità gradienti e backdrop-filter su mobile
- Menu bottom: "Archivio" → "Ricette"

### Fixed
- Deploy corretto su progetto lumariai.netlify.app
- Configurazione variabili d'ambiente su Netlify
- Landing page statica senza dipendenze auth
- Performance animazioni su dispositivi mobile
- Transizioni fluide su dispositivi a bassa performance

## [1.0.0] - 2025-01-15

### Added
- 🆕 **Analisi Frigo con AI**: Identifica ingredienti dal frigo tramite foto
- 🆕 **Generazione Ricette**: Crea ricette personalizzate basate su ingredienti disponibili
- 🆕 **Matching Intelligente**: Sistema di matching ricette-ingredienti con normalizzazione plurali
- 🆕 **FridgeAnalyzer Component**: Interfaccia completa per analisi del frigo
- 🆕 **RecipeGenerator Component**: Generatore di ricette con preferenze utente
- 🆕 **recipeMatcher Library**: Logica avanzata per matching ingredienti
- 🆕 **Controllo WhatsApp Quiz**: Verifica condivisione prima di completare onboarding
- 🆕 **Calcoli Progress Reali**: Streak e goal progress basati su dati reali
- 🆕 **Debug Completo**: Logging dettagliato per troubleshooting
- 🆕 **Gestione Errori Robusta**: Fallback per analisi AI e parsing JSON
- Landing page statica e indipendente
- Sistema di autenticazione ottimizzato
- Caricamento profilo migliorato
- Deploy automatico su Netlify
- Integrazione Git per CI/CD
- PWA install prompt
- Quiz pre-fill per utenti esistenti
- Quick foods con icona delete
- Sistema di calcolo nutrizionale avanzato
- Animazioni ottimizzate
- Performance optimizations

### Changed
- 📝 **Testi Quiz Aggiornati**: "Invita almeno 3 amici su WhatsApp"
- 📝 **Messaggi Dinamici**: Feedback personalizzato dopo condivisione WhatsApp
- 📝 **UI/UX Migliorata**: Pulsanti dinamici e stati visivi
- 📝 **Normalizzazione Ingredienti**: Gestione plurali (carciofi → carciofo)
- 📝 **Ottimizzazioni Mobile**: Rimozione decimali da valori nutrizionali
- Routing semplificato
- Gestione stato profilo migliorata
- Logica profileReady corretta

### Fixed
- 🔧 **Matching Ingredienti**: Corretto problema carciofi non riconosciuti
- 🔧 **Formato Risposta AI**: Gestione errori JSON malformato
- 🔧 **Posizionamento Modal**: Corretto posizionamento su mobile
- 🔧 **Checkbox Visual State**: Corretto stato visivo preferenze
- 🔧 **Progress Bar Reale**: Calcoli basati su dati utente invece di valori hardcoded
- 🔧 **Streak Calculation**: Calcolo giorni consecutivi reale
- Errori "user is not defined" nella landing
- Caricamento infinito dopo refresh
- Redirect automatici al quiz
- Errori constraint database
- Icone lucide-react mancanti
- Animazioni Framer Motion

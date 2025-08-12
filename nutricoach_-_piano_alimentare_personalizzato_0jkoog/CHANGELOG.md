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

### Changed
- Nome app da "NutriCoach" a "Lumari"
- URL di condivisione WhatsApp aggiornato a https://lumariai.netlify.app
- Ottimizzazioni performance mobile per animazioni e transizioni
- Durate animazioni ridotte su mobile (200-250ms vs 300-400ms)
- Disabilitazione animazioni complesse su dispositivi lenti
- Riduzione complessità gradienti e backdrop-filter su mobile

### Fixed
- Deploy corretto su progetto lumariai.netlify.app
- Configurazione variabili d'ambiente su Netlify
- Landing page statica senza dipendenze auth
- Performance animazioni su dispositivi mobile
- Transizioni fluide su dispositivi a bassa performance

## [1.0.0] - 2025-08-12

### Added
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
- Routing semplificato
- Gestione stato profilo migliorata
- Logica profileReady corretta

### Fixed
- Errori "user is not defined" nella landing
- Caricamento infinito dopo refresh
- Redirect automatici al quiz
- Errori constraint database
- Icone lucide-react mancanti
- Animazioni Framer Motion

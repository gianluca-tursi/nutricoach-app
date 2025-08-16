# 🚀 Deploy NutriCoach su Netlify

Questa guida ti aiuterà a deployare l'applicazione NutriCoach su Netlify con tutte le ottimizzazioni di performance.

## 📋 Prerequisiti

1. **Account Netlify**: Crea un account su [netlify.com](https://netlify.com)
2. **Repository Git**: Assicurati che il progetto sia su GitHub, GitLab o Bitbucket
3. **Variabili d'ambiente**: Prepara le chiavi API necessarie

## 🔧 Configurazione Variabili d'Ambiente

Prima del deploy, devi configurare le seguenti variabili d'ambiente su Netlify:

### Variabili Richieste

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

### Come Configurarle

1. Vai su [Netlify Dashboard](https://app.netlify.com)
2. Seleziona il tuo sito
3. Vai su **Site settings** → **Environment variables**
4. Aggiungi ogni variabile con il suo valore

## 🚀 Deploy Automatico

### Opzione 1: Deploy da Git (Raccomandato)

1. **Connetti il Repository**:
   - Vai su [Netlify Dashboard](https://app.netlify.com)
   - Clicca **"New site from Git"**
   - Seleziona il tuo provider Git (GitHub, GitLab, Bitbucket)
   - Autorizza Netlify ad accedere al repository

2. **Configura il Build**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (o superiore)

3. **Configura le Variabili d'Ambiente**:
   - Aggiungi le variabili d'ambiente come descritto sopra

4. **Deploy**:
   - Clicca **"Deploy site"**
   - Netlify farà il build e deploy automaticamente

### Opzione 2: Deploy Manuale

1. **Build Locale**:
   ```bash
   npm run build
   ```

2. **Upload su Netlify**:
   - Vai su [Netlify Drop](https://app.netlify.com/drop)
   - Trascina la cartella `dist` generata
   - Il sito sarà disponibile immediatamente

## ⚙️ Configurazione Avanzata

### Headers di Sicurezza

Il file `netlify.toml` include già headers di sicurezza ottimizzati:

- **X-Frame-Options**: Previene clickjacking
- **X-XSS-Protection**: Protezione XSS
- **X-Content-Type-Options**: Previene MIME sniffing
- **Referrer-Policy**: Controllo referrer
- **Permissions-Policy**: Controllo permessi

### Cache Strategy

Configurato per massimizzare le performance:

- **JS/CSS**: Cache per 1 anno (immutable)
- **Immagini**: Cache per 1 anno (immutable)
- **Service Worker**: No cache (sempre aggiornato)
- **Manifest**: Content-Type corretto

### Redirects

Configurato per SPA (Single Page Application):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔍 Verifica del Deploy

### Controlli Post-Deploy

1. **Performance**:
   - Usa [Lighthouse](https://developers.google.com/web/tools/lighthouse)
   - Verifica Core Web Vitals
   - Controlla il First Contentful Paint

2. **Funzionalità**:
   - Testa l'autenticazione
   - Verifica il caricamento delle pagine
   - Controlla il service worker

3. **SEO**:
   - Verifica il manifest
   - Controlla i meta tags
   - Testa la PWA

### Metriche di Performance Attese

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🛠️ Troubleshooting

### Problemi Comuni

1. **Build Fallisce**:
   - Verifica le variabili d'ambiente
   - Controlla i log di build su Netlify
   - Assicurati che Node.js sia versione 18+

2. **App Non Funziona**:
   - Verifica le chiavi API
   - Controlla la console del browser
   - Verifica i CORS settings su Supabase

3. **Performance Scarse**:
   - Verifica il bundle size
   - Controlla le ottimizzazioni Vite
   - Analizza con Lighthouse

### Log di Debug

Per abilitare i log di debug in produzione:

```typescript
// In src/lib/production.ts
export const isDevelopment = true; // Temporaneamente
```

## 🔄 Aggiornamenti

### Deploy Automatico

Con il deploy da Git, ogni push al branch principale triggererà automaticamente un nuovo deploy.

### Deploy Manuale

Per deploy manuali:

```bash
# Build
npm run build

# Deploy (se usi Netlify CLI)
netlify deploy --prod --dir=dist
```

## 📊 Monitoraggio

### Netlify Analytics

- **Page Views**: Monitora il traffico
- **Performance**: Analizza i tempi di caricamento
- **Errors**: Controlla gli errori 404/500

### Performance Monitoring

L'app include monitoring automatico:

- **Bundle Size**: Monitorato automaticamente
- **Load Times**: Misurati con Performance API
- **Memory Usage**: Tracciato in development

## 🎯 Best Practices

1. **Sempre testa in preview** prima del deploy in produzione
2. **Monitora le performance** regolarmente
3. **Aggiorna le dipendenze** periodicamente
4. **Backup delle variabili d'ambiente**
5. **Documenta le modifiche** importanti

---

*Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}*

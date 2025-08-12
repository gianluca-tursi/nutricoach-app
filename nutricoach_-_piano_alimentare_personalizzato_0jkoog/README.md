# 🥗 NutriCoach - Piano Alimentare Personalizzato

<div align="center">

![NutriCoach Logo](https://img.shields.io/badge/NutriCoach-Piano%20Alimentare%20AI-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-orange)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT%204-purple)
![Netlify](https://img.shields.io/badge/Netlify-Deploy-blue)

**Il tuo assistente personale per un piano alimentare su misura con l'intelligenza artificiale**

[🌐 Live Demo](https://nutricoahc.netlify.app) • [📖 Documentazione](#-documentazione) • [🚀 Deploy](#-deploy)

</div>

---

## 📖 Introduzione

**NutriCoach** è un'applicazione web moderna che combina l'intelligenza artificiale con la nutrizione personalizzata per aiutarti a raggiungere i tuoi obiettivi di salute e benessere.

### 🎯 Scopo Principale

L'applicazione nasce dall'esigenza di fornire un piano alimentare veramente personalizzato che tenga conto di:
- **Obiettivi individuali** (perdita peso, aumento massa, mantenimento)
- **Preferenze alimentari** e restrizioni dietetiche
- **Stile di vita** e livello di attività fisica
- **Condizioni di salute** specifiche
- **Analisi automatica** delle foto dei pasti tramite AI

### 🧠 Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: Tailwind CSS + Radix UI + Framer Motion
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 per analisi foto e raccomandazioni
- **Deploy**: Netlify con ottimizzazioni performance
- **State Management**: Zustand
- **Autenticazione**: Supabase Auth

---

## 🚀 Funzionalità Principali

### 1. 📱 **Dashboard Intelligente**
- **Panoramica giornaliera** di calorie, proteine, carboidrati e grassi
- **Progressi in tempo reale** verso gli obiettivi
- **Raccomandazioni personalizzate** basate sui dati
- **Grafici interattivi** per monitorare i progressi

### 2. 📸 **Analisi Foto con AI**
- **Scatta una foto** del tuo pasto
- **Analisi automatica** con OpenAI GPT-4 Vision
- **Identificazione automatica** di ingredienti e porzioni
- **Calcolo automatico** dei valori nutrizionali
- **Suggerimenti intelligenti** per migliorare il pasto

### 3. 🎯 **Piano Alimentare Personalizzato**
- **Calcolo automatico** delle calorie giornaliere
- **Distribuzione ottimale** di macronutrienti
- **Raccomandazioni** basate su obiettivi e preferenze
- **Adattamento dinamico** in base ai progressi

### 4. 📊 **Tracking Completo**
- **Registro pasti** con ricerca e filtri
- **Storico dettagliato** con grafici temporali
- **Analisi delle tendenze** e pattern alimentari
- **Esportazione dati** per analisi esterne

### 5. 🎨 **Onboarding Personalizzato**
- **Questionario dettagliato** per profilo utente
- **Raccolta preferenze** alimentari e restrizioni
- **Definizione obiettivi** specifici e realistici
- **Calcolo automatico** del piano iniziale

### 6. 🔐 **Sistema di Autenticazione**
- **Registrazione/Login** sicuro con Supabase
- **Profilo utente** completo e personalizzabile
- **Sincronizzazione** dati su tutti i dispositivi
- **Backup automatico** dei dati

---

## 🏗️ Architettura dell'Applicazione

### 📁 Struttura del Progetto

```
nutricoach/
├── src/
│   ├── components/          # Componenti riutilizzabili
│   │   ├── ui/             # Componenti UI base (Radix)
│   │   ├── Layout.tsx      # Layout principale
│   │   ├── PhotoAnalyzer.tsx # Analisi foto con AI
│   │   └── SwipeableMealItem.tsx # Gestione pasti
│   ├── pages/              # Pagine dell'applicazione
│   │   ├── Dashboard.tsx   # Dashboard principale
│   │   ├── MealTracker.tsx # Tracciamento pasti
│   │   ├── Progress.tsx    # Monitoraggio progressi
│   │   └── Onboarding.tsx  # Setup iniziale
│   ├── stores/             # Gestione stato (Zustand)
│   │   ├── authStore.ts    # Autenticazione
│   │   └── profileStore.ts # Profilo utente
│   ├── lib/                # Utility e configurazioni
│   │   ├── supabase.ts     # Configurazione database
│   │   ├── openai.ts       # Configurazione AI
│   │   └── performance.ts  # Ottimizzazioni
│   └── hooks/              # Hook personalizzati
└── supabase/               # Migrazioni database
```

### 🔄 Flusso di Dati

1. **Autenticazione** → Supabase Auth
2. **Profilo Utente** → Database PostgreSQL
3. **Analisi Foto** → OpenAI API → Database
4. **Raccomandazioni** → AI + Dati utente → UI
5. **Tracking** → Database → Grafici e statistiche

---

## 🎯 Come Funziona

### 1. **Registrazione e Onboarding**
```
Utente → Registrazione → Questionario → Profilo → Piano Iniziale
```

1. L'utente si registra con email e password
2. Compila un questionario dettagliato su:
   - Obiettivi (perdita peso, aumento massa, mantenimento)
   - Preferenze alimentari (vegetariano, vegano, etc.)
   - Restrizioni dietetiche (allergie, intolleranze)
   - Stile di vita e attività fisica
   - Condizioni di salute

3. Il sistema calcola automaticamente:
   - Calorie giornaliere necessarie
   - Distribuzione ottimale di macronutrienti
   - Piano alimentare personalizzato

### 2. **Dashboard Principale**
```
Dati Utente + AI → Dashboard → Raccomandazioni + Progressi
```

- **Panoramica giornaliera**: calorie consumate vs obiettivo
- **Macronutrienti**: proteine, carboidrati, grassi
- **Progressi**: grafici e statistiche
- **Raccomandazioni**: suggerimenti personalizzati

### 3. **Analisi Foto con AI**
```
Foto Pasto → OpenAI GPT-4 → Analisi → Database → Dashboard
```

1. L'utente scatta una foto del pasto
2. L'immagine viene inviata a OpenAI GPT-4 Vision
3. L'AI analizza e identifica:
   - Ingredienti presenti
   - Porzioni approssimative
   - Metodi di cottura
4. Calcola automaticamente i valori nutrizionali
5. Salva nel database e aggiorna la dashboard

### 4. **Tracking e Monitoraggio**
```
Dati Pasti → Database → Analisi → Grafici → Insights
```

- **Registro pasti**: cronologia completa
- **Analisi temporali**: trend e pattern
- **Statistiche**: medie, variazioni, obiettivi
- **Esportazione**: dati per analisi esterne

---

## 🧠 Intelligenza Artificiale

### **OpenAI GPT-4 Integration**

L'applicazione utilizza OpenAI GPT-4 per:

1. **Analisi Visiva dei Pasti**
   - Identificazione ingredienti
   - Stima porzioni
   - Calcolo valori nutrizionali
   - Suggerimenti di miglioramento

2. **Raccomandazioni Personalizzate**
   - Suggerimenti pasti
   - Alternative salutari
   - Adattamento piano alimentare
   - Motivazione e supporto

3. **Analisi Pattern Alimentari**
   - Identificazione abitudini
   - Suggerimenti ottimizzazione
   - Previsioni e trend

### **Esempio di Analisi AI**

```typescript
// Analisi di una foto di pasta al pomodoro
const analysis = await openai.analyzeImage({
  image: mealPhoto,
  prompt: "Analizza questo pasto e fornisci: ingredienti, porzioni, valori nutrizionali"
});

// Risultato:
{
  ingredients: ["pasta", "pomodoro", "basilico", "olio d'oliva"],
  portions: { pasta: "80g", sauce: "100g" },
  nutrition: {
    calories: 320,
    proteins: 12,
    carbs: 58,
    fats: 8
  },
  suggestions: ["Aggiungi proteine magre", "Considera pasta integrale"]
}
```

---

## 📊 Database Schema

### **Tabelle Principali**

```sql
-- Profili utente
profiles (
  id, email, full_name, age, gender, height, weight,
  target_weight, activity_level, goal, dietary_restrictions,
  daily_calories, daily_proteins, daily_carbs, daily_fats
)

-- Pasti registrati
meals (
  id, user_id, name, meal_type, calories, proteins, carbs, fats,
  consumed_at, photo_url, ai_analysis
)

-- Obiettivi giornalieri
daily_goals (
  id, user_id, date, target_calories, consumed_calories,
  target_proteins, consumed_proteins, water_intake, steps
)

-- Log peso
weight_logs (
  id, user_id, weight, logged_at
)
```

---

## 🚀 Performance e Ottimizzazioni

### **Ottimizzazioni Implementate**

1. **Code Splitting**
   - Lazy loading delle pagine
   - Bundle ottimizzato per produzione
   - Caricamento on-demand dei componenti

2. **Caching Intelligente**
   - Cache locale per sessioni
   - Memoization per query costose
   - Service worker per offline support

3. **Ottimizzazioni React**
   - React.memo per componenti
   - useMemo e useCallback
   - Virtualizzazione liste lunghe

4. **Network Optimization**
   - DNS prefetch per API esterne
   - Compressione gzip
   - CDN per asset statici

### **Metriche di Performance**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Bundle Size**: ~1.2MB (gzipped)
- **Time to Interactive**: < 2.8s

---

## 🔒 Sicurezza e Privacy

### **Protezioni Implementate**

1. **Autenticazione Sicura**
   - Supabase Auth con JWT
   - Password hashing
   - Session management

2. **Protezione Dati**
   - Row Level Security (RLS)
   - Validazione input
   - Sanitizzazione dati

3. **API Security**
   - Rate limiting
   - CORS configuration
   - Input validation

4. **Privacy**
   - Dati utente isolati
   - GDPR compliance
   - Controllo accessi

---

## 📱 Responsive Design

### **Supporto Dispositivi**

- **Desktop**: Layout completo con sidebar
- **Tablet**: Layout adattivo con navigazione ottimizzata
- **Mobile**: Design mobile-first con gesture support
- **PWA**: Installabile come app nativa

### **Accessibilità**

- **Screen Reader**: Supporto completo
- **Keyboard Navigation**: Navigazione da tastiera
- **High Contrast**: Modalità ad alto contrasto
- **Reduced Motion**: Supporto per utenti sensibili

---

## 🛠️ Sviluppo e Deploy

### **Setup Locale**

```bash
# Clona il repository
git clone [repository-url]
cd nutricoach

# Installa dipendenze
npm install

# Configura variabili d'ambiente
cp .env.example .env
# Aggiungi le tue chiavi API

# Avvia server di sviluppo
npm run dev
```

### **Deploy su Netlify**

```bash
# Build per produzione
npm run build

# Deploy
npm run deploy
```

### **Variabili d'Ambiente**

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
VITE_OPENAI_API_KEY=your-openai-key
```

---

## 📈 Roadmap Futura

### **Funzionalità Pianificate**

1. **Integrazione Wearable**
   - Connessione con Apple Watch/Fitbit
   - Sincronizzazione attività fisica
   - Calcolo automatico calorie bruciate

2. **Social Features**
   - Condivisione progressi
   - Community di supporto
   - Challenge e competizioni

3. **AI Avanzata**
   - Raccomandazioni vocali
   - Chatbot nutrizionale
   - Analisi predittiva

4. **Integrazione App**
   - App mobile nativa
   - Notifiche push
   - Sincronizzazione cross-device

---

## 🤝 Contribuire

### **Come Contribuire**

1. **Fork** il repository
2. **Crea** un branch per la feature
3. **Commit** le modifiche
4. **Push** al branch
5. **Crea** una Pull Request

### **Guidelines**

- Segui le convenzioni di codice
- Aggiungi test per nuove funzionalità
- Documenta le modifiche
- Mantieni la performance

---

## 📞 Supporto

### **Risorse Utili**

- [📖 Documentazione Completa](./PERFORMANCE_OPTIMIZATIONS.md)
- [🔧 Setup Ambiente](./ENVIRONMENT_SETUP.md)
- [🚀 Guida Deploy](./DEPLOY.md)
- [📸 Setup Analisi Foto](./PHOTO_ANALYSIS_SETUP.md)

### **Contatti**

- **Issues**: [GitHub Issues](link-to-issues)
- **Documentazione**: [Wiki](link-to-wiki)
- **Community**: [Discord](link-to-discord)

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

---

<div align="center">

**NutriCoach** - Trasforma la tua alimentazione con l'intelligenza artificiale 🧠🥗

*Sviluppato con ❤️ per aiutarti a raggiungere i tuoi obiettivi di salute*

</div>
# Deploy test - Tue Aug 12 18:57:57 CEST 2025
# Deploy test lumariai - Tue Aug 12 18:59:16 CEST 2025

# 🔧 Configurazione Variabili d'Ambiente - NutriCoach

Questa guida ti aiuterà a configurare le variabili d'ambiente necessarie per far funzionare NutriCoach su Netlify.

## 🚨 Errore Risolto

L'errore `Failed to construct 'URL': Invalid URL` è stato risolto implementando:
- ✅ Validazione URL per Supabase
- ✅ Gestione robusta degli errori
- ✅ Fallback quando le variabili non sono configurate
- ✅ Messaggi di errore chiari e informativi

## 📋 Variabili d'Ambiente Richieste

### 1. **VITE_SUPABASE_URL**
- **Descrizione**: URL del progetto Supabase
- **Formato**: `https://your-project-id.supabase.co`
- **Esempio**: `https://abcdefghijklmnop.supabase.co`

### 2. **VITE_SUPABASE_ANON_KEY**
- **Descrizione**: Chiave anonima pubblica di Supabase
- **Formato**: Stringa alfanumerica lunga
- **Esempio**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. **VITE_OPENAI_API_KEY**
- **Descrizione**: Chiave API di OpenAI per l'analisi delle foto
- **Formato**: Stringa alfanumerica
- **Esempio**: `sk-1234567890abcdef...`

## 🔧 Come Configurare su Netlify

### Passo 1: Accedi a Netlify
1. Vai su [app.netlify.com](https://app.netlify.com)
2. Accedi al tuo account
3. Seleziona il sito `nutricoahc`

### Passo 2: Vai alle Variabili d'Ambiente
1. Clicca su **Site settings**
2. Nella barra laterale, clicca su **Environment variables**
3. Clicca su **Add a variable**

### Passo 3: Aggiungi le Variabili
Aggiungi una variabile alla volta:

#### Variabile 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://your-project-id.supabase.co`
- **Scopes**: `Production` e `Deploy preview`

#### Variabile 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Scopes**: `Production` e `Deploy preview`

#### Variabile 3: VITE_OPENAI_API_KEY
- **Key**: `VITE_OPENAI_API_KEY`
- **Value**: `sk-1234567890abcdef...`
- **Scopes**: `Production` e `Deploy preview`

### Passo 4: Salva e Riavvia
1. Clicca **Save** per ogni variabile
2. Vai su **Deploys**
3. Clicca **Trigger deploy** → **Deploy site**

## 🗄️ Come Ottenere le Credenziali

### Supabase Setup

1. **Crea un Progetto**:
   - Vai su [supabase.com](https://supabase.com)
   - Clicca **New Project**
   - Scegli un nome (es. "nutricoach")
   - Scegli una password per il database
   - Seleziona una regione (es. West Europe)

2. **Ottieni le Credenziali**:
   - Vai su **Settings** → **API**
   - Copia **Project URL** (VITE_SUPABASE_URL)
   - Copia **anon public** (VITE_SUPABASE_ANON_KEY)

3. **Configura il Database**:
   - Vai su **SQL Editor**
   - Esegui le migrazioni da `supabase/migrations/`

### OpenAI Setup

1. **Crea un Account**:
   - Vai su [platform.openai.com](https://platform.openai.com)
   - Registrati o accedi
   - Aggiungi un metodo di pagamento

2. **Genera API Key**:
   - Vai su **API Keys**
   - Clicca **Create new secret key**
   - Copia la chiave generata

## 🔍 Verifica della Configurazione

### Test Locale
```bash
# Crea file .env locale
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env
echo "VITE_OPENAI_API_KEY=your-openai-key" >> .env

# Avvia il server
npm run dev
```

### Test su Netlify
1. Dopo aver configurato le variabili
2. Vai su **Deploys** → **Trigger deploy**
3. Aspetta che il deploy sia completato
4. Visita il sito e verifica che non ci siano errori

## 🛠️ Troubleshooting

### Errore: "Supabase non è configurato"
- ✅ Verifica che le variabili siano state salvate
- ✅ Controlla che i nomi delle variabili siano esatti
- ✅ Assicurati che i valori non abbiano spazi extra

### Errore: "Invalid URL"
- ✅ Verifica che l'URL di Supabase sia completo
- ✅ Assicurati che inizi con `https://`
- ✅ Controlla che non ci siano caratteri extra

### Errore: "Unauthorized"
- ✅ Verifica che la chiave anonima sia corretta
- ✅ Controlla che il progetto Supabase sia attivo
- ✅ Assicurati che le policy RLS siano configurate

### Errore: "OpenAI API Error"
- ✅ Verifica che la chiave API sia valida
- ✅ Controlla che l'account OpenAI abbia crediti
- ✅ Assicurati che la chiave abbia i permessi corretti

## 📊 Monitoraggio

### Log di Netlify
- Vai su **Functions** → **Function logs**
- Controlla gli errori nelle chiamate API

### Console del Browser
- Apri gli strumenti di sviluppo (F12)
- Vai su **Console**
- Cerca messaggi di errore o warning

### Supabase Dashboard
- Vai su **Logs** → **API**
- Controlla le richieste e gli errori

## 🔒 Sicurezza

### Best Practices
- ✅ Non committare mai le chiavi API nel codice
- ✅ Usa sempre variabili d'ambiente
- ✅ Ruota periodicamente le chiavi API
- ✅ Monitora l'uso delle API

### Variabili Sensibili
- Le variabili con prefisso `VITE_` sono visibili nel browser
- Questo è normale per le chiavi pubbliche di Supabase
- La chiave OpenAI è sicura perché usata solo lato server

## 📞 Supporto

Se hai problemi con la configurazione:

1. **Controlla i Log**: Verifica i log di Netlify e Supabase
2. **Test Locale**: Prova prima in locale con `.env`
3. **Documentazione**: Consulta la documentazione di Supabase e OpenAI
4. **Community**: Chiedi aiuto nella community di Netlify

---

*Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}*

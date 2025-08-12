# 📚 Documentazione Tecnica - NutriCoach

Documentazione tecnica completa per sviluppatori che vogliono comprendere, contribuire o estendere l'applicazione NutriCoach.

## 🏗️ Architettura del Sistema

### **Stack Tecnologico**

```
Frontend (React + TypeScript)
├── UI Framework: Tailwind CSS + Radix UI
├── State Management: Zustand
├── Routing: React Router DOM
├── Animations: Framer Motion
└── Build Tool: Vite

Backend (Supabase)
├── Database: PostgreSQL
├── Authentication: Supabase Auth
├── Real-time: Supabase Realtime
└── Storage: Supabase Storage

AI Services (OpenAI)
├── Vision Analysis: GPT-4 Vision
├── Text Generation: GPT-4
└── Embeddings: OpenAI Embeddings

Deployment (Netlify)
├── CDN: Netlify CDN
├── Functions: Netlify Functions
└── Edge: Netlify Edge
```

### **Diagramma Architetturale**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Supabase      │    │   OpenAI API    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Auth      │◄┼────┼►│ PostgreSQL  │ │    │ │ GPT-4       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ Vision      │ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ └─────────────┘ │
│ │   State     │◄┼────┼►│   Auth      │ │    │ ┌─────────────┐ │
│ │ Management  │ │    │ └─────────────┘ │    │ │ GPT-4       │ │
│ └─────────────┘ │    │ ┌─────────────┐ │    │ │ Text        │ │
│ ┌─────────────┐ │    │ │   Storage   │ │    │ └─────────────┘ │
│ │   UI        │ │    │ └─────────────┘ │    └─────────────────┘
│ │ Components  │ │    └─────────────────┘
│ └─────────────┘ │
└─────────────────┘
```

## 🔧 Configurazione del Progetto

### **Prerequisiti**

- Node.js 18+ 
- npm o yarn
- Git
- Account Supabase
- Account OpenAI

### **Setup Iniziale**

```bash
# Clona il repository
git clone [repository-url]
cd nutricoach

# Installa dipendenze
npm install

# Configura variabili d'ambiente
cp .env.example .env.local
```

### **Variabili d'Ambiente**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-key

# Environment
NODE_ENV=development
```

## 📁 Struttura del Codice

### **Organizzazione dei File**

```
src/
├── components/           # Componenti riutilizzabili
│   ├── ui/              # Componenti UI base (Radix)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── Layout.tsx       # Layout principale dell'app
│   ├── PhotoAnalyzer.tsx # Componente analisi foto
│   ├── SwipeableMealItem.tsx # Gestione pasti con swipe
│   ├── OptimizedImage.tsx # Componente immagine ottimizzato
│   └── LazyPage.tsx     # Componente lazy loading
├── pages/               # Pagine dell'applicazione
│   ├── Dashboard.tsx    # Dashboard principale
│   ├── MealTracker.tsx  # Tracciamento pasti
│   ├── Progress.tsx     # Monitoraggio progressi
│   ├── MealHistory.tsx  # Storico pasti
│   ├── Profile.tsx      # Profilo utente
│   ├── Auth.tsx         # Autenticazione
│   ├── Onboarding.tsx   # Setup iniziale
│   ├── Landing.tsx      # Pagina di benvenuto
│   └── Setup.tsx        # Configurazione
├── stores/              # Gestione stato (Zustand)
│   ├── authStore.ts     # Store autenticazione
│   └── profileStore.ts  # Store profilo utente
├── lib/                 # Utility e configurazioni
│   ├── supabase.ts      # Configurazione Supabase
│   ├── openai.ts        # Configurazione OpenAI
│   ├── performance.ts   # Ottimizzazioni performance
│   ├── production.ts    # Configurazioni produzione
│   ├── utils.ts         # Utility generali
│   └── textAnalysis.ts  # Analisi testi
├── hooks/               # Hook personalizzati
│   ├── use-toast.ts     # Hook per notifiche
│   └── useOptimizedQuery.ts # Hook per query ottimizzate
└── main.tsx            # Entry point dell'app
```

## 🧠 Componenti Principali

### **1. Layout.tsx**

Layout principale che gestisce la navigazione e la struttura dell'app.

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

### **2. PhotoAnalyzer.tsx**

Componente per l'analisi delle foto con AI.

```typescript
interface PhotoAnalysisResult {
  ingredients: string[];
  portions: Record<string, string>;
  nutrition: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
  suggestions: string[];
}

export function PhotoAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  
  const analyzePhoto = async (file: File) => {
    setAnalyzing(true);
    try {
      const analysis = await openai.analyzeImage(file);
      setResult(analysis);
    } catch (error) {
      console.error('Errore analisi foto:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => analyzePhoto(e.target.files[0])}
      />
      {analyzing && <LoadingSpinner />}
      {result && <AnalysisResult result={result} />}
    </div>
  );
}
```

### **3. Dashboard.tsx**

Dashboard principale con overview dei progressi.

```typescript
export function Dashboard() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  
  useEffect(() => {
    if (user) {
      loadDailyData();
    }
  }, [user]);
  
  return (
    <div className="space-y-6">
      <WelcomeSection user={user} profile={profile} />
      <NutritionOverview dailyGoal={dailyGoal} />
      <RecentMeals meals={todayMeals} />
      <ProgressCharts />
    </div>
  );
}
```

## 🔄 Gestione dello Stato

### **Zustand Stores**

#### **authStore.ts**

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  initAuthListener: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  
  initAuthListener: () => {
    // Inizializza listener per cambiamenti auth
  },
  
  signUp: async (email, password) => {
    // Logica registrazione
  },
  
  signIn: async (email, password) => {
    // Logica login
  },
  
  signOut: async () => {
    // Logica logout
  }
}));
```

#### **profileStore.ts**

```typescript
interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  createProfile: (profileData: ProfileData) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  
  fetchProfile: async (userId) => {
    // Fetch profilo utente
  },
  
  updateProfile: async (updates) => {
    // Aggiorna profilo
  },
  
  createProfile: async (profileData) => {
    // Crea nuovo profilo
  }
}));
```

## 🗄️ Database Schema

### **Tabelle Principali**

#### **profiles**

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height INTEGER, -- in cm
  weight DECIMAL(5,2), -- in kg
  target_weight DECIMAL(5,2),
  timeframe_months INTEGER,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose_weight', 'gain_weight', 'maintain', 'build_muscle')),
  obstacles TEXT[],
  emotional_goals TEXT[],
  dietary_restrictions TEXT[],
  health_conditions TEXT[],
  daily_calories INTEGER,
  daily_proteins INTEGER,
  daily_carbs INTEGER,
  daily_fats INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **meals**

```sql
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER NOT NULL,
  proteins DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fats DECIMAL(5,2),
  consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **daily_goals**

```sql
CREATE TABLE daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  target_calories INTEGER,
  target_proteins INTEGER,
  target_carbs INTEGER,
  target_fats INTEGER,
  consumed_calories INTEGER DEFAULT 0,
  consumed_proteins INTEGER DEFAULT 0,
  consumed_carbs INTEGER DEFAULT 0,
  consumed_fats INTEGER DEFAULT 0,
  water_intake INTEGER DEFAULT 0, -- in ml
  steps INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### **Row Level Security (RLS)**

```sql
-- Abilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- Policy per profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per meals
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (auth.uid() = user_id);
```

## 🤖 Integrazione AI

### **OpenAI Configuration**

```typescript
// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const analyzeMealPhoto = async (imageFile: File) => {
  const base64Image = await fileToBase64(imageFile);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analizza questa foto di cibo e fornisci: 1) Lista ingredienti identificati, 2) Stima porzioni in grammi, 3) Valori nutrizionali approssimativi (calorie, proteine, carboidrati, grassi), 4) Suggerimenti per migliorare il pasto. Rispondi in formato JSON."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

### **Esempio di Analisi**

```typescript
// Esempio di risposta AI
{
  "ingredients": [
    "pasta", "pomodoro", "basilico", "olio d'oliva", "parmigiano"
  ],
  "portions": {
    "pasta": "80g",
    "sauce": "100g",
    "cheese": "15g"
  },
  "nutrition": {
    "calories": 420,
    "proteins": 18,
    "carbs": 65,
    "fats": 12
  },
  "suggestions": [
    "Aggiungi proteine magre come pollo o tonno",
    "Considera pasta integrale per più fibre",
    "Aumenta la porzione di verdure"
  ]
}
```

## ⚡ Ottimizzazioni Performance

### **Code Splitting**

```typescript
// App.tsx - Lazy loading delle pagine
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MealTracker = lazy(() => import('@/pages/MealTracker').then(module => ({ default: module.MealTracker })));
const Progress = lazy(() => import('@/pages/Progress').then(module => ({ default: module.Progress })));
```

### **Caching Strategy**

```typescript
// lib/performance.ts
export const createLocalStorageCache = <T>(key: string, ttl: number = 5 * 60 * 1000) => {
  return {
    get: (): T | null => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp > ttl) {
          localStorage.removeItem(key);
          return null;
        }
        
        return data;
      } catch {
        return null;
      }
    },
    set: (data: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch {
        // Ignora errori di localStorage
      }
    }
  };
};
```

### **React Optimizations**

```typescript
// Componente ottimizzato con memo
export const OptimizedMealItem = memo<MealItemProps>(({ meal, onDelete, onEdit }) => {
  const handleDelete = useCallback(() => {
    onDelete(meal.id);
  }, [meal.id, onDelete]);
  
  const handleEdit = useCallback(() => {
    onEdit(meal);
  }, [meal, onEdit]);
  
  return (
    <div className="meal-item">
      <h3>{meal.name}</h3>
      <p>{meal.calories} calorie</p>
      <button onClick={handleDelete}>Elimina</button>
      <button onClick={handleEdit}>Modifica</button>
    </div>
  );
});
```

## 🔒 Sicurezza

### **Input Validation**

```typescript
// lib/validation.ts
import { z } from 'zod';

export const mealSchema = z.object({
  name: z.string().min(1, 'Nome pasto richiesto').max(100),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.number().min(0).max(5000),
  proteins: z.number().min(0).max(500).optional(),
  carbs: z.number().min(0).max(1000).optional(),
  fats: z.number().min(0).max(200).optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(1).max(100),
  age: z.number().min(13).max(120),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  goal: z.enum(['lose_weight', 'gain_weight', 'maintain', 'build_muscle']),
});
```

### **API Security**

```typescript
// lib/supabase.ts
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  if (!checkSupabaseConnection()) {
    console.warn('Operazione Supabase saltata - Supabase non configurato');
    return fallback || null;
  }

  try {
    return await operation();
  } catch (error) {
    console.error('Errore operazione Supabase:', error);
    return fallback || null;
  }
};
```

## 🧪 Testing

### **Unit Tests**

```typescript
// __tests__/utils.test.ts
import { formatCalories, calculateMacros } from '@/lib/utils';

describe('Utils', () => {
  test('formatCalories formats correctly', () => {
    expect(formatCalories(1500)).toBe('1,500');
    expect(formatCalories(0)).toBe('0');
  });
  
  test('calculateMacros calculates correctly', () => {
    const result = calculateMacros(2000, 'moderate');
    expect(result.proteins).toBeGreaterThan(0);
    expect(result.carbs).toBeGreaterThan(0);
    expect(result.fats).toBeGreaterThan(0);
  });
});
```

### **Integration Tests**

```typescript
// __tests__/PhotoAnalyzer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoAnalyzer } from '@/components/PhotoAnalyzer';

describe('PhotoAnalyzer', () => {
  test('analyzes photo successfully', async () => {
    render(<PhotoAnalyzer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('file');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Analisi completata')).toBeInTheDocument();
    });
  });
});
```

## 📊 Monitoring e Analytics

### **Performance Monitoring**

```typescript
// lib/production.ts
export const performance = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        // Ignore measurement errors
      }
    }
  }
};
```

### **Error Tracking**

```typescript
// lib/errorTracking.ts
export const trackError = (error: Error, context?: any) => {
  console.error('Error tracked:', error, context);
  
  // In produzione, invia a servizio di tracking
  if (import.meta.env.PROD) {
    // Sentry, LogRocket, etc.
  }
};

// Error boundary
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 🚀 Deploy e CI/CD

### **Netlify Configuration**

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
```

## 📈 Metriche e KPI

### **Performance Metrics**

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### **Business Metrics**

- **User Engagement**: Tempo medio per sessione
- **Feature Adoption**: % utenti che usano analisi foto
- **Retention**: % utenti attivi dopo 7/30 giorni
- **Conversion**: % utenti che completano onboarding

### **Technical Metrics**

- **Bundle Size**: < 1.5MB gzipped
- **API Response Time**: < 200ms
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

---

## 📞 Supporto Tecnico

### **Risorse Utili**

- [📖 README Principale](./README.md)
- [🔧 Setup Ambiente](./ENVIRONMENT_SETUP.md)
- [🚀 Guida Deploy](./DEPLOY.md)
- [⚡ Ottimizzazioni Performance](./PERFORMANCE_OPTIMIZATIONS.md)

### **Contatti**

- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Wiki**: [Documentazione Wiki](link-to-wiki)

---

*Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}*

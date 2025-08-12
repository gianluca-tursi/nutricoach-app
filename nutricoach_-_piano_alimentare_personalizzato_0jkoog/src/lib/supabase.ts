import { createClient } from '@supabase/supabase-js';

// Funzione per validare URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Controlla se le variabili d'ambiente sono configurate
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Crea un flag per verificare se Supabase è configurato correttamente
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl)
);

// Crea il client solo se le credenziali sono disponibili e valide
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Funzione helper per verificare se Supabase è disponibile
export const checkSupabaseConnection = () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase non è configurato correttamente. Verifica le variabili d\'ambiente:');
    console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'Configurato' : 'Mancante');
    console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurato' : 'Mancante');
    return false;
  }
  return true;
};

// Funzione per operazioni Supabase con gestione errori
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

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  target_weight?: number;
  timeframe_months?: number;
  activity_level: string;
  goal: string;
  goal_detailed?: 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';
  training_frequency?: number;
  body_fat_percentage?: number;
  obstacles?: string[];
  emotional_goals?: string[];
  dietary_restrictions?: string[];
  health_conditions?: string[];
  daily_calories: number;
  daily_proteins: number;
  daily_carbs: number;
  daily_fats: number;
  created_at?: string;
  updated_at?: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_type: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  consumed_at: string;
  created_at?: string;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  date: string;
  target_calories: number;
  target_proteins: number;
  target_carbs: number;
  target_fats: number;
  consumed_calories: number;
  consumed_proteins: number;
  consumed_carbs: number;
  consumed_fats: number;
  water_intake: number;
  steps: number;
  created_at?: string;
  updated_at?: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_at: string;
  created_at?: string;
}

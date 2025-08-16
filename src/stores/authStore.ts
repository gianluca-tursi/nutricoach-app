import { create } from 'zustand';
import { supabase, isSupabaseConfigured, checkSupabaseConnection, safeSupabaseOperation } from '@/lib/supabase';
import { useProfileStore } from './profileStore';
import { createLocalStorageCache } from '@/lib/performance';

interface AuthState {
  user: any | null;
  loading: boolean;
  initAuthListener: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Cache per la sessione utente
const sessionCache = createLocalStorageCache<any>('auth_session', 5 * 60 * 1000); // 5 minuti

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  // Inizializza il listener per i cambiamenti di autenticazione
  initAuthListener: () => {
    if (!checkSupabaseConnection()) {
      console.warn('Auth listener non inizializzato - Supabase non configurato');
      set({ loading: false });
      return;
    }
    
    // Prova prima dal cache
    const cachedSession = sessionCache.get();
    if (cachedSession?.user) {
      set({ user: cachedSession.user, loading: false });
    }
    
    // Timeout di sicurezza per evitare loading infinito
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout, setting loading to false');
      set({ loading: false });
    }, 5000); // 5 secondi
    
    // Prima controlla la sessione corrente
    safeSupabaseOperation(async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      clearTimeout(timeout);
      
      if (session?.user) {
        set({ user: session.user, loading: false });
        sessionCache.set(session);
      } else {
        set({ user: null, loading: false });
        sessionCache.clear();
        useProfileStore.getState().resetProfile();
      }
    }).catch((error) => {
      clearTimeout(timeout);
      console.error('Error getting session:', error);
      set({ user: null, loading: false });
      sessionCache.clear();
      useProfileStore.getState().resetProfile();
    });
    
    // Poi ascolta i cambiamenti
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user, loading: false });
          sessionCache.set(session);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, loading: false });
          sessionCache.clear();
          useProfileStore.getState().resetProfile();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          set({ user: session.user, loading: false });
          sessionCache.set(session);
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            set({ user: session.user, loading: false });
            sessionCache.set(session);
          } else {
            set({ user: null, loading: false });
            sessionCache.clear();
            useProfileStore.getState().resetProfile();
          }
        }
      });
    }
  },
  
  signUp: async (email: string, password: string) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    const result = await safeSupabaseOperation(async () => {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    });
    
    if (result) {
      set({ user: result.user });
      if (result.session) {
        sessionCache.set(result.session);
      }
    }
  },
  
  signIn: async (email: string, password: string) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    const result = await safeSupabaseOperation(async () => {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    });
    
    if (result) {
      set({ user: result.user });
      if (result.session) {
        sessionCache.set(result.session);
      }
    }
  },
  
  signOut: async () => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    await safeSupabaseOperation(async () => {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
    });
    
    // Reset profile when user signs out
    useProfileStore.getState().resetProfile();
    sessionCache.clear();
    
    // Reset PWA prompt flag so it shows again on next login
    localStorage.removeItem('pwa-prompt-seen');
    
    set({ user: null });
    
    // Navigate to auth page instead of landing
    window.location.href = '/auth';
  },
}));

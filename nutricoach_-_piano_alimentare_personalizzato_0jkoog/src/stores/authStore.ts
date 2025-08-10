import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
    if (!isSupabaseConfigured) {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
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
  },
  
  signUp: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    set({ user: data.user });
    if (data.session) {
      sessionCache.set(data.session);
    }
  },
  
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    set({ user: data.user });
    if (data.session) {
      sessionCache.set(data.session);
    }
  },
  
  signOut: async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Reset profile when user signs out
    useProfileStore.getState().resetProfile();
    sessionCache.clear();
    set({ user: null });
  },
}));

import { create } from 'zustand';
import { supabase, type Profile, isSupabaseConfigured, checkSupabaseConnection, safeSupabaseOperation } from '@/lib/supabase';
import { createLocalStorageCache, memoize } from '@/lib/performance';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  createProfile: (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => Promise<void>;
  upsertProfile: (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => Promise<void>;
  deleteProfile: (userId: string) => Promise<void>;
  resetProfile: () => void;
}

// Cache per i profili utente
const profileCache = createLocalStorageCache<Profile>('user_profile', 10 * 60 * 1000); // 10 minuti

// Memoizzazione per evitare fetch multipli dello stesso profilo
const memoizedFetchProfile = memoize(
  async (userId: string): Promise<Profile | null> => {
    console.log('memoizedFetchProfile called with userId:', userId);
    
    // Validazione dell'ID
    if (!userId || userId.trim() === '') {
      console.warn('Invalid userId provided to fetchProfile:', userId);
      return null;
    }

    const result = await safeSupabaseOperation(async () => {
      try {
        const { data, error } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching profile:', error);
          return null;
        }

        return data ?? null;
      } catch (error) {
        console.warn('Error in profile fetch operation:', error);
        return null;
      }
    });

    return result;
  },
  (userId: string) => userId // Chiave di cache basata sull'ID utente
);

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  
  fetchProfile: async (userId: string) => {
    console.log('fetchProfile called with userId:', userId);
    
    if (!checkSupabaseConnection()) {
      console.warn('Fetch profile saltato - Supabase non configurato');
      return;
    }

    // Evita fetch multipli simultanei
    if (get().loading) {
      console.log('Profile fetch already in progress, skipping');
      return;
    }

    set({ loading: true });
    
    try {
      // Prova prima dal cache
      const cachedProfile = profileCache.get();
      if (cachedProfile && cachedProfile.id === userId) {
        set({ profile: cachedProfile, loading: false });
        return;
      }

      // Fetch dal database con memoization
      const profile = await memoizedFetchProfile(userId);
      console.log('Profile fetch result:', profile);
      
      // Salva nel cache
      if (profile) {
        profileCache.set(profile);
      } else {
        profileCache.clear();
      }
      
      set({ profile, loading: false });
    } catch (error) {
      console.warn('Error fetching profile:', error);
      set({ profile: null, loading: false });
      profileCache.clear();
    }
  },
  
  updateProfile: async (updates: Partial<Profile>) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    const profile = get().profile;
    if (!profile) {
      throw new Error('Nessun profilo da aggiornare');
    }
    
    const result = await safeSupabaseOperation(async () => {
      const { error } = await supabase!
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      return { ...profile, ...updates };
    });
    
    if (result) {
      set({ profile: result });
      
      // Aggiorna il cache
      profileCache.set(result);
      
      // Invalida la memoization per questo utente
      memoizedFetchProfile.cache?.delete(profile.id);
    }
  },
  
  createProfile: async (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    const result = await safeSupabaseOperation(async () => {
      const { data, error } = await supabase!
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating profile:', error);
        throw error;
      }
      
      return data;
    });
    
    if (result) {
      set({ profile: result });
      
      // Salva nel cache
      profileCache.set(result);
      
      // Invalida la memoization per questo utente
      memoizedFetchProfile.cache?.delete(profileData.id);
    }
  },
  
  upsertProfile: async (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    const result = await safeSupabaseOperation(async () => {
      const { data, error } = await supabase!
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error upserting profile:', error);
        throw error;
      }
      
      return data;
    });
    
    if (result) {
      set({ profile: result, loading: false });
      
      // Salva nel cache
      profileCache.set(result);
      
      // Invalida la memoization per questo utente
      memoizedFetchProfile.cache?.delete(profileData.id);
    }
  },
  
  deleteProfile: async (userId: string) => {
    if (!checkSupabaseConnection()) {
      throw new Error('Supabase non è configurato. Verifica le variabili d\'ambiente.');
    }
    
    await safeSupabaseOperation(async () => {
      const { error } = await supabase!
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }
    });
    
    set({ profile: null });
    
    // Pulisci il cache
    profileCache.clear();
    
    // Invalida la memoization per questo utente
    memoizedFetchProfile.cache?.delete(userId);
  },
  
  resetProfile: () => {
    set({ profile: null, loading: false });
    
    // Pulisci il cache
    profileCache.clear();
  },
}));

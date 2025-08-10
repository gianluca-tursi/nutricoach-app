import { create } from 'zustand';
import { supabase, type Profile, isSupabaseConfigured } from '@/lib/supabase';
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data ?? null;
  },
  (userId: string) => userId // Chiave di cache basata sull'ID utente
);

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  
  fetchProfile: async (userId: string) => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Evita di ricaricare se il profilo è già presente per lo stesso utente (anche null esplicito)
    const currentProfile = get().profile;
    if (currentProfile !== undefined && currentProfile !== null && (currentProfile as any).id === userId) {
      return;
    }

    // Evita fetch multipli simultanei
    if (get().loading) {
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
      
      // Salva nel cache
      if (profile) {
        profileCache.set(profile);
      } else {
        profileCache.clear();
      }
      
      set({ profile, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ profile: null, loading: false });
      profileCache.clear();
    }
  },
  
  updateProfile: async (updates: Partial<Profile>) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const profile = get().profile;
    if (!profile) {
      throw new Error('Nessun profilo da aggiornare');
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    const updatedProfile = { ...profile, ...updates };
    set({ profile: updatedProfile });
    
    // Aggiorna il cache
    profileCache.set(updatedProfile);
    
    // Invalida la memoization per questo utente
    memoizedFetchProfile.cache?.delete(profile.id);
  },
  
  createProfile: async (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating profile:', error);
      throw error;
    }
    
    set({ profile: data });
    
    // Salva nel cache
    profileCache.set(data);
    
    // Invalida la memoization per questo utente
    memoizedFetchProfile.cache?.delete(profileData.id);
  },
  
  upsertProfile: async (profileData: Omit<Profile, 'created_at' | 'updated_at'>) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error upserting profile:', error);
      throw error;
    }
    
    set({ profile: data, loading: false });
    
    // Salva nel cache
    profileCache.set(data);
    
    // Invalida la memoization per questo utente
    memoizedFetchProfile.cache?.delete(profileData.id);
  },
  
  deleteProfile: async (userId: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase non è configurato');
    }
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
    
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

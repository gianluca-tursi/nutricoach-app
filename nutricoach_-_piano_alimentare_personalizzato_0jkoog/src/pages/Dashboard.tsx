import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { supabase, type DailyGoal, type Meal } from '@/lib/supabase';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { SwipeableMealItem } from '@/components/SwipeableMealItem';
import { 
  Flame, 
  Droplets, 
  Footprints, 
  TrendingUp,
  Plus,
  Sparkles,
  Heart,
  Brain,
  Dumbbell,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect as useEffectReact, useState as useStateReact } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatOneDecimal } from '@/lib/utils';
import { debounce } from '@/lib/performance';

export function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingWater, setUpdatingWater] = useState(false);
  const [updatingSteps, setUpdatingSteps] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: ''
  });

    const loadData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Ricarica il profilo solo se non è presente o se richiesto esplicitamente
      if (!profile || forceRefresh) {
        console.log('Dashboard: Fetching profile with forceRefresh:', forceRefresh);
        await fetchProfile(user.id);
        console.log('Dashboard: Profile fetched, new profile:', get().profile);
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Ricarica sempre gli obiettivi giornalieri
      try {
        const { data: goalData, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();
        
        if (goalError) {
          console.warn('Error fetching daily goals:', goalError);
          // Gestione specifica per errori 406 (Not Acceptable)
          if (goalError.code === '406' || goalError.message?.includes('406')) {
            console.warn('406 error - creating local goal');
            if (profile) {
              const localGoal = {
                id: 'local-' + Date.now(),
                user_id: user.id,
                date: today,
                target_calories: profile.daily_calories,
                target_proteins: profile.daily_proteins,
                target_carbs: profile.daily_carbs,
                target_fats: profile.daily_fats,
                consumed_calories: 0,
                consumed_proteins: 0,
                consumed_carbs: 0,
                consumed_fats: 0,
                water_intake: 0,
                steps: 0,
              };
              setDailyGoal(localGoal);
              return; // Esci dalla funzione per evitare ulteriori tentativi
            }
          }
          // Se la tabella non esiste, crea un goal locale
          if (profile) {
            const localGoal = {
              id: 'local-' + Date.now(),
              user_id: user.id,
              date: today,
              target_calories: profile.daily_calories,
              target_proteins: profile.daily_proteins,
              target_carbs: profile.daily_carbs,
              target_fats: profile.daily_fats,
              consumed_calories: 0,
              consumed_proteins: 0,
              consumed_carbs: 0,
              consumed_fats: 0,
              water_intake: 0,
              steps: 0,
            };
            setDailyGoal(localGoal);
          }
        } else if (goalData) {
          setDailyGoal(goalData);
        } else if (profile) {
          try {
            const newGoal = {
              user_id: user.id,
              date: today,
              target_calories: profile.daily_calories,
              target_proteins: profile.daily_proteins,
              target_carbs: profile.daily_carbs,
              target_fats: profile.daily_fats,
              consumed_calories: 0,
              consumed_proteins: 0,
              consumed_carbs: 0,
              consumed_fats: 0,
              water_intake: 0,
              steps: 0,
            };
            
            const { data, error: upsertError } = await supabase
              .from('daily_goals')
              .upsert([newGoal], { 
                onConflict: 'user_id,date',
                ignoreDuplicates: false 
              })
              .select()
              .single();
            
            if (upsertError) {
              console.warn('Error upserting daily goal:', upsertError);
              // Gestione specifica per errori 406 (Not Acceptable)
              if (upsertError.code === '406' || upsertError.message?.includes('406')) {
                console.warn('406 error on upsert - using local goal');
                setDailyGoal({ ...newGoal, id: 'local-' + Date.now() });
                return; // Esci dalla funzione per evitare ulteriori tentativi
              }
              // Usa il goal locale se l'upsert fallisce
              setDailyGoal({ ...newGoal, id: 'local-' + Date.now() });
            } else {
              setDailyGoal(data);
            }
          } catch (insertError) {
            console.warn('Error creating daily goal:', insertError);
            // Usa il goal locale se l'inserimento fallisce
            if (profile) {
              const localGoal = {
                id: 'local-' + Date.now(),
                user_id: user.id,
                date: today,
                target_calories: profile.daily_calories,
                target_proteins: profile.daily_proteins,
                target_carbs: profile.daily_carbs,
                target_fats: profile.daily_fats,
                consumed_calories: 0,
                consumed_proteins: 0,
                consumed_carbs: 0,
                consumed_fats: 0,
                water_intake: 0,
                steps: 0,
              };
              setDailyGoal(localGoal);
            }
          }
        }
      } catch (error) {
        console.warn('Error with daily goals:', error);
        // Fallback: crea un goal locale
        if (profile) {
          const localGoal = {
            id: 'local-' + Date.now(),
            user_id: user.id,
            date: today,
            target_calories: profile.daily_calories,
            target_proteins: profile.daily_proteins,
            target_carbs: profile.daily_carbs,
            target_fats: profile.daily_fats,
            consumed_calories: 0,
            consumed_proteins: 0,
            consumed_carbs: 0,
            consumed_fats: 0,
            water_intake: 0,
            steps: 0,
          };
          setDailyGoal(localGoal);
        }
      }
      
      // Ricarica sempre i pasti di oggi
      try {
        // Prima prova a caricare tutti i pasti dell'utente per debug
        const { data: allMeals, error: allMealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: false });
        
        if (allMealsError) {
          console.warn('Error fetching all meals:', allMealsError);
        }
        
        // Ora carica solo i pasti di oggi
        // Calcola i limiti del giorno in UTC per allinearsi a consumed_at salvato con toISOString (UTC)
        const now = new Date();
        const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
        const endUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)).toISOString();

        const { data: mealsData, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('consumed_at', startUtc)
          .lte('consumed_at', endUtc)
          .order('consumed_at', { ascending: false });
        
        if (mealsError) {
          console.warn('Error fetching today meals:', mealsError);
          setTodayMeals([]);
        } else {
          setTodayMeals(mealsData || []);
        }
      } catch (error) {
        console.warn('Error with meals:', error);
        setTodayMeals([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, fetchProfile]);

  // Debounced version of loadData
  const debouncedLoadData = useCallback(
    debounce(loadData, 300),
    [loadData]
  );

  // Gestisce l'aggiornamento dei pasti
  const handleMealUpdate = (changedMeal?: Meal, action?: 'deleted' | 'edited') => {
    if (action === 'deleted' && changedMeal) {
      // Aggiorna lista pasti senza ricaricare
      setTodayMeals(prev => prev.filter(m => m.id !== changedMeal.id));
      // Aggiorna obiettivi localmente se già presenti
      setDailyGoal(prev => prev ? {
        ...prev,
        consumed_calories: Math.max(0, prev.consumed_calories - changedMeal.calories),
        consumed_proteins: Math.max(0, prev.consumed_proteins - changedMeal.proteins),
        consumed_carbs: Math.max(0, prev.consumed_carbs - changedMeal.carbs),
        consumed_fats: Math.max(0, prev.consumed_fats - changedMeal.fats),
      } : prev);
      return;
    }
    // Per altri casi, fallback al reload
    loadData(true);
  };

  const WATER_GLASS_ML = 250;
  const WALK_STEPS = 1000;

  const handleAddWaterGlass = async () => {
    if (!dailyGoal || updatingWater) return;
    setUpdatingWater(true);
    const prev = dailyGoal.water_intake || 0;
    const next = prev + WATER_GLASS_ML;
    setDailyGoal({ ...dailyGoal, water_intake: next });
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({ water_intake: next })
        .eq('id', dailyGoal.id);
      if (error) throw error;
      toast.success('Aggiunto un bicchiere d\'acqua (+250 ml)');
    } catch (e) {
      setDailyGoal({ ...dailyGoal, water_intake: prev });
      toast.error('Errore nell\'aggiornare l\'idratazione');
    } finally {
      setUpdatingWater(false);
    }
  };

  const handleAddWalkSteps = async () => {
    if (!dailyGoal || updatingSteps) return;
    setUpdatingSteps(true);
    const prev = dailyGoal.steps || 0;
    const next = prev + WALK_STEPS;
    setDailyGoal({ ...dailyGoal, steps: next });
    try {
      const { error } = await supabase
        .from('daily_goals')
        .update({ steps: next })
        .eq('id', dailyGoal.id);
      if (error) throw error;
      toast.success('Aggiunta una passeggiata (+1000 passi)');
    } catch (e) {
      setDailyGoal({ ...dailyGoal, steps: prev });
      toast.error('Errore nell\'aggiornare i passi');
    } finally {
      setUpdatingSteps(false);
    }
  };

  // PWA install banner logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      toast.success('App aggiunta alla Home!');
      setShowInstallBanner(false);
    }
  };

  // Gestisce la modifica di un pasto (apre modale)
  const handleMealEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setEditForm({
      name: meal.name || '',
      calories: String(meal.calories ?? ''),
      proteins: String(meal.proteins ?? ''),
      carbs: String(meal.carbs ?? ''),
      fats: String(meal.fats ?? ''),
    });
    setEditOpen(true);
  };

  // Salva modifica pasto
  const saveMealEdit = async () => {
    if (!editingMeal || !dailyGoal) return;
    const updated = {
      name: editForm.name.trim(),
      calories: parseInt(editForm.calories || '0', 10) || 0,
      proteins: parseFloat(editForm.proteins || '0') || 0,
      carbs: parseFloat(editForm.carbs || '0') || 0,
      fats: parseFloat(editForm.fats || '0') || 0,
    };

    try {
      // Update meal on DB
      const { error } = await supabase
        .from('meals')
        .update(updated)
        .eq('id', editingMeal.id);
      if (error) throw error;

      // Delta sui goal
      const delta = {
        calories: updated.calories - (editingMeal.calories || 0),
        proteins: updated.proteins - (editingMeal.proteins || 0),
        carbs: updated.carbs - (editingMeal.carbs || 0),
        fats: updated.fats - (editingMeal.fats || 0),
      };

      setDailyGoal(prev => prev ? {
        ...prev,
        consumed_calories: Math.max(0, (prev.consumed_calories || 0) + delta.calories),
        consumed_proteins: Math.max(0, (prev.consumed_proteins || 0) + delta.proteins),
        consumed_carbs: Math.max(0, (prev.consumed_carbs || 0) + delta.carbs),
        consumed_fats: Math.max(0, (prev.consumed_fats || 0) + delta.fats),
      } : prev);

      // Aggiorna lista pasti localmente
      setTodayMeals(prev => prev.map(m => m.id === editingMeal.id ? { ...m, ...updated } as Meal : m));

      toast.success('Pasto modificato');
      setEditOpen(false);
      setEditingMeal(null);
    } catch (e) {
      console.error('Errore modifica pasto', e);
      toast.error('Errore nella modifica del pasto');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);



  useEffect(() => {
    const handleMealUpdated = () => {
      loadData(true);
    };

    const handleProfileUpdated = () => {
      console.log('Dashboard: Profile updated event received, reloading data...');
      loadData(true);
    };

    window.addEventListener('meal-updated', handleMealUpdated);
    window.addEventListener('profile-updated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('meal-updated', handleMealUpdated);
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [loadData]);

  if (loading || !profile || !dailyGoal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const motivationalTips = [
    {
      text: "Bere acqua regolarmente aiuta il metabolismo",
      icon: Droplets,
      gradient: "from-blue-400 to-cyan-400"
    },
    {
      text: "Camminare 10.000 passi al giorno mantiene attivo",
      icon: Footprints,
      gradient: "from-green-400 to-emerald-400"
    },
    {
      text: "Un sonno di qualità è fondamentale per la salute",
      icon: Heart,
      gradient: "from-pink-400 to-rose-400"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header di benvenuto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            {getGreeting()}, {profile.full_name}!
          </span>
        </h1>
        <p className="text-gray-400">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
        </p>
      </motion.div>

      {/* Riepilogo calorie - Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 p-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 opacity-20 blur-xl" />
          <div className="relative glass-dark rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Calorie Giornaliere</h2>
                <p className="text-gray-400">
                  Hai consumato {dailyGoal.consumed_calories} su {dailyGoal.target_calories} kcal
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Flame className="h-16 w-16 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]" />
              </motion.div>
            </div>
            
            <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((dailyGoal.consumed_calories / dailyGoal.target_calories) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                style={{
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                }}
              />
            </div>
            
            <div className="flex justify-between mt-4">
              <span className="text-gray-400">Rimanenti</span>
              <span className="font-bold text-2xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {Math.max(0, dailyGoal.target_calories - dailyGoal.consumed_calories)} kcal
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macronutrienti - Cards moderne */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { 
            label: 'Proteine', 
            value: dailyGoal.consumed_proteins, 
            target: dailyGoal.target_proteins, 
            progress: (dailyGoal.consumed_proteins / dailyGoal.target_proteins) * 100,
            gradient: 'from-blue-400 to-cyan-400',
            icon: Zap
          },
          { 
            label: 'Carboidrati', 
            value: dailyGoal.consumed_carbs, 
            target: dailyGoal.target_carbs, 
            progress: (dailyGoal.consumed_carbs / dailyGoal.target_carbs) * 100,
            gradient: 'from-green-400 to-emerald-400',
            icon: Target
          },
          { 
            label: 'Grassi', 
            value: dailyGoal.consumed_fats, 
            target: dailyGoal.target_fats, 
            progress: (dailyGoal.consumed_fats / dailyGoal.target_fats) * 100,
            gradient: 'from-yellow-400 to-orange-400',
            icon: Award
          }
        ].map((macro, index) => (
          <motion.div
            key={macro.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl ${macro.gradient}`} />
            <div className="relative glass-dark rounded-2xl p-6 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">{macro.label}</p>
                <macro.icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold mb-2">
                <span className={`bg-gradient-to-r ${macro.gradient} bg-clip-text text-transparent`}>
                  {Math.round(macro.value)}g
                </span>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(macro.progress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                  className={`absolute h-full bg-gradient-to-r ${macro.gradient} rounded-full`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">su {Math.round(macro.target)}g</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Altri obiettivi - Design futuristico */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group cursor-pointer"
          onClick={handleAddWaterGlass}
        >
          <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl" />
          <div className="relative glass-dark rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Idratazione</h3>
              <Droplets className="h-6 w-6 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-400">{(dailyGoal.water_intake / 1000).toFixed(1)}</span>
              <span className="text-gray-400">/ 2L</span>
            </div>
            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(dailyGoal.water_intake / 2000) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">Tap qui quando bevi un bicchiere (+250 ml)</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group cursor-pointer"
          onClick={handleAddWalkSteps}
        >
          <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl" />
          <div className="relative glass-dark rounded-2xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Passi</h3>
              <Footprints className="h-6 w-6 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-400">{dailyGoal.steps.toLocaleString()}</span>
            </div>
            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(dailyGoal.steps / 10000) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">Ogni tap aggiunge una passeggiata (+1000 passi)</p>
          </div>
        </motion.div>
      </div>

      {/* Pasti recenti - Design minimalista */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="glass-dark rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Pasti di Oggi</h3>
            <Button 
              size="sm" 
              asChild
              className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90 transition-opacity"
            >
              <Link to="/meals">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi
              </Link>
            </Button>
          </div>
          
          {todayMeals.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400">Non hai ancora registrato pasti oggi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SwipeableMealItem 
                    meal={meal} 
                    onMealUpdate={handleMealUpdate}
                    onEdit={handleMealEdit}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Consigli motivazionali - Design accattivante */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 p-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 opacity-20 blur-xl motion-safe:animate-pulse" />
          <div className="relative glass-dark rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
                              <Sparkles className="h-6 w-6 text-purple-400 motion-safe:animate-pulse" />
              <h3 className="text-2xl font-bold text-white">Consigli del Giorno</h3>
            </div>
            <div className="space-y-4">
              {motivationalTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${tip.gradient} bg-opacity-20`}>
                    <tip.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors">{tip.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modale modifica pasto */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-dark border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Modifica pasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-gray-300">Nome</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 bg-gray-800/50 border-gray-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-calories" className="text-gray-300">Calorie (kcal)</Label>
                <Input id="edit-calories" type="number" value={editForm.calories} onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })} className="mt-1 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <div>
                <Label htmlFor="edit-proteins" className="text-gray-300">Proteine (g)</Label>
                <Input id="edit-proteins" type="number" step="0.1" value={editForm.proteins} onChange={(e) => setEditForm({ ...editForm, proteins: e.target.value })} className="mt-1 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <div>
                <Label htmlFor="edit-carbs" className="text-gray-300">Carboidrati (g)</Label>
                <Input id="edit-carbs" type="number" step="0.1" value={editForm.carbs} onChange={(e) => setEditForm({ ...editForm, carbs: e.target.value })} className="mt-1 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <div>
                <Label htmlFor="edit-fats" className="text-gray-300">Grassi (g)</Label>
                <Input id="edit-fats" type="number" step="0.1" value={editForm.fats} onChange={(e) => setEditForm({ ...editForm, fats: e.target.value })} className="mt-1 bg-gray-800/50 border-gray-700 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-gray-600 text-gray-300">Annulla</Button>
            <Button onClick={saveMealEdit} className="bg-gradient-to-r from-green-400 to-blue-400 text-black">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

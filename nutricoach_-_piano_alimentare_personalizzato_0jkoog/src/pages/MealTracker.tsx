import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PhotoAnalyzer } from '@/components/PhotoAnalyzer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { FoodAnalysisResult } from '@/lib/textAnalysis';
import { useQuickFoods } from '@/hooks/useQuickFoods';
import { 
  Camera, 
  Mic, 
  Search, 
  Plus,
  Coffee,
  Sun,
  Sunset,
  Moon,
  X,
  Sparkles
} from 'lucide-react';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Colazione', icon: Coffee, time: '07:00-10:00', gradient: 'from-yellow-400 to-orange-400' },
  { value: 'lunch', label: 'Pranzo', icon: Sun, time: '12:00-14:00', gradient: 'from-green-400 to-teal-400' },
  { value: 'dinner', label: 'Cena', icon: Sunset, time: '19:00-21:00', gradient: 'from-purple-400 to-pink-400' },
  { value: 'snack', label: 'Spuntino', icon: Moon, time: 'Qualsiasi ora', gradient: 'from-blue-400 to-indigo-400' },
];



export function MealTracker() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { quickFoods, addQuickFood, removeQuickFood } = useQuickFoods();
  
  // Funzione per determinare il tipo di pasto basato sull'orario
  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 19) return 'snack';
    if (hour >= 19 || hour < 6) return 'dinner';
    return 'lunch'; // default
  };
  
  const [selectedMealType, setSelectedMealType] = useState(getCurrentMealType());
  const [manualEntry, setManualEntry] = useState({
    name: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calcola gli alimenti per pagina (9 per pagina)
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(quickFoods.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFoods = quickFoods.slice(startIndex, endIndex);

  // Apri automaticamente il PhotoAnalyzer quando si clicca sulla tab "photo"
  const handleTabChange = (value: string) => {
    if (value === 'photo') {
      setShowPhotoAnalyzer(true);
    } else if (value === 'voice') {
      setShowVoiceRecorder(true);
    }
  };

  const handlePhotoAnalyzerClose = () => {
    setShowPhotoAnalyzer(false);
  };

  const handleVoiceRecorderClose = () => {
    setShowVoiceRecorder(false);
  };

  // Funzioni per la navigazione tra pagine
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagina quando cambia il numero totale di pagine
  useEffect(() => {
    const newTotalPages = Math.ceil(quickFoods.length / ITEMS_PER_PAGE);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }
  }, [quickFoods.length, currentPage]);

  // Gestione swipe per mobile
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentPage < totalPages - 1) {
      nextPage();
    } else if (direction === 'right' && currentPage > 0) {
      prevPage();
    }
  };

  const handleVoiceAnalysisComplete = async (result: FoodAnalysisResult) => {
    if (!selectedMealType) {
      toast.error('Seleziona prima il tipo di pasto');
      return;
    }

    if (!supabase) {
      toast.error('Errore di configurazione del database');
      return;
    }

    setLoading(true);
    try {
      // Salva il pasto principale con i totali
      const { error } = await supabase.from('meals').insert([
        {
          user_id: user?.id,
          name: `Pasto da voce - ${result.foods.map(f => f.name).join(', ')}`,
          meal_type: selectedMealType,
          calories: result.total_calories,
          proteins: result.total_proteins,
          carbs: result.total_carbs,
          fats: result.total_fats,
          consumed_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Aggiorna gli obiettivi giornalieri
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      try {
        const { data: dailyGoal, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('date', today)
          .maybeSingle();

        if (goalError) {
          console.warn('Error fetching daily goal:', goalError);
        }

        if (dailyGoal) {
          await supabase
            .from('daily_goals')
            .update({
              consumed_calories: dailyGoal.consumed_calories + result.total_calories,
              consumed_proteins: dailyGoal.consumed_proteins + result.total_proteins,
              consumed_carbs: dailyGoal.consumed_carbs + result.total_carbs,
              consumed_fats: dailyGoal.consumed_fats + result.total_fats,
            })
            .eq('id', dailyGoal.id);
        } else {
          console.log('No daily goal found for today, will be created by Dashboard');
        }
      } catch (error) {
        console.warn('Error with daily goals update:', error);
        // Continua comunque con il salvataggio del pasto
      }

      // Aggiungi agli alimenti rapidi se non esiste già
      await addQuickFood({
        name: result.foods[0]?.name || 'Pasto da voce',
        calories: result.total_calories,
        proteins: result.total_proteins,
        carbs: result.total_carbs,
        fats: result.total_fats,
      });

      toast.success('Pasto da voce registrato con successo!');
      setSelectedMealType('');

      // Emetti evento di aggiornamento
      window.dispatchEvent(new CustomEvent('meal-updated'));

      // Naviga al dashboard per vedere i risultati aggiornati
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error('Errore nel salvare il pasto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoAnalysisComplete = async (result: FoodAnalysisResult) => {
    if (!selectedMealType) {
      toast.error('Seleziona prima il tipo di pasto');
      return;
    }

    if (!supabase) {
      toast.error('Errore di configurazione del database');
      return;
    }

    setLoading(true);
    try {
      // Salva il pasto principale con i totali
      const { error } = await supabase.from('meals').insert([
        {
          user_id: user?.id,
          name: `Pasto da foto - ${result.foods.map(f => f.name).join(', ')}`,
          meal_type: selectedMealType,
          calories: result.total_calories,
          proteins: result.total_proteins,
          carbs: result.total_carbs,
          fats: result.total_fats,
          consumed_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Aggiorna gli obiettivi giornalieri
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const { data: dailyGoal, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('date', today)
          .maybeSingle();

        if (goalError) {
          console.warn('Error fetching daily goal:', goalError);
        }

        if (dailyGoal) {
          await supabase
            .from('daily_goals')
            .update({
              consumed_calories: dailyGoal.consumed_calories + result.total_calories,
              consumed_proteins: dailyGoal.consumed_proteins + result.total_proteins,
              consumed_carbs: dailyGoal.consumed_carbs + result.total_carbs,
              consumed_fats: dailyGoal.consumed_fats + result.total_fats,
            })
            .eq('id', dailyGoal.id);
        } else {
          console.log('No daily goal found for today, will be created by Dashboard');
        }
      } catch (error) {
        console.warn('Error with daily goals update:', error);
        // Continua comunque con il salvataggio del pasto
      }

        // Aggiungi agli alimenti rapidi se non esiste già
        await addQuickFood({
          name: result.foods[0]?.name || 'Pasto da foto',
          calories: result.total_calories,
          proteins: result.total_proteins,
          carbs: result.total_carbs,
          fats: result.total_fats,
        });

                toast.success('Pasto da foto registrato con successo!');
          setSelectedMealType('');

          // Emetti evento di aggiornamento
          window.dispatchEvent(new CustomEvent('meal-updated'));

          // Naviga al dashboard per vedere i risultati aggiornati
          navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error('Errore nel salvare il pasto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (food: any) => {
    if (!selectedMealType) {
      toast.error('Seleziona prima il tipo di pasto');
      return;
    }

    if (!supabase) {
      toast.error('Errore di configurazione del database');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('meals').insert([
        {
          user_id: user?.id,
          name: food.name,
          meal_type: selectedMealType,
          calories: food.calories,
          proteins: food.proteins,
          carbs: food.carbs,
          fats: food.fats,
          consumed_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Aggiorna gli obiettivi giornalieri
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const { data: dailyGoal, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('date', today)
          .maybeSingle();

        if (goalError) {
          console.warn('Error fetching daily goal:', goalError);
        }

        if (dailyGoal) {
          await supabase
            .from('daily_goals')
            .update({
              consumed_calories: dailyGoal.consumed_calories + food.calories,
              consumed_proteins: dailyGoal.consumed_proteins + food.proteins,
              consumed_carbs: dailyGoal.consumed_carbs + food.carbs,
              consumed_fats: dailyGoal.consumed_fats + food.fats,
            })
            .eq('id', dailyGoal.id);
        } else {
          console.log('No daily goal found for today, will be created by Dashboard');
        }
      } catch (error) {
        console.warn('Error with daily goals update:', error);
        // Continua comunque con il salvataggio del pasto
      }

                toast.success(`${food.name} aggiunto con successo!`);

          // Emetti evento di aggiornamento
          window.dispatchEvent(new CustomEvent('meal-updated'));

          // Naviga al dashboard per vedere i risultati aggiornati
          navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Errore nell\'aggiunta del pasto');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!selectedMealType || !manualEntry.name || !manualEntry.calories) {
      toast.error('Compila tutti i campi richiesti');
      return;
    }

    if (!supabase) {
      toast.error('Errore di configurazione del database');
      return;
    }

    setLoading(true);
    try {
      const mealData = {
        user_id: user?.id,
        name: manualEntry.name,
        meal_type: selectedMealType,
        calories: parseInt(manualEntry.calories),
        proteins: parseFloat(manualEntry.proteins) || 0,
        carbs: parseFloat(manualEntry.carbs) || 0,
        fats: parseFloat(manualEntry.fats) || 0,
        consumed_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('meals').insert([mealData]);

      if (error) throw error;

      // Aggiorna gli obiettivi giornalieri
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const { data: dailyGoal, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('date', today)
          .maybeSingle();

        if (goalError) {
          console.warn('Error fetching daily goal:', goalError);
        }

        if (dailyGoal) {
          await supabase
            .from('daily_goals')
            .update({
              consumed_calories: dailyGoal.consumed_calories + mealData.calories,
              consumed_proteins: dailyGoal.consumed_proteins + mealData.proteins,
              consumed_carbs: dailyGoal.consumed_carbs + mealData.carbs,
              consumed_fats: dailyGoal.consumed_fats + mealData.fats,
            })
            .eq('id', dailyGoal.id);
        } else {
          console.log('No daily goal found for today, will be created by Dashboard');
        }
      } catch (error) {
        console.warn('Error with daily goals update:', error);
        // Continua comunque con il salvataggio del pasto
      }

        // Aggiungi agli alimenti rapidi se non esiste già
        await addQuickFood({
          name: mealData.name,
          calories: mealData.calories,
          proteins: mealData.proteins,
          carbs: mealData.carbs,
          fats: mealData.fats,
        });

                toast.success('Pasto aggiunto con successo!');
          setManualEntry({ name: '', calories: '', proteins: '', carbs: '', fats: '' });

          // Emetti evento di aggiornamento
          window.dispatchEvent(new CustomEvent('meal-updated'));

          // Naviga al dashboard per vedere i risultati aggiornati
          navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Errore nell\'aggiunta del pasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Traccia i Tuoi Pasti
          </span>
        </h1>
        <p className="text-gray-400">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
        </p>
      </motion.div>

      {/* Selezione tipo pasto */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass-dark rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Che pasto stai registrando?</h2>
          <div className="grid grid-cols-2 gap-4">
            {MEAL_TYPES.map((type) => (
              <motion.button
                key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMealType(type.value)}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                  selectedMealType === type.value
                    ? 'ring-2 ring-white/50'
                    : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-20`} />
                <div className="relative flex flex-col items-center gap-2">
                  <type.icon className="h-8 w-8 text-white" />
                  <span className="font-medium text-white">{type.label}</span>
                  <span className="text-xs text-gray-400">{type.time}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs per metodi di input */}
      <Tabs defaultValue="quick" onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 h-20">
          <TabsTrigger value="quick" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black text-lg font-medium">
            <Sparkles className="h-6 w-6 mr-2" />
            Rapido
          </TabsTrigger>
          <TabsTrigger value="photo" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black text-lg font-medium">
            <Camera className="h-6 w-6 mr-2" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black text-lg font-medium">
            <Mic className="h-6 w-6 mr-2" />
            Voce
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black text-lg font-medium">
            <Plus className="h-6 w-6 mr-2" />
            Manuale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-dark rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Alimenti Rapidi</h3>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{currentPage + 1} di {totalPages}</span>
                </div>
              )}
            </div>
            
            {/* Contenitore con gestione swipe */}
            <div 
              className="relative overflow-hidden"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const startX = touch.clientX;
                
                const handleTouchEnd = (e: TouchEvent) => {
                  const touch = e.changedTouches[0];
                  const endX = touch.clientX;
                  const diffX = startX - endX;
                  
                  if (Math.abs(diffX) > 50) { // Swipe minimo di 50px
                    if (diffX > 0) {
                      handleSwipe('left'); // Swipe a sinistra = pagina successiva
                    } else {
                      handleSwipe('right'); // Swipe a destra = pagina precedente
                    }
                  }
                  
                  document.removeEventListener('touchend', handleTouchEnd);
                };
                
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              <motion.div
                key={currentPage}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 gap-4"
              >
                {currentFoods.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative overflow-hidden rounded-2xl p-4 hover-lift w-full cursor-pointer ${
                        loading || !selectedMealType ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${food.gradient} opacity-20`} />
                      
                      {/* Pulsante di rimozione per alimenti personalizzati - all'interno del box */}
                      {(food.id.startsWith('custom-') || food.user_id === user?.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuickFood(food.id);
                          }}
                          className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rimuovi alimento"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                      
                      <div 
                        className="relative flex flex-col items-center gap-2"
                        onClick={() => !loading && selectedMealType && handleQuickAdd(food)}
                      >
                        <food.icon className="h-8 w-8 text-white" />
                        <span className="text-sm font-medium text-white text-center">{food.name}</span>
                        <span className="text-xs text-gray-400">{food.calories} kcal</span>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Indicatori di pagina */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPage ? 'bg-white' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="photo">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-dark rounded-3xl p-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Camera className="h-16 w-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">Analizza Foto del Cibo</h3>
            <p className="text-gray-400 mb-6">
              Scatta una foto del tuo pasto e lascia che l'AI analizzi automaticamente i valori nutrizionali!
            </p>
            <Button 
              onClick={() => setShowPhotoAnalyzer(true)}
              className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:from-green-500 hover:to-blue-500"
            >
              <Camera className="h-4 w-4 mr-2" />
              Analizza Foto
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="voice">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-dark rounded-3xl p-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mic className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">Registra con la Voce</h3>
            <p className="text-gray-400 mb-6">
              Registra la descrizione del tuo pasto e lascia che l'AI lo analizzi automaticamente!
            </p>
            <Button 
              onClick={() => setShowVoiceRecorder(true)}
              className="bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500"
            >
              <Mic className="h-4 w-4 mr-2" />
              Inizia Registrazione
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="manual">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-dark rounded-3xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Inserimento Manuale</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Nome Alimento *</Label>
                <Input
                  id="name"
                  value={manualEntry.name}
                  onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                  placeholder="es. Pasta al pomodoro"
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories" className="text-gray-300">Calorie (kcal) *</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={manualEntry.calories}
                    onChange={(e) => setManualEntry({ ...manualEntry, calories: e.target.value })}
                    placeholder="350"
                    className="mt-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="proteins" className="text-gray-300">Proteine (g)</Label>
                  <Input
                    id="proteins"
                    type="number"
                    value={manualEntry.proteins}
                    onChange={(e) => setManualEntry({ ...manualEntry, proteins: e.target.value })}
                    placeholder="12"
                    className="mt-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="carbs" className="text-gray-300">Carboidrati (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={manualEntry.carbs}
                    onChange={(e) => setManualEntry({ ...manualEntry, carbs: e.target.value })}
                    placeholder="70"
                    className="mt-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fats" className="text-gray-300">Grassi (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    value={manualEntry.fats}
                    onChange={(e) => setManualEntry({ ...manualEntry, fats: e.target.value })}
                    placeholder="5"
                    className="mt-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleManualAdd}
                disabled={loading || !selectedMealType}
                className="w-full bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Pasto
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Photo Analyzer Modal */}
      {showPhotoAnalyzer && (
        <PhotoAnalyzer
          onAnalysisComplete={handlePhotoAnalysisComplete}
          onClose={handlePhotoAnalyzerClose}
        />
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onAnalysisComplete={handleVoiceAnalysisComplete}
          onClose={handleVoiceRecorderClose}
        />
      )}
    </div>
  );
}

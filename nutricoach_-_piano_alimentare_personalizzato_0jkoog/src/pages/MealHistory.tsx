import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase, type Meal, type DailyGoal } from '@/lib/supabase';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { SwipeableMealItem } from '@/components/SwipeableMealItem';
import { useAuthStore } from '@/stores/authStore';
import { Calendar, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export function MealHistory() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(false);

  const dayStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const loadForDate = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Goals for date
      try {
        const { data: goal, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dayStr)
          .maybeSingle();
        
        if (goalError) {
          console.warn('Error fetching daily goals for date:', goalError);
          // Crea un goal temporaneo per date passate senza dati
          setDailyGoal({
            id: 'temp-' + Date.now(),
            user_id: user.id,
            date: dayStr,
            target_calories: 2000, // Valore di default
            target_proteins: 150,
            target_carbs: 250,
            target_fats: 65,
            consumed_calories: 0,
            consumed_proteins: 0,
            consumed_carbs: 0,
            consumed_fats: 0,
            water_intake: 0,
            steps: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setDailyGoal(goal || null);
        }
      } catch (error) {
        console.warn('Error with daily goals query:', error);
        setDailyGoal(null);
      }

      // Meals for date - usa range UTC per compatibilità con toISOString
      try {
        const startUtc = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 0, 0, 0, 0)).toISOString();
        const endUtc = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 23, 59, 59, 999)).toISOString();
        const { data: dataMeals, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('consumed_at', startUtc)
          .lte('consumed_at', endUtc)
          .order('consumed_at', { ascending: false });
        
        if (mealsError) {
          console.warn('Error fetching meals for date:', mealsError);
          setMeals([]);
        } else {
          setMeals(dataMeals || []);
        }
      } catch (error) {
        console.warn('Error with meals query:', error);
        setMeals([]);
      }
    } catch (e) {
      console.error('Errore caricamento storico', e);
      // Non mostrare toast per errori di date passate senza dati
      if (!e.toString().includes('406')) {
        toast.error('Errore nel caricamento dei pasti del giorno');
      }
    } finally {
      setLoading(false);
    }
  }, [dayStr]);

  useEffect(() => {
    loadForDate();
  }, [loadForDate]);

  const changeDay = (delta: number) => {
    setSelectedDate(prev => addDays(prev, delta));
  };

  const handleMealUpdate = (changedMeal?: Meal, action?: 'deleted' | 'edited') => {
    if (action === 'deleted' && changedMeal) {
      setMeals(prev => prev.filter(m => m.id !== changedMeal.id));
      if (dailyGoal) {
        setDailyGoal({
          ...dailyGoal,
          consumed_calories: Math.max(0, dailyGoal.consumed_calories - changedMeal.calories),
          consumed_proteins: Math.max(0, dailyGoal.consumed_proteins - changedMeal.proteins),
          consumed_carbs: Math.max(0, dailyGoal.consumed_carbs - changedMeal.carbs),
          consumed_fats: Math.max(0, dailyGoal.consumed_fats - changedMeal.fats),
        });
      }
      return;
    }
    loadForDate();
  };

  const handleMealEdit = (meal: Meal) => {
    // Per lo storico, rimandiamo comunque alla pagina di traccia corrente o potremmo riutilizzare la modale della dashboard in futuro
    toast.info('Apri la modifica dalla Home per ora');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-white" />
          <h2 className="text-2xl font-bold">Archivio Pasti</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => changeDay(-1)} className="text-gray-300 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="px-3 py-2 rounded-xl bg-gray-800/50 border border-white/10 text-white">
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
          </div>
          <Button variant="ghost" onClick={() => changeDay(1)} className="text-gray-300 hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button onClick={() => setSelectedDate(new Date())} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800/50">
            Oggi
          </Button>
          <Button onClick={loadForDate} variant="ghost" className="text-gray-300 hover:text-white">
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-dark rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Calorie totali</p>
          <p className="text-3xl font-bold text-white">{dailyGoal ? dailyGoal.consumed_calories : 0} / {dailyGoal ? dailyGoal.target_calories : '—'} kcal</p>
        </div>
        <div className="glass-dark rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Numero pasti</p>
          <p className="text-3xl font-bold text-white">{meals.length}</p>
        </div>
      </div>

      {/* Meals list */}
      <div className="glass-dark rounded-3xl p-6">
        <h3 className="text-xl font-semibold mb-4">Pasti del giorno</h3>
        {loading ? (
          <div className="text-center text-gray-400">Caricamento...</div>
        ) : meals.length === 0 ? (
          <div className="text-center text-gray-400">Nessun pasto registrato in questa data</div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <SwipeableMealItem key={meal.id} meal={meal} onMealUpdate={handleMealUpdate} onEdit={handleMealEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MealHistory;

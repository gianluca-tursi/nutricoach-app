import { useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/lib/supabase';
import { formatOneDecimal } from '@/lib/utils';

interface SwipeableMealItemProps {
  meal: Meal;
  onMealUpdate: (meal?: Meal, action?: 'deleted' | 'edited') => void;
  onEdit: (meal: Meal) => void;
}

export function SwipeableMealItem({ meal, onMealUpdate, onEdit }: SwipeableMealItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      setIsOpen(true);
    } else if (info.offset.x > 20) {
      setIsOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal.id);

      if (error) throw error;

      // Aggiorna obiettivi giornalieri lato server (già presente). Il parent aggiorna localmente UI
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyGoal } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', meal.user_id)
        .eq('date', today)
        .single();

      if (dailyGoal) {
        await supabase
          .from('daily_goals')
          .update({
            consumed_calories: Math.max(0, dailyGoal.consumed_calories - meal.calories),
            consumed_proteins: Math.max(0, dailyGoal.consumed_proteins - meal.proteins),
            consumed_carbs: Math.max(0, dailyGoal.consumed_carbs - meal.carbs),
            consumed_fats: Math.max(0, dailyGoal.consumed_fats - meal.fats),
          })
          .eq('id', dailyGoal.id);
      }


      toast.success('Pasto eliminato con successo');
      onMealUpdate(meal, 'deleted');
    } catch (error) {
      console.error('Errore nell\'eliminazione del pasto:', error);
      toast.error('Errore nell\'eliminazione del pasto');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const handleEdit = () => {
    onEdit(meal);
    setIsOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Menu contestuale (azioni) */}
      <motion.div
        className="absolute right-0 top-0 z-30 h-full flex items-center gap-2 pr-4 transform-gpu will-change-transform"
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Button
          onClick={handleEdit}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDelete}
          size="sm"
          disabled={isDeleting}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </motion.div>

      {/* Contenuto principale del pasto */}
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        className="relative z-10 transform-gpu will-change-transform"
        onDragEnd={handleDragEnd}
      >
        <motion.div
          className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors cursor-grab active:cursor-grabbing"
          animate={{ x: isOpen ? -120 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{meal.name}</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(meal.consumed_at), 'HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-white">{meal.calories} kcal</p>
                <Badge 
                  className="text-xs bg-gradient-to-r from-green-400/20 to-blue-400/20 text-green-400 border-green-400/20"
                >
                  {meal.meal_type}
                </Badge>
              </div>
            </div>
            
            {/* Dettagli nutrizionali */}
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span>P: {formatOneDecimal(meal.proteins)}g</span>
              <span>C: {formatOneDecimal(meal.carbs)}g</span>
              <span>G: {formatOneDecimal(meal.fats)}g</span>
            </div>
          </div>
          
          {/* Indicatore di swipe */}
          <div className="ml-2 opacity-50">
            <div className="w-1 h-8 bg-gray-400 rounded-full" />
          </div>
        </motion.div>
      </motion.div>

      {/* Overlay per chiudere il menu (sotto il menu, sopra il contenuto) */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { 
  Apple, Pizza, Salad, Sandwich, Cookie, Beef, Fish, Egg, Milk,
  Utensils, Coffee, Cake, Carrot, Banana
} from 'lucide-react';

export interface QuickFood {
  id: string;
  name: string;
  icon: any;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  gradient: string;
  user_id?: string;
  created_at?: string;
}

// Icone disponibili per gli alimenti
const FOOD_ICONS = {
  Apple, Pizza, Salad, Sandwich, Cookie, Beef, Fish, Egg, Milk,
  Utensils, Coffee, Cake, Carrot, Banana
};

// Gradienti disponibili
const GRADIENTS = [
  'from-red-400 to-pink-400',
  'from-orange-400 to-red-400',
  'from-green-400 to-emerald-400',
  'from-yellow-400 to-amber-400',
  'from-amber-400 to-orange-400',
  'from-red-500 to-red-700',
  'from-blue-400 to-cyan-400',
  'from-yellow-300 to-yellow-500',
  'from-gray-100 to-gray-300',
  'from-purple-400 to-pink-400',
  'from-indigo-400 to-purple-400',
  'from-teal-400 to-green-400',
  'from-cyan-400 to-blue-400',
  'from-pink-400 to-rose-400',
  'from-violet-400 to-purple-400',
  'from-emerald-400 to-teal-400'
];

// Alimenti predefiniti
const DEFAULT_QUICK_FOODS: QuickFood[] = [
  { id: 'mela', name: 'Mela', icon: Apple, calories: 52, proteins: 0.3, carbs: 14, fats: 0.2, gradient: 'from-red-400 to-pink-400' },
  { id: 'pizza', name: 'Pizza Margherita', icon: Pizza, calories: 266, proteins: 11, carbs: 33, fats: 10, gradient: 'from-orange-400 to-red-400' },
  { id: 'insalata', name: 'Insalata Mista', icon: Salad, calories: 35, proteins: 2, carbs: 7, fats: 0.5, gradient: 'from-green-400 to-emerald-400' },
  { id: 'panino', name: 'Panino', icon: Sandwich, calories: 250, proteins: 10, carbs: 30, fats: 10, gradient: 'from-yellow-400 to-amber-400' },
  { id: 'biscotti', name: 'Biscotti', icon: Cookie, calories: 160, proteins: 2, carbs: 22, fats: 7, gradient: 'from-amber-400 to-orange-400' },
  { id: 'bistecca', name: 'Bistecca', icon: Beef, calories: 271, proteins: 26, carbs: 0, fats: 18, gradient: 'from-red-500 to-red-700' },
  { id: 'salmone', name: 'Salmone', icon: Fish, calories: 208, proteins: 20, carbs: 0, fats: 13, gradient: 'from-blue-400 to-cyan-400' },
  { id: 'uova', name: 'Uova', icon: Egg, calories: 155, proteins: 13, carbs: 1, fats: 11, gradient: 'from-yellow-300 to-yellow-500' },
  { id: 'latte', name: 'Latte', icon: Milk, calories: 42, proteins: 3.4, carbs: 5, fats: 1, gradient: 'from-gray-100 to-gray-300' },
];

// Funzione per ottenere un'icona basata sul nome del cibo
const getFoodIcon = (foodName: string) => {
  const name = foodName.toLowerCase();
  
  // Mappatura sicura delle icone
  const iconMap: Record<string, any> = {
    'mela': Apple,
    'apple': Apple,
    'pizza': Pizza,
    'insalata': Salad,
    'salad': Salad,
    'panino': Sandwich,
    'sandwich': Sandwich,
    'bread': Sandwich,
    'biscotti': Cookie,
    'cookie': Cookie,
    'cake': Cookie,
    'bistecca': Beef,
    'beef': Beef,
    'carne': Beef,
    'salmone': Fish,
    'fish': Fish,
    'pesce': Fish,
    'uova': Egg,
    'egg': Egg,
    'latte': Milk,
    'milk': Milk,
    'caffè': Coffee,
    'coffee': Coffee,
    'carota': Carrot,
    'carrot': Carrot,
    'banana': Banana
  };
  
  // Cerca una corrispondenza esatta o parziale
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  
  // Fallback sicuro
  return Utensils;
};

// Funzione per ottenere un gradiente casuale
const getRandomGradient = () => {
  return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
};

export const useQuickFoods = () => {
  const { user } = useAuthStore();
  const [quickFoods, setQuickFoods] = useState<QuickFood[]>(DEFAULT_QUICK_FOODS);
  const [loading, setLoading] = useState(false);

  // Carica gli alimenti rapidi dal database
  const loadQuickFoods = async () => {
    if (!user || !supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quick_foods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error loading quick foods:', error);
        return;
      }

                    // Combina alimenti predefiniti con quelli personalizzati
       const customFoods = data?.map(food => ({
         ...food,
         id: food.id || `custom-${Date.now()}`, // Assicura che abbiano un ID
         icon: (() => {
           try {
             return FOOD_ICONS[food.icon_name as keyof typeof FOOD_ICONS] || Utensils;
           } catch (error) {
             console.warn(`Error loading icon ${food.icon_name}, using Utensils:`, error);
             return Utensils;
           }
         })()
       })) || [];

       setQuickFoods([...customFoods, ...DEFAULT_QUICK_FOODS]);
    } catch (error) {
      console.warn('Error loading quick foods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggiunge un nuovo alimento rapido
  const addQuickFood = async (foodData: {
    name: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }) => {
    if (!user || !supabase) return;

    // Controlla se l'alimento esiste già
    const existingFood = quickFoods.find(food => 
      food.name.toLowerCase() === foodData.name.toLowerCase() && 
      food.user_id === user.id
    );

    if (existingFood) {
      console.log('Alimento già esistente:', existingFood.name);
      return; // Non aggiungere duplicati
    }

    const icon = getFoodIcon(foodData.name);
    // Gestione sicura del nome dell'icona
    let iconName = 'Utensils';
    try {
      iconName = Object.keys(FOOD_ICONS).find(key => FOOD_ICONS[key as keyof typeof FOOD_ICONS] === icon) || 'Utensils';
    } catch (error) {
      console.warn('Error getting icon name, using Utensils as fallback:', error);
      iconName = 'Utensils';
    }
    const gradient = getRandomGradient();

    const newQuickFood: QuickFood = {
      id: `custom-${Date.now()}`,
      name: foodData.name,
      icon,
      calories: foodData.calories,
      proteins: foodData.proteins,
      carbs: foodData.carbs,
      fats: foodData.fats,
      gradient,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    try {
      // Salva nel database
      const { error } = await supabase
        .from('quick_foods')
        .insert([{
          user_id: user.id,
          name: foodData.name,
          icon_name: iconName,
          calories: foodData.calories,
          proteins: foodData.proteins,
          carbs: foodData.carbs,
          fats: foodData.fats,
          gradient,
        }]);

      if (error) {
        console.warn('Error saving quick food:', error);
        // Aggiungi comunque localmente
        setQuickFoods(prev => [newQuickFood, ...prev]);
        return;
      }

      // Aggiorna lo stato locale
      setQuickFoods(prev => [newQuickFood, ...prev]);
    } catch (error) {
      console.warn('Error adding quick food:', error);
      // Aggiungi comunque localmente
      setQuickFoods(prev => [newQuickFood, ...prev]);
    }
  };

  // Rimuove un alimento rapido
  const removeQuickFood = async (foodId: string) => {
    if (!user || !supabase) return;

    const foodToRemove = quickFoods.find(f => f.id === foodId);
    if (!foodToRemove) return;

    try {
      // Rimuovi dal database se è un alimento personalizzato (dal database o creato localmente)
      if (foodId.startsWith('custom-') || foodToRemove.user_id === user.id) {
        const { error } = await supabase
          .from('quick_foods')
          .delete()
          .eq('user_id', user.id)
          .eq('name', foodToRemove.name);

        if (error) {
          console.warn('Error removing quick food:', error);
        }
      }

      // Rimuovi dallo stato locale
      setQuickFoods(prev => prev.filter(food => food.id !== foodId));
    } catch (error) {
      console.warn('Error removing quick food:', error);
      // Rimuovi comunque localmente
      setQuickFoods(prev => prev.filter(food => food.id !== foodId));
    }
  };

  // Carica gli alimenti quando l'utente cambia
  useEffect(() => {
    if (user) {
      loadQuickFoods();
    } else {
      setQuickFoods(DEFAULT_QUICK_FOODS);
    }
  }, [user]);

  return {
    quickFoods,
    loading,
    addQuickFood,
    removeQuickFood,
    loadQuickFoods
  };
};

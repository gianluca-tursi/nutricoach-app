import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Camera, Mic, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useQuickFoods } from '@/hooks/useQuickFoods';

const COMMON_FOODS = [
  { name: 'Pasta al pomodoro', calories: 350, proteins: 12, carbs: 65, fats: 5 },
  { name: 'Insalata mista', calories: 120, proteins: 3, carbs: 15, fats: 6 },
  { name: 'Petto di pollo', calories: 165, proteins: 31, carbs: 0, fats: 3.6 },
  { name: 'Pizza Margherita', calories: 280, proteins: 12, carbs: 35, fats: 10 },
  { name: 'Yogurt greco', calories: 100, proteins: 10, carbs: 6, fats: 3 },
  { name: 'Mela', calories: 95, proteins: 0.5, carbs: 25, fats: 0.3 },
  { name: 'Uova strapazzate', calories: 155, proteins: 13, carbs: 1.1, fats: 11 },
  { name: 'Riso integrale', calories: 216, proteins: 5, carbs: 45, fats: 1.8 },
];

export function TrackMeal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addQuickFood } = useQuickFoods();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mealData, setMealData] = useState({
    name: '',
    description: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: '',
    meal_type: 'lunch',
  });

  const filteredFoods = COMMON_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectFood = (food: typeof COMMON_FOODS[0]) => {
    setMealData({
      ...mealData,
      name: food.name,
      calories: food.calories.toString(),
      proteins: food.proteins.toString(),
      carbs: food.carbs.toString(),
      fats: food.fats.toString(),
    });
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Salva il pasto
      const { error: mealError } = await supabase
        .from('meals')
        .insert([{
          user_id: user.id,
          name: mealData.name,
          description: mealData.description,
          calories: parseInt(mealData.calories),
          proteins: parseFloat(mealData.proteins),
          carbs: parseFloat(mealData.carbs),
          fats: parseFloat(mealData.fats),
          meal_type: mealData.meal_type,
          consumed_at: new Date().toISOString(),
        }]);

      if (mealError) throw mealError;

      // Aggiorna gli obiettivi giornalieri
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const { data: goalData, error: goalError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (goalError) {
          console.warn('Error fetching daily goal:', goalError);
        }

        if (goalData) {
          const { error: updateError } = await supabase
            .from('daily_goals')
            .update({
              consumed_calories: goalData.consumed_calories + parseInt(mealData.calories),
              consumed_proteins: goalData.consumed_proteins + parseFloat(mealData.proteins),
              consumed_carbs: goalData.consumed_carbs + parseFloat(mealData.carbs),
              consumed_fats: goalData.consumed_fats + parseFloat(mealData.fats),
            })
            .eq('id', goalData.id);

          if (updateError) throw updateError;
        } else {
          // Se non esiste un daily goal, lo creiamo
          console.log('No daily goal found for today, creating one...');
          // Il daily goal verrà creato automaticamente dalla Dashboard quando l'utente tornerà
        }
      } catch (error) {
        console.warn('Error with daily goals update:', error);
        // Continua comunque con il salvataggio del pasto
      }

      // Aggiungi agli alimenti rapidi se non esiste già
      await addQuickFood({
        name: mealData.name,
        calories: parseInt(mealData.calories),
        proteins: parseFloat(mealData.proteins),
        carbs: parseFloat(mealData.carbs),
        fats: parseFloat(mealData.fats),
      });

      toast.success('Pasto registrato con successo!');
      navigate('/');
    } catch (error: any) {
      toast.error('Errore nel salvare il pasto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-center mb-2">Registra un Pasto</h1>
        <p className="text-center text-gray-600">
          Aggiungi i dettagli del tuo pasto per tracciare i tuoi progressi
        </p>
      </motion.div>

      {/* Opzioni rapide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Camera className="h-6 w-6" />
          <span className="text-xs">Scatta Foto</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Mic className="h-6 w-6" />
          <span className="text-xs">Registra Audio</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Search className="h-6 w-6" />
          <span className="text-xs">Cerca Cibo</span>
        </Button>
      </motion.div>

      {/* Ricerca rapida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Cerca Alimento</CardTitle>
            <CardDescription>
              Seleziona un alimento comune o inserisci manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca un alimento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchQuery && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredFoods.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => selectFood(food)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{food.name}</span>
                        <span className="text-sm text-gray-500">{food.calories} kcal</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form manuale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Pasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome del pasto</Label>
                  <Input
                    id="name"
                    value={mealData.name}
                    onChange={(e) => setMealData({ ...mealData, name: e.target.value })}
                    placeholder="es. Pasta al pomodoro"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="meal_type">Tipo di pasto</Label>
                  <Select
                    value={mealData.meal_type}
                    onValueChange={(value) => setMealData({ ...mealData, meal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Colazione</SelectItem>
                      <SelectItem value="lunch">Pranzo</SelectItem>
                      <SelectItem value="dinner">Cena</SelectItem>
                      <SelectItem value="snack">Spuntino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrizione (opzionale)</Label>
                <Textarea
                  id="description"
                  value={mealData.description}
                  onChange={(e) => setMealData({ ...mealData, description: e.target.value })}
                  placeholder="Aggiungi note o ingredienti..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calorie (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={mealData.calories}
                    onChange={(e) => setMealData({ ...mealData, calories: e.target.value })}
                    placeholder="350"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="proteins">Proteine (g)</Label>
                  <Input
                    id="proteins"
                    type="number"
                    step="0.1"
                    value={mealData.proteins}
                    onChange={(e) => setMealData({ ...mealData, proteins: e.target.value })}
                    placeholder="25"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="carbs">Carboidrati (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={mealData.carbs}
                    onChange={(e) => setMealData({ ...mealData, carbs: e.target.value })}
                    placeholder="45"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fats">Grassi (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    step="0.1"
                    value={mealData.fats}
                    onChange={(e) => setMealData({ ...mealData, fats: e.target.value })}
                    placeholder="15"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva Pasto'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

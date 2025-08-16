import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Weight,
  Target,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  Archive
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface WeightEntry {
  date: string;
  weight: number;
}

interface NutritionData {
  date: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export function Progress() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<NutritionData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user, selectedPeriod]);

  const loadProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carica dati in base al periodo selezionato
      const endDate = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'week':
          startDate = subDays(endDate, 7);
          break;
        case 'month':
          startDate = subDays(endDate, 30);
          break;
        case 'year':
          startDate = subDays(endDate, 365);
          break;
      }

      // Carica storico peso con gestione errori
      try {
        const { data: weightData, error: weightError } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });

        if (weightError) {
          console.warn('Error loading weight data:', weightError);
          setWeightHistory([]);
        } else if (weightData) {
          setWeightHistory(weightData.map(w => ({
            date: format(new Date(w.created_at), 'dd/MM'),
            weight: w.weight
          })));
        }
      } catch (weightError) {
        console.warn('Error with weight logs query:', weightError);
        setWeightHistory([]);
      }

      // Carica storico nutrizione con gestione errori
      try {
        const { data: goalsData, error: goalsError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (goalsError) {
          console.warn('Error loading nutrition data:', goalsError);
          setNutritionHistory([]);
        } else if (goalsData) {
          setNutritionHistory(goalsData.map(g => ({
            date: format(new Date(g.date), 'dd/MM'),
            calories: g.consumed_calories,
            proteins: g.consumed_proteins,
            carbs: g.consumed_carbs,
            fats: g.consumed_fats
          })));
        }
      } catch (nutritionError) {
        console.warn('Error with daily_goals query:', nutritionError);
        setNutritionHistory([]);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      setWeightHistory([]);
      setNutritionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightChange = () => {
    if (weightHistory.length < 2) return { value: 0, trend: 'stable' };
    
    const firstWeight = weightHistory[0].weight;
    const lastWeight = weightHistory[weightHistory.length - 1].weight;
    const change = lastWeight - firstWeight;
    
    if (change > 0.5) return { value: change, trend: 'up' };
    if (change < -0.5) return { value: Math.abs(change), trend: 'down' };
    return { value: 0, trend: 'stable' };
  };

  const calculateAverageCalories = () => {
    if (nutritionHistory.length === 0) return 0;
    const total = nutritionHistory.reduce((sum, day) => sum + day.calories, 0);
    return Math.round(total / nutritionHistory.length);
  };

  const weightChange = calculateWeightChange();
  const avgCalories = calculateAverageCalories();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          I Tuoi Progressi
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Monitora il tuo percorso verso gli obiettivi</p>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-3"
      >
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('week')}
          className={`${
            selectedPeriod === 'week' 
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white border-0' 
              : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
          } transition-all duration-200`}
        >
          Settimana
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('month')}
          className={`${
            selectedPeriod === 'month' 
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white border-0' 
              : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
          } transition-all duration-200`}
        >
          Mese
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('year')}
          className={`${
            selectedPeriod === 'year' 
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white border-0' 
              : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
          } transition-all duration-200`}
        >
          Anno
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-white/10 p-6 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300">Peso Attuale</h3>
                <Weight className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{profile.weight} kg</div>
              <div className="flex items-center gap-2">
                {weightChange.trend === 'up' ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">+{weightChange.value.toFixed(1)} kg</span>
                  </>
                ) : weightChange.trend === 'down' ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">-{weightChange.value.toFixed(1)} kg</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Stabile</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-white/10 p-6 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300">Media Calorie</h3>
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{avgCalories}</div>
              <p className="text-sm text-gray-400">kcal/giorno</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl border border-white/10 p-6 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300">Obiettivo</h3>
                <Target className="h-5 w-5 text-orange-400" />
              </div>
              <div className="text-lg font-bold text-white mb-3">
                {profile.goal === 'lose' ? 'Perdere peso' :
                 profile.goal === 'maintain' ? 'Mantenere' :
                 profile.goal === 'gain' ? 'Aumentare massa' :
                 'Salute'}
              </div>
              <ProgressBar value={65} className="h-2 bg-gray-700" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border border-white/10 p-6 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300">Streak</h3>
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">7</div>
              <p className="text-sm text-gray-400">giorni consecutivi</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-600">
          <TabsTrigger value="weight" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Peso</TabsTrigger>
          <TabsTrigger value="calories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Calorie</TabsTrigger>
          <TabsTrigger value="macros" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Macronutrienti</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Andamento Peso</h3>
              <p className="text-gray-400">
                Il tuo peso negli ultimi {selectedPeriod === 'week' ? '7 giorni' : selectedPeriod === 'month' ? '30 giorni' : '365 giorni'}
              </p>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            ) : weightHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weightHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nessun dato disponibile per questo periodo
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calories" className="mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Calorie Giornaliere</h3>
              <p className="text-gray-400">
                Confronto tra calorie consumate e obiettivo
              </p>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            ) : nutritionHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={nutritionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nessun dato disponibile per questo periodo
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="macros" className="mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Distribuzione Macronutrienti</h3>
              <p className="text-gray-400">
                Media giornaliera di proteine, carboidrati e grassi
              </p>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            ) : nutritionHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={nutritionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="proteins" fill="#3b82f6" name="Proteine" />
                  <Bar dataKey="carbs" fill="#10b981" name="Carboidrati" />
                  <Bar dataKey="fats" fill="#f59e0b" name="Grassi" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nessun dato disponibile per questo periodo
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Traguardi Raggiunti</h3>
            <p className="text-gray-400">I tuoi successi nel percorso</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:scale-105 transition-all duration-300">
              <Award className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="font-medium text-white">Prima Settimana</p>
              <p className="text-sm text-gray-400">Completata!</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:scale-105 transition-all duration-300">
              <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="font-medium text-white">Obiettivo Calorie</p>
              <p className="text-sm text-gray-400">5 giorni di fila</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:scale-105 transition-all duration-300">
              <Activity className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-white">10.000 Passi</p>
              <p className="text-sm text-gray-400">3 volte</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:scale-105 transition-all duration-300">
              <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-white">30 Giorni</p>
              <p className="text-sm text-gray-400">In arrivo...</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Link Archivio Pasti */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Vuoi vedere il tuo archivio pasti?</h3>
            <p className="text-gray-400 mb-6">
              Accedi alla cronologia completa dei tuoi pasti registrati
            </p>
            <Button
              onClick={() => navigate('/history')}
              className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
              size="lg"
            >
              <Archive className="h-5 w-5 mr-2" />
              Archivio Pasti
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

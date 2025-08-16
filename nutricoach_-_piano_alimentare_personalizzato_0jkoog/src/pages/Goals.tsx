import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { supabase, type DailyGoal } from '@/lib/supabase';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Star
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export function Goals() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [weeklyGoals, setWeeklyGoals] = useState<DailyGoal[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGoalsData();
    }
  }, [user]);

  const loadGoalsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carica obiettivi settimanali
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data: weekData } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date');
      
      if (weekData) {
        setWeeklyGoals(weekData);
      }
      
      // Carica statistiche mensili (ultimi 30 giorni)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: monthData } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('date');
      
      if (monthData) {
        const stats = monthData.map(day => ({
          date: format(new Date(day.date), 'dd/MM'),
          calories: day.consumed_calories,
          target: day.target_calories,
          proteins: day.consumed_proteins,
          water: day.water_intake / 1000,
        }));
        setMonthlyStats(stats);
      }
      
      // Calcola achievements
      calculateAchievements(weekData || [], monthData || []);
      
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (weekData: DailyGoal[], monthData: DailyGoal[]) => {
    const newAchievements = [];
    
    // Streak di giorni consecutivi
    let currentStreak = 0;
    const sortedDays = [...monthData].reverse();
    for (const day of sortedDays) {
      if (day.consumed_calories >= day.target_calories * 0.9 && 
          day.consumed_calories <= day.target_calories * 1.1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    if (currentStreak >= 3) {
      newAchievements.push({
        id: 'streak',
        title: 'Serie Vincente',
        description: `${currentStreak} giorni consecutivi nel target`,
        icon: Zap,
        color: 'text-yellow-500',
      });
    }
    
    // Obiettivo settimanale
    const weeklySuccess = weekData.filter(day => 
      day.consumed_calories >= day.target_calories * 0.9 && 
      day.consumed_calories <= day.target_calories * 1.1
    ).length;
    
    if (weeklySuccess >= 5) {
      newAchievements.push({
        id: 'weekly',
        title: 'Settimana Perfetta',
        description: 'Obiettivi raggiunti per 5+ giorni',
        icon: Trophy,
        color: 'text-green-500',
      });
    }
    
    // Idratazione
    const wellHydratedDays = monthData.filter(day => day.water_intake >= 2000).length;
    if (wellHydratedDays >= 20) {
      newAchievements.push({
        id: 'hydration',
        title: 'Maestro dell\'Idratazione',
        description: '2L+ di acqua per 20 giorni',
        icon: Award,
        color: 'text-blue-500',
      });
    }
    
    setAchievements(newAchievements);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
                          <Trophy className="h-12 w-12 text-yellow-500 motion-safe:animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Caricamento obiettivi...</p>
        </div>
      </div>
    );
  }

  const weeklyCaloriesAvg = weeklyGoals.length > 0
    ? weeklyGoals.reduce((sum, day) => sum + day.consumed_calories, 0) / weeklyGoals.length
    : 0;

  const weeklySuccessRate = weeklyGoals.length > 0
    ? (weeklyGoals.filter(day => 
        day.consumed_calories >= day.target_calories * 0.9 && 
        day.consumed_calories <= day.target_calories * 1.1
      ).length / weeklyGoals.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">I Tuoi Obiettivi</h1>
        <p className="text-gray-600 mt-2">Monitora i tuoi progressi e raggiungi i tuoi traguardi</p>
      </motion.div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Traguardi Raggiunti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
                  >
                    <achievement.icon className={`h-8 w-8 ${achievement.color}`} />
                    <div>
                      <p className="font-semibold">{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Statistiche settimanali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Media Calorie Settimanale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(weeklyCaloriesAvg)} kcal</div>
              <p className="text-xs text-gray-500 mt-1">
                Target: {profile.daily_calories} kcal
              </p>
              <Progress 
                value={(weeklyCaloriesAvg / profile.daily_calories) * 100} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasso di Successo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(weeklySuccessRate)}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Giorni nel target questa settimana
              </p>
              <Progress value={weeklySuccessRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Obiettivo Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {profile.goal === 'lose' ? '↓' : profile.goal === 'gain' ? '↑' : '→'}
                {profile.goal === 'lose' ? '-0.5' : profile.goal === 'gain' ? '+0.5' : '0'} kg/sett
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {profile.goal === 'lose' ? 'Perdita peso' : 
                 profile.goal === 'gain' ? 'Aumento massa' : 
                 'Mantenimento'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grafici */}
      <Tabs defaultValue="calories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calories">Calorie</TabsTrigger>
          <TabsTrigger value="macros">Macronutrienti</TabsTrigger>
          <TabsTrigger value="hydration">Idratazione</TabsTrigger>
        </TabsList>

        <TabsContent value="calories">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Calorie (30 giorni)</CardTitle>
              <CardDescription>
                Confronto tra calorie consumate e obiettivo giornaliero
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#10b981" 
                      fill="#10b98120"
                      name="Obiettivo"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#3b82f6" 
                      fill="#3b82f680"
                      name="Consumate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macros">
          <Card>
            <CardHeader>
              <CardTitle>Proteine Giornaliere (30 giorni)</CardTitle>
              <CardDescription>
                Assunzione di proteine negli ultimi 30 giorni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="proteins" fill="#8b5cf6" name="Proteine (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hydration">
          <Card>
            <CardHeader>
              <CardTitle>Idratazione (30 giorni)</CardTitle>
              <CardDescription>
                Litri di acqua bevuti al giorno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="water" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="Acqua (L)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Consigli personalizzati */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Prossimi Passi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklySuccessRate < 70 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Migliora la costanza</p>
                    <p className="text-sm text-gray-600">
                      Cerca di rimanere nel target calorico per almeno 5 giorni a settimana
                    </p>
                  </div>
                </div>
              )}
              
              {weeklyCaloriesAvg < profile.daily_calories * 0.9 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Aumenta l'apporto calorico</p>
                    <p className="text-sm text-gray-600">
                      Stai consumando meno calorie del necessario. Aggiungi spuntini sani
                    </p>
                  </div>
                </div>
              )}
              
              {achievements.length === 0 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Sblocca il tuo primo traguardo</p>
                    <p className="text-sm text-gray-600">
                      Mantieni una serie di 3 giorni consecutivi nel target per iniziare
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

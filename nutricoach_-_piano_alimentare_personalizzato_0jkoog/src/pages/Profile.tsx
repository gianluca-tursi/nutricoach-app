import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  Ruler, 
  Weight, 
  Activity,
  Target,
  Apple,
  Heart,
  LogOut,
  RefreshCw,
  Save,
  Calculator
} from 'lucide-react';
import { NutritionCalculator, type UserProfile, type NutritionPlan } from '@/lib/nutritionCalculator';
import { NutritionPlanCard } from '@/components/NutritionPlanCard';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario', description: 'Poco o nessun esercizio' },
  { value: 'light', label: 'Leggermente attivo', description: '1-3 giorni a settimana' },
  { value: 'moderate', label: 'Moderatamente attivo', description: '3-5 giorni a settimana' },
  { value: 'active', label: 'Molto attivo', description: '6-7 giorni a settimana' },
  { value: 'very_active', label: 'Estremamente attivo', description: 'Esercizio intenso + lavoro fisico' },
];

const GOALS = [
  { value: 'lose_weight', label: 'Perdere peso' },
  { value: 'maintain', label: 'Mantenere il peso' },
  { value: 'gain_weight', label: 'Aumentare massa' },
  { value: 'build_muscle', label: 'Costruire muscoli' },
];

export function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profile, updateProfile, deleteProfile, resetProfile } = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age?.toString() || '',
    height: profile?.height?.toString() || '',
    weight: profile?.weight?.toString() || '',
    target_weight: profile?.target_weight?.toString() || '',
    timeframe_months: profile?.timeframe_months?.toString() || '',
    activity_level: profile?.activity_level || '',
    goal: profile?.goal || '',
    training_frequency: profile?.training_frequency?.toString() || '0',
  });



  // Calcola il piano nutrizionale quando il profilo cambia
  useEffect(() => {
    if (profile) {
      const userProfile: UserProfile = {
        age: profile.age,
        gender: profile.gender as 'male' | 'female',
        height: profile.height,
        weight: profile.weight,
        target_weight: profile.target_weight || undefined,
        timeframe_months: profile.timeframe_months || undefined,
        activity_level: profile.activity_level as any,
        goal: (profile.goal_detailed || profile.goal) as any,
        training_frequency: profile.training_frequency || 0,
        dietary_preferences: profile.dietary_restrictions
      };

      const calculator = new NutritionCalculator(userProfile);
      const plan = calculator.calculateNutritionPlan();
      setNutritionPlan(plan);
    }
  }, [
    profile?.age,
    profile?.gender,
    profile?.height,
    profile?.weight,
    profile?.target_weight,
    profile?.timeframe_months,
    profile?.activity_level,
    profile?.goal_detailed,
    profile?.goal,
    profile?.training_frequency,
    profile?.dietary_restrictions
  ]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        timeframe_months: formData.timeframe_months ? parseInt(formData.timeframe_months) : null,
        activity_level: formData.activity_level,
        goal: formData.goal,
        training_frequency: parseInt(formData.training_frequency),
      });
      
      toast.success('Profilo aggiornato con successo!');
      setEditMode(false);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Il logout ora naviga automaticamente a /auth
    } catch (error) {
      toast.error('Errore durante il logout');
    }
  };

  const handleRetakeQuiz = async () => {
    try {
      if (user) {
        // Non eliminare il profilo, solo naviga all'onboarding
        // Il profilo verrà precaricato nel quiz
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error in retake quiz:', error);
      toast.error('Errore nel riavvio del quiz');
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Il Tuo Profilo
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Gestisci le tue informazioni personali</p>
      </motion.div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-600">
          <TabsTrigger value="info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Informazioni</TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Obiettivi</TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Piano</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Informazioni Personali</h3>
                  <p className="text-gray-400">I tuoi dati personali e fisici</p>
                </div>
                {!editMode ? (
                  <Button 
                    onClick={() => setEditMode(true)} 
                    variant="outline"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    Modifica
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          full_name: profile.full_name,
                          age: profile.age.toString(),
                          height: profile.height.toString(),
                          weight: profile.weight.toString(),
                          target_weight: profile.target_weight?.toString() || '',
                          timeframe_months: profile.timeframe_months?.toString() || '',
                          activity_level: profile.activity_level,
                          goal: profile.goal,
                          training_frequency: profile.training_frequency?.toString() || '0',
                        });
                      }}
                      className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                    >
                      Annulla
                    </Button>
                    <Button 
                      onClick={handleUpdate} 
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salva
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <Label htmlFor="full_name" className="text-gray-300 mb-2 block">Nome completo</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <User className="h-5 w-5 text-blue-400" />
                      {editMode ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                        />
                      ) : (
                        <span className="font-medium text-white">{profile.full_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="email" className="text-gray-300 mb-2 block">Email</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50">
                      <Mail className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-white">{profile.email}</span>
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="age" className="text-gray-300 mb-2 block">Età</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Calendar className="h-5 w-5 text-purple-400" />
                      {editMode ? (
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                        />
                      ) : (
                        <span className="font-medium text-white">{profile.age} anni</span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label className="text-gray-300 mb-2 block">Genere</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50">
                      <User className="h-5 w-5 text-pink-400" />
                      <span className="font-medium text-white">
                        {profile.gender === 'male' ? 'Uomo' : 'Donna'}
                      </span>
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="height" className="text-gray-300 mb-2 block">Altezza</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Ruler className="h-5 w-5 text-orange-400" />
                      {editMode ? (
                        <Input
                          id="height"
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                        />
                      ) : (
                        <span className="font-medium text-white">{profile.height} cm</span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="weight" className="text-gray-300 mb-2 block">Peso</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Weight className="h-5 w-5 text-red-400" />
                      {editMode ? (
                        <Input
                          id="weight"
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                        />
                      ) : (
                        <span className="font-medium text-white">{profile.weight} kg</span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="target_weight" className="text-gray-300 mb-2 block">Peso Obiettivo</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Target className="h-5 w-5 text-green-400" />
                      {editMode ? (
                        <Input
                          id="target_weight"
                          type="number"
                          step="0.1"
                          value={formData.target_weight}
                          onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                          placeholder="70"
                        />
                      ) : (
                        <span className="font-medium text-white">
                          {profile.target_weight ? `${profile.target_weight} kg` : 'Non impostato'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="timeframe_months" className="text-gray-300 mb-2 block">Tempo Obiettivo (mesi)</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      {editMode ? (
                        <Input
                          id="timeframe_months"
                          type="number"
                          value={formData.timeframe_months}
                          onChange={(e) => setFormData({ ...formData, timeframe_months: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                          placeholder="3"
                        />
                      ) : (
                        <span className="font-medium text-white">
                          {profile.timeframe_months ? `${profile.timeframe_months} mesi` : 'Non impostato'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="training_frequency" className="text-gray-300 mb-2 block">Giorni Allenamento</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 group-hover:border-gray-500 transition-colors">
                      <Activity className="h-5 w-5 text-purple-400" />
                      {editMode ? (
                        <Input
                          id="training_frequency"
                          type="number"
                          min="0"
                          max="7"
                          value={formData.training_frequency}
                          onChange={(e) => setFormData({ ...formData, training_frequency: e.target.value })}
                          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
                          placeholder="3"
                        />
                      ) : (
                        <span className="font-medium text-white">
                          {profile.training_frequency ? `${profile.training_frequency} giorni/settimana` : '0 giorni/settimana'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Livello di attività</Label>
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    {!editMode && (
                      <span className="font-medium text-white">
                        {ACTIVITY_LEVELS.find(l => l.value === profile.activity_level)?.label}
                      </span>
                    )}
                  </div>
                  {editMode && (
                    <RadioGroup
                      value={formData.activity_level}
                      onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
                      className="space-y-2"
                    >
                      {ACTIVITY_LEVELS.map((level) => (
                        <label
                          key={level.value}
                          htmlFor={level.value}
                          className="flex items-start space-x-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 hover:border-gray-500 cursor-pointer transition-colors"
                        >
                          <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                          <div className="flex-1">
                            <div className="font-medium text-white">{level.label}</div>
                            <p className="text-sm text-gray-400">{level.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="goals">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Obiettivi Nutrizionali</h3>
                <p className="text-gray-400">I tuoi obiettivi e target giornalieri</p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-2 block">Obiettivo principale</Label>
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="h-5 w-5 text-yellow-400" />
                    {!editMode && (
                      <span className="font-medium text-white">
                        {GOALS.find(g => g.value === profile.goal)?.label}
                      </span>
                    )}
                  </div>
                  {editMode && (
                    <RadioGroup
                      value={formData.goal}
                      onValueChange={(value) => setFormData({ ...formData, goal: value })}
                      className="space-y-2"
                    >
                      {GOALS.map((goal) => (
                        <label
                          key={goal.value}
                          htmlFor={goal.value}
                          className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 border border-gray-600/50 hover:border-gray-500 cursor-pointer transition-colors"
                        >
                          <RadioGroupItem value={goal.value} id={goal.value} />
                          <span className="flex-1 text-white">{goal.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-600">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-sm text-gray-300">Calorie giornaliere</p>
                    <p className="text-2xl font-bold text-blue-400">{profile.daily_calories}</p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-sm text-gray-300">Proteine</p>
                    <p className="text-2xl font-bold text-green-400">{profile.daily_proteins}</p>
                    <p className="text-xs text-gray-400">grammi</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-sm text-gray-300">Carboidrati</p>
                    <p className="text-2xl font-bold text-yellow-400">{profile.daily_carbs}</p>
                    <p className="text-xs text-gray-400">grammi</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 hover:scale-105 transition-all duration-300">
                    <p className="text-sm text-gray-300">Grassi</p>
                    <p className="text-2xl font-bold text-red-400">{profile.daily_fats}</p>
                    <p className="text-xs text-gray-400">grammi</p>
                  </div>
                </div>
              </div>
            </div>

            {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Restrizioni Alimentari</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Apple className="h-3 w-3 mr-1" />
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.health_conditions && profile.health_conditions.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Condizioni di Salute</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.health_conditions.map((condition) => (
                    <Badge key={condition} className="bg-red-500/20 text-red-400 border-red-500/30">
                      <Heart className="h-3 w-3 mr-1" />
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="plan">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {nutritionPlan ? (
              <NutritionPlanCard plan={nutritionPlan} />
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Piano Nutrizionale</h3>
                <p className="text-gray-400">Caricamento del piano personalizzato...</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="settings">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Impostazioni Account</h3>
                <p className="text-gray-400">Gestisci il tuo account e le preferenze</p>
              </div>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  onClick={handleRetakeQuiz}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rifai il quiz iniziale
                </Button>
                
                <Button
                  variant="destructive"
                  className="w-full justify-start bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Esci
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

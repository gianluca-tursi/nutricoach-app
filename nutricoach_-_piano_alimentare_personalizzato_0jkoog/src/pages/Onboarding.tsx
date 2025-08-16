import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Calendar,
  AlertCircle,
  Heart,
  Users,
  Sparkles,
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Brain,
  Dumbbell,
  Apple,
  Battery,
  Smile,
  Mail,
  MessageCircle,
  LogOut
} from 'lucide-react';
import { NutritionCalculator, type UserProfile, type NutritionPlan } from '@/lib/nutritionCalculator';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario', description: 'Poco o nessun esercizio', icon: Battery, color: 'from-gray-400 to-gray-600' },
  { value: 'light', label: 'Leggermente attivo', description: '1-3 giorni a settimana', icon: Zap, color: 'from-yellow-400 to-orange-400' },
  { value: 'moderate', label: 'Moderatamente attivo', description: '3-5 giorni a settimana', icon: TrendingUp, color: 'from-green-400 to-teal-400' },
  { value: 'active', label: 'Molto attivo', description: '6-7 giorni a settimana', icon: Dumbbell, color: 'from-blue-400 to-purple-400' },
  { value: 'very_active', label: 'Extra attivo', description: 'Atleta o lavoro fisico', icon: Trophy, color: 'from-purple-400 to-pink-400' },
];

const GOALS = [
  { value: 'lose', label: 'Perdere peso', emoji: '🎯', gradient: 'from-red-400 to-pink-400' },
  { value: 'maintain', label: 'Mantenere il peso', emoji: '⚖️', gradient: 'from-blue-400 to-cyan-400' },
  { value: 'gain', label: 'Aumentare massa', emoji: '💪', gradient: 'from-green-400 to-emerald-400' },
  { value: 'health', label: 'Migliorare la salute', emoji: '❤️', gradient: 'from-purple-400 to-pink-400' },
];

const TIMEFRAMES = [
  { value: '1', label: '1 mese', description: 'Risultati rapidi', icon: Zap, gradient: 'from-yellow-400 to-orange-400' },
  { value: '3', label: '3 mesi', description: 'Cambiamento sostenibile', icon: Target, gradient: 'from-green-400 to-teal-400' },
  { value: '6', label: '6 mesi', description: 'Trasformazione completa', icon: Trophy, gradient: 'from-blue-400 to-purple-400' },
  { value: '12', label: '1 anno', description: 'Stile di vita', icon: Heart, gradient: 'from-purple-400 to-pink-400' },
];

const OBSTACLES = [
  { value: 'eating', label: 'Abitudini alimentari', description: 'Difficoltà a seguire una dieta', icon: Apple, gradient: 'from-red-400 to-orange-400' },
  { value: 'exercise', label: 'Poco allenamento', description: 'Mancanza di attività fisica', icon: Dumbbell, gradient: 'from-blue-400 to-cyan-400' },
  { value: 'time', label: 'Mancanza di tempo', description: 'Agenda troppo piena', icon: Clock, gradient: 'from-purple-400 to-indigo-400' },
  { value: 'motivation', label: 'Poca motivazione', description: 'Difficoltà a rimanere costante', icon: Brain, gradient: 'from-green-400 to-teal-400' },
];

const EMOTIONAL_GOALS = [
  { value: 'healthy', label: 'Vivere in modo più sano', icon: Heart, gradient: 'from-red-400 to-pink-400' },
  { value: 'energy', label: 'Potenziare la mia energia', icon: Battery, gradient: 'from-yellow-400 to-orange-400' },
  { value: 'confidence', label: 'Sentirmi meglio con il mio corpo', icon: Smile, gradient: 'from-purple-400 to-indigo-400' },
  { value: 'wellness', label: 'Benessere generale', icon: Sparkles, gradient: 'from-green-400 to-teal-400' },
];

const DIETARY_RESTRICTIONS = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'gluten_free', label: 'Senza glutine' },
  { value: 'lactose_free', label: 'Senza lattosio' },
  { value: 'keto', label: 'Chetogenica' },
  { value: 'paleo', label: 'Paleo' },
];

const HEALTH_CONDITIONS = [
  'Diabete', 'Ipertensione', 'Colesterolo alto', 'Intolleranze alimentari',
  'Allergie', 'Problemi digestivi', 'Problemi cardiaci', 'Problemi renali',
  'Gravidanza', 'Allattamento'
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { createProfile, profile, fetchProfile, upsertProfile } = useProfileStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMotivational, setShowMotivational] = useState(false);
  const [showAppBenefits, setShowAppBenefits] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    target_weight: '',
    timeframe_months: '',
    activity_level: '',
    goal: '',
    training_frequency: '0',
    obstacles: [] as string[],
    emotional_goals: [] as string[],
    dietary_restrictions: [] as string[],
    health_conditions: [] as string[],
  });

  const totalSteps = 10;
  const progress = (step / totalSteps) * 100;

  const handleLogout = async () => {
    try {
      await signOut();
      // Il logout ora naviga automaticamente a /auth
      toast.success('Logout effettuato con successo');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Errore durante il logout');
    }
  };

  // Carica il profilo esistente se presente
  useEffect(() => {
    if (user && !isProfileLoaded) {
      fetchProfile(user.id);
      setIsProfileLoaded(true);
      
      // Timeout di sicurezza per evitare loading infinito
      const timeout = setTimeout(() => {
        setIsProfileLoaded(true);
      }, 5000); // 5 secondi
      
      return () => clearTimeout(timeout);
    }
  }, [user, fetchProfile, isProfileLoaded]);

  // Precarica i dati del profilo esistente nel form
  useEffect(() => {
    if (profile && !isProfileLoaded) {
      try {
        setFormData({
          full_name: profile.full_name || '',
          age: profile.age?.toString() || '',
          gender: profile.gender || '',
          height: profile.height?.toString() || '',
          weight: profile.weight?.toString() || '',
          target_weight: profile.target_weight?.toString() || '',
          timeframe_months: profile.timeframe_months?.toString() || '',
          activity_level: profile.activity_level || '',
          goal: profile.goal || '',
          training_frequency: profile.training_frequency?.toString() || '0',
          obstacles: profile.obstacles || [],
          emotional_goals: profile.emotional_goals || [],
          dietary_restrictions: profile.dietary_restrictions || [],
          health_conditions: profile.health_conditions || [],
        });
        setIsProfileLoaded(true);
      } catch (error) {
        console.warn('Error preloading profile data:', error);
        setIsProfileLoaded(true);
      }
    }
  }, [profile, isProfileLoaded]);

  // Calcola automaticamente il piano nutrizionale quando si arriva allo step finale
  // o quando cambiano i dati rilevanti
  useEffect(() => {
    if (step === 10) {
      // Verifica che tutti i dati necessari siano presenti
      if (formData.age && formData.gender && formData.height && formData.weight && 
          formData.activity_level && formData.goal && formData.training_frequency) {
        // Ricalcola sempre quando si arriva allo step 10
        calculateDailyNeeds();
      }
    }
  }, [step, formData.age, formData.gender, formData.height, formData.weight, 
      formData.activity_level, formData.goal, formData.target_weight, formData.timeframe_months]);

  // Resetta il piano nutrizionale quando cambiano i dati rilevanti
  useEffect(() => {
    if (nutritionPlan && step < 10) {
      // Se cambiano i dati prima dello step 10, resetta il piano
      setNutritionPlan(null);
    }
  }, [formData.weight, formData.target_weight, formData.timeframe_months, formData.goal, formData.activity_level]);

  const calculateDailyNeeds = () => {
    // Mappa i valori goal per il calcolatore nutrizionale
    const goalMapping = {
      'lose': 'lose_weight',
      'gain': 'gain_weight', 
      'maintain': 'maintain',
      'health': 'maintain'
    } as const;

    const userProfile: UserProfile = {
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female',
      height: parseInt(formData.height),
      weight: parseFloat(formData.weight),
      target_weight: formData.target_weight ? parseFloat(formData.target_weight) : undefined,
      timeframe_months: formData.timeframe_months ? parseInt(formData.timeframe_months) : undefined,
      activity_level: formData.activity_level as any,
      goal: goalMapping[formData.goal as keyof typeof goalMapping] || 'maintain',
      training_frequency: parseInt(formData.training_frequency),
      dietary_preferences: formData.dietary_restrictions
    };
    const calculator = new NutritionCalculator(userProfile);
    const plan = calculator.calculateNutritionPlan();
    setNutritionPlan(plan);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Calcola il piano nutrizionale se non è stato ancora calcolato
    if (!nutritionPlan) {
      calculateDailyNeeds();
      // Aspetta un momento per il calcolo
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!nutritionPlan) {
      toast.error('Errore nel calcolo del piano nutrizionale');
      return;
    }
    
    setLoading(true);
    try {
      // Debug log per vedere i valori inviati
      console.log('=== DEBUG PROFILE UPDATE ===');
      console.log('Activity level value:', formData.activity_level);
      console.log('Activity level type:', typeof formData.activity_level);
      console.log('Activity level length:', formData.activity_level?.length);
      console.log('Activity level char codes:', formData.activity_level?.split('').map(c => c.charCodeAt(0)));
      console.log('Goal value:', formData.goal);
      console.log('Form data:', JSON.stringify(formData, null, 2));
      console.log('===========================');
      
      // Pulizia e validazione dei valori prima dell'invio
      const cleanActivityLevel = formData.activity_level?.trim().toLowerCase();
      const cleanGoal = formData.goal?.trim().toLowerCase();
      
      console.log('Cleaned activity_level:', cleanActivityLevel);
      console.log('Cleaned goal:', cleanGoal);
      
      if (!cleanActivityLevel || !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(cleanActivityLevel)) {
        console.error('Invalid activity_level:', cleanActivityLevel);
        toast.error('Livello di attività non valido');
        return;
      }
      
      if (!cleanGoal || !['lose', 'maintain', 'gain', 'health'].includes(cleanGoal)) {
        console.error('Invalid goal:', cleanGoal);
        toast.error('Obiettivo non valido');
        return;
      }

      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseFloat(formData.weight),
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : undefined,
        timeframe_months: formData.timeframe_months ? parseInt(formData.timeframe_months) : undefined,
        activity_level: cleanActivityLevel,
        goal: cleanGoal,
        training_frequency: parseInt(formData.training_frequency),
        obstacles: formData.obstacles,
        emotional_goals: formData.emotional_goals,
        dietary_restrictions: formData.dietary_restrictions,
        health_conditions: formData.health_conditions,
        daily_calories: nutritionPlan.daily_calories,
        daily_proteins: nutritionPlan.daily_proteins,
        daily_carbs: nutritionPlan.daily_carbs,
        daily_fats: nutritionPlan.daily_fats
      };

      console.log('Final profile data being sent:', JSON.stringify(profileData, null, 2));

      if (profile) {
        // Aggiorna profilo esistente usando upsert
        await upsertProfile(profileData);
        toast.success('Profilo aggiornato con successo!');
        
        // Emetti evento per aggiornare la dashboard
        console.log('Onboarding: Emitting profile-updated event');
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        // Naviga alla dashboard solo se l'aggiornamento è riuscito
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        // Crea nuovo profilo
        await createProfile(profileData);
        toast.success('Profilo creato con successo!');
        
        // Emetti evento per aggiornare la dashboard
        console.log('Onboarding: Emitting profile-updated event (create)');
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        // Naviga alla dashboard solo se la creazione è riuscita
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error: any) {
      console.error('Profile creation/update error:', error);
      toast.error(profile ? 'Errore nell\'aggiornamento del profilo' : 'Errore nella creazione del profilo');
      // Non navigare via se c'è un errore
    } finally {
      setLoading(false);
    }
  };

  const getWeightDifference = () => {
    const current = parseFloat(formData.weight);
    const target = parseFloat(formData.target_weight);
    if (!current || !target) return 0;
    return Math.abs(current - target);
  };

  const renderMotivationalScreen = () => {
    const weightDiff = getWeightDifference();
    const isLosing = parseFloat(formData.weight) > parseFloat(formData.target_weight);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <Trophy className="h-24 w-24 mx-auto text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
        </motion.div>
        
        <h2 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            {isLosing ? 'Perdere' : 'Guadagnare'} {weightDiff}kg è un ottimo obiettivo!
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 max-w-md mx-auto">
          In {formData.timeframe_months} {parseInt(formData.timeframe_months) === 1 ? 'mese' : 'mesi'} puoi trasformare completamente il tuo corpo e la tua vita.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mt-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-dark rounded-2xl p-4"
          >
            <Target className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm text-gray-300">Obiettivo chiaro</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-dark rounded-2xl p-4"
          >
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-sm text-gray-300">Tempo realistico</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-dark rounded-2xl p-4"
          >
            <Heart className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-gray-300">Motivazione forte</p>
          </motion.div>
        </div>
        
        <Button
          onClick={() => {
            setShowMotivational(false);
            setShowAppBenefits(true);
          }}
          className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
          size="lg"
        >
          Continua
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    );
  };

  const renderAppBenefitsScreen = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-24 w-24 mx-auto text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]" />
        </motion.div>
        
        <h2 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Con Lumari è più facile!
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 max-w-md mx-auto">
          Il 92% dei nostri utenti raggiunge i propri obiettivi grazie al nostro sistema personalizzato
        </p>
        
        <div className="space-y-4 mt-8">
          {[
            { icon: Brain, text: 'AI che impara dalle tue abitudini', gradient: 'from-purple-400 to-pink-400' },
            { icon: Apple, text: 'Piani alimentari personalizzati', gradient: 'from-green-400 to-teal-400' },
            { icon: Trophy, text: 'Supporto motivazionale continuo', gradient: 'from-yellow-400 to-orange-400' },
            { icon: Users, text: 'Community di supporto', gradient: 'from-blue-400 to-cyan-400' },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 glass-dark rounded-2xl p-4 max-w-md mx-auto"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-r ${benefit.gradient} bg-opacity-20`}>
                <benefit.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-left text-gray-300">{benefit.text}</p>
            </motion.div>
          ))}
        </div>
        
        <Button
          onClick={() => {
            setShowAppBenefits(false);
            setStep(step + 1);
          }}
          className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
          size="lg"
        >
          Iniziamo!
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    );
  };

  const renderStep = () => {
    if (showMotivational) return renderMotivationalScreen();
    if (showAppBenefits) return renderAppBenefitsScreen();
    
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-gray-300">Come ti chiami?</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Mario Rossi"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="age" className="text-gray-300">Quanti anni hai?</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="25"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Genere</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                className="mt-2 space-y-3"
              >
                {[
                  { value: 'male', label: 'Uomo', icon: '👨' },
                  { value: 'female', label: 'Donna', icon: '👩' }
                ].map((option) => (
                  <label 
                    key={option.value}
                    htmlFor={option.value} 
                    className="flex items-center space-x-3 p-4 rounded-2xl glass-dark hover:bg-gray-800/50 cursor-pointer transition-all group"
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="text-green-400" />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="flex-1 text-white group-hover:text-green-400 transition-colors">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="height" className="text-gray-300">Altezza (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="175"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="weight" className="text-gray-300">Peso attuale (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="70"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="target_weight" className="text-gray-300">Peso obiettivo (kg)</Label>
              <Input
                id="target_weight"
                type="number"
                value={formData.target_weight}
                onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                placeholder="65"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              {formData.weight && formData.target_weight && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-gray-400"
                >
                  Differenza: {getWeightDifference()}kg
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="training_frequency" className="text-gray-300">Giorni di allenamento a settimana</Label>
              <Input
                id="training_frequency"
                type="number"
                min="0"
                max="7"
                value={formData.training_frequency}
                onChange={(e) => setFormData({ ...formData, training_frequency: e.target.value })}
                placeholder="3"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">In quanto tempo vuoi raggiungere il tuo obiettivo?</Label>
            <div className="grid grid-cols-2 gap-4">
              {TIMEFRAMES.map((timeframe) => (
                <motion.button
                  key={timeframe.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, timeframe_months: timeframe.value })}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                    formData.timeframe_months === timeframe.value
                      ? 'ring-2 ring-white/50'
                      : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${timeframe.gradient} opacity-20`} />
                  <div className="relative flex flex-col items-center gap-2">
                    <timeframe.icon className="h-8 w-8 text-white" />
                    <span className="font-medium text-white">{timeframe.label}</span>
                    <span className="text-xs text-gray-400">{timeframe.description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">Quanto sei attivo?</Label>
            <RadioGroup
              value={formData.activity_level}
              onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
              className="space-y-3"
            >
              {ACTIVITY_LEVELS.map((level) => (
                <motion.label
                  key={level.value}
                  whileHover={{ scale: 1.01 }}
                  htmlFor={level.value}
                  className="flex items-start space-x-3 p-4 rounded-2xl glass-dark hover:bg-gray-800/50 cursor-pointer transition-all group"
                >
                  <RadioGroupItem 
                    value={level.value} 
                    id={level.value} 
                    className="mt-1 text-green-400" 
                  />
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${level.color} bg-opacity-20`}>
                    <level.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white group-hover:text-green-400 transition-colors">
                      {level.label}
                    </div>
                    <p className="text-sm text-gray-400">{level.description}</p>
                  </div>
                </motion.label>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">Qual è il tuo obiettivo principale?</Label>
            <div className="grid grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <motion.button
                  key={goal.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, goal: goal.value })}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                    formData.goal === goal.value
                      ? 'ring-2 ring-white/50'
                      : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${goal.gradient} opacity-20`} />
                  <div className="relative flex flex-col items-center gap-2">
                    <span className="text-3xl">{goal.emoji}</span>
                    <span className="font-medium text-white">{goal.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">Cosa ti impedisce oggi di raggiungere i tuoi risultati?</Label>
            <div className="space-y-3">
              {OBSTACLES.map((obstacle) => (
                <motion.label
                  key={obstacle.value}
                  whileHover={{ scale: 1.01 }}
                  htmlFor={obstacle.value}
                  className="flex items-center space-x-3 p-4 rounded-2xl glass-dark hover:bg-gray-800/50 cursor-pointer transition-all"
                >
                  <Checkbox
                    id={obstacle.value}
                    checked={formData.obstacles.includes(obstacle.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          obstacles: [...formData.obstacles, obstacle.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          obstacles: formData.obstacles.filter((o) => o !== obstacle.value),
                        });
                      }
                    }}
                    className="text-green-400"
                  />
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${obstacle.gradient} bg-opacity-20`}>
                    <obstacle.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white">{obstacle.label}</span>
                    <p className="text-sm text-gray-400">{obstacle.description}</p>
                  </div>
                </motion.label>
              ))}
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">Cosa vorresti realizzare?</Label>
            <p className="text-sm text-gray-400">Scegli ciò che ti motiva di più</p>
            <div className="space-y-3">
              {EMOTIONAL_GOALS.map((goal) => (
                <motion.label
                  key={goal.value}
                  whileHover={{ scale: 1.01 }}
                  htmlFor={goal.value}
                  className="flex items-center space-x-3 p-4 rounded-2xl glass-dark hover:bg-gray-800/50 cursor-pointer transition-all"
                >
                  <Checkbox
                    id={goal.value}
                    checked={formData.emotional_goals.includes(goal.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          emotional_goals: [...formData.emotional_goals, goal.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          emotional_goals: formData.emotional_goals.filter((g) => g !== goal.value),
                        });
                      }
                    }}
                    className="text-green-400"
                  />
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${goal.gradient} bg-opacity-20`}>
                    <goal.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="flex-1 text-white">{goal.label}</span>
                </motion.label>
              ))}
            </div>
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-4">
            <Label className="text-gray-300">Hai restrizioni alimentari?</Label>
            <div className="space-y-2">
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <motion.label
                  key={restriction.value}
                  whileHover={{ scale: 1.01 }}
                  htmlFor={restriction.value}
                  className="flex items-center space-x-3 p-3 rounded-xl glass-dark hover:bg-gray-800/50 cursor-pointer transition-all"
                >
                  <Checkbox
                    id={restriction.value}
                    checked={formData.dietary_restrictions.includes(restriction.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          dietary_restrictions: [...formData.dietary_restrictions, restriction.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          dietary_restrictions: formData.dietary_restrictions.filter(
                            (r) => r !== restriction.value
                          ),
                        });
                      }
                    }}
                    className="text-green-400"
                  />
                  <span className="flex-1 text-white">{restriction.label}</span>
                </motion.label>
              ))}
            </div>
          </div>
        );
        
      case 9:
        // Dopo le restrizioni alimentari, mostra le schermate motivazionali
        if (step === 9 && !showMotivational && !showAppBenefits) {
          setShowMotivational(true);
          return null;
        }
        break;
        
      case 10:
        return (
          <div className="space-y-6">
            {/* Piano Nutrizionale Calcolato */}
            {nutritionPlan && (
              <div className="glass-dark rounded-2xl p-6 mb-6">
                <div className="text-center mb-4">
                  <Target className="h-12 w-12 mx-auto mb-3 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Il Tuo Piano Nutrizionale
                  </h3>
                  <p className="text-gray-400">
                    Basato sui tuoi obiettivi e dati personali
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">
                      {nutritionPlan.daily_calories.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-300">kcal/giorno</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">
                      {getWeightDifference()}
                    </div>
                    <div className="text-sm text-gray-300">kg da {formData.goal === 'lose' ? 'perdere' : formData.goal === 'gain' ? 'aumentare' : 'mantenere'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gray-800/50">
                    <div className="text-lg font-bold text-orange-400">
                      {nutritionPlan.daily_proteins}g
                    </div>
                    <div className="text-xs text-gray-400">Proteine</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/50">
                    <div className="text-lg font-bold text-yellow-400">
                      {nutritionPlan.daily_carbs}g
                    </div>
                    <div className="text-xs text-gray-400">Carboidrati</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/50">
                    <div className="text-lg font-bold text-red-400">
                      {nutritionPlan.daily_fats}g
                    </div>
                    <div className="text-xs text-gray-400">Grassi</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sezione Condivisione */}
            <div className="text-center space-y-4">
              <div className="glass-dark rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Invita i tuoi amici via WhatsApp
                </h4>
                <p className="text-gray-300 mb-4">
                  Condividi la tua esperienza e aiuta i tuoi amici a iniziare il loro percorso verso una vita più sana
                </p>
                
                <Button
                  onClick={() => {
                    const message = encodeURIComponent("Ehilà! Sto usando questa app per il nutrimento, provala e dimmi che ne pensi...\n\nLink app: https://lumariai.netlify.app/");
                    const whatsappUrl = `https://wa.me/?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 w-full"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Condividi su WhatsApp
                </Button>
              </div>
              
              <p className="text-sm text-gray-400">
                <MessageCircle className="inline h-4 w-4 mr-1" />
                Si aprirà WhatsApp con un messaggio predefinito
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.full_name && formData.age && formData.gender;
      case 2:
        return formData.height && formData.weight && formData.target_weight && formData.training_frequency;
      case 3:
        return formData.timeframe_months;
      case 4:
        return formData.activity_level;
      case 5:
        return formData.goal;
      case 6:
        return formData.obstacles.length > 0;
      case 7:
        return formData.emotional_goals.length > 0;
      case 8:
        return true;
      case 9:
        return true;
      case 10:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 mesh-gradient opacity-50" />
      <div className="fixed inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[128px] opacity-30 animate-morph" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] opacity-30 animate-morph animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500 rounded-full filter blur-[128px] opacity-20 animate-morph animation-delay-4000" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="glass-dark rounded-3xl p-8">
            {!showMotivational && !showAppBenefits && (
              <>
                <div className="mb-8 relative">
                  {/* Tasto Logout in alto a destra */}
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                  
                  <h1 className="text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {profile ? 'Aggiorniamo il tuo profilo' : 'Creiamo il tuo profilo'}
                    </span>
                  </h1>
                  <p className="text-gray-400">
                    Passo {step} di {totalSteps}
                    {profile && (
                      <span className="block text-sm text-green-400 mt-1">
                        ✓ Profilo esistente caricato
                      </span>
                    )}
                  </p>
                  <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                      style={{
                        boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`${step}-${showMotivational}-${showAppBenefits}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
            
            {!showMotivational && !showAppBenefits && (
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Indietro
                </Button>
                
                {step < totalSteps ? (
                  <Button
                    onClick={() => {
                      if (step === 8) {
                        setStep(9);
                      } else {
                        setStep(step + 1);
                      }
                    }}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
                  >
                    Avanti
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || loading}
                    className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
                  >
                    {loading ? 'Salvataggio...' : (profile ? 'Aggiorna Profilo' : 'Completa')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

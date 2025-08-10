import { useState } from 'react';
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
  SkipForward
} from 'lucide-react';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario', description: 'Poco o nessun esercizio', icon: Battery, color: 'from-gray-400 to-gray-600' },
  { value: 'light', label: 'Leggermente attivo', description: '1-3 giorni a settimana', icon: Zap, color: 'from-yellow-400 to-orange-400' },
  { value: 'moderate', label: 'Moderatamente attivo', description: '3-5 giorni a settimana', icon: TrendingUp, color: 'from-green-400 to-teal-400' },
  { value: 'active', label: 'Molto attivo', description: '6-7 giorni a settimana', icon: Dumbbell, color: 'from-blue-400 to-purple-400' },
  { value: 'extra', label: 'Extra attivo', description: 'Atleta o lavoro fisico', icon: Trophy, color: 'from-purple-400 to-pink-400' },
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

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { upsertProfile } = useProfileStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMotivational, setShowMotivational] = useState(false);
  const [showAppBenefits, setShowAppBenefits] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    target_weight: '',
    timeframe: '',
    activity_level: '',
    goal: '',
    obstacles: [] as string[],
    emotional_goals: [] as string[],
    dietary_restrictions: [] as string[],
    health_conditions: [] as string[],
    friend_email: '',
  });

  const totalSteps = 11;
  const progress = (step / totalSteps) * 100;

  const calculateDailyNeeds = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);
    const gender = formData.gender;
    
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9,
    };
    
    const tdee = bmr * activityMultipliers[formData.activity_level as keyof typeof activityMultipliers];
    
    let dailyCalories = tdee;
    if (formData.goal === 'lose') dailyCalories -= 500;
    if (formData.goal === 'gain') dailyCalories += 500;
    
    const dailyProteins = (dailyCalories * 0.30) / 4;
    const dailyCarbs = (dailyCalories * 0.40) / 4;
    const dailyFats = (dailyCalories * 0.30) / 9;
    
    return {
      daily_calories: Math.round(dailyCalories),
      daily_proteins: Math.round(dailyProteins),
      daily_carbs: Math.round(dailyCarbs),
      daily_fats: Math.round(dailyFats),
    };
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per creare un profilo');
      navigate('/auth');
      return;
    }
    
    // Validazione dei valori
    const age = parseInt(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const targetWeight = parseFloat(formData.target_weight);
    
    if (age < 10 || age > 120) {
      toast.error('L\'età deve essere tra 10 e 120 anni');
      return;
    }
    
    if (height < 100 || height > 250) {
      toast.error('L\'altezza deve essere tra 100 e 250 cm');
      return;
    }
    
    if (weight < 30 || weight > 300) {
      toast.error('Il peso deve essere tra 30 e 300 kg');
      return;
    }
    
    if (targetWeight < 30 || targetWeight > 300) {
      toast.error('Il peso obiettivo deve essere tra 30 e 300 kg');
      return;
    }
    
    setLoading(true);
    try {
      const dailyNeeds = calculateDailyNeeds();
      
      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: formData.full_name,
        age: age,
        gender: formData.gender,
        height: height,
        weight: weight,
        target_weight: targetWeight,
        timeframe_months: parseInt(formData.timeframe),
        activity_level: formData.activity_level,
        goal: formData.goal,
        obstacles: formData.obstacles,
        emotional_goals: formData.emotional_goals,
        dietary_restrictions: formData.dietary_restrictions,
        health_conditions: formData.health_conditions,
        ...dailyNeeds,
      };
      

      
      await upsertProfile(profileData);
      
      // Se c'è un'email dell'amico, salvala per l'invito
      if (formData.friend_email) {
        // Qui potresti salvare l'invito in una tabella dedicata

      }
      
      toast.success('Profilo creato con successo!');
      
      // Piccolo delay per evitare conflitti di caricamento
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error: any) {
      console.error('Profile creation error:', error);
      toast.error('Errore nella creazione del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per saltare il quiz');
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    try {
      // Crea un profilo minimo con valori di default
      const defaultProfile = {
        id: user.id,
        email: user.email!,
        full_name: user.email?.split('@')[0] || 'Utente',
        age: 25,
        gender: 'male', // Cambiato da 'other' a 'male' per rispettare il constraint del database
        height: 170,
        weight: 70,
        target_weight: 70,
        timeframe_months: 6,
        activity_level: 'moderate',
        goal: 'maintain',
        obstacles: ['tempo'],
        emotional_goals: ['energia'],
        dietary_restrictions: [],
        health_conditions: [],
        daily_calories: 2000,
        daily_proteins: 150,
        daily_carbs: 250,
        daily_fats: 67,
      };
      
      await upsertProfile(defaultProfile);
      
      toast.success('Quiz saltato! Puoi completare il tuo profilo più tardi.');
      
      // Piccolo delay per evitare conflitti di caricamento
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error: any) {
      console.error('Error skipping quiz:', error);
      toast.error('Errore nel saltare il quiz');
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
          In {formData.timeframe} {parseInt(formData.timeframe) === 1 ? 'mese' : 'mesi'} puoi trasformare completamente il tuo corpo e la tua vita.
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
            Con NutriCoach è più facile!
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
                min="10"
                max="120"
                value={formData.age}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value;
                  // consenti la digitazione libera di cifre (max 3), la validazione avviene al submit
                  if (value === '' || /^\d{0,3}$/.test(value)) {
                    setFormData({ ...formData, age: value });
                  }
                }}
                placeholder="25"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Età tra 10 e 120 anni</p>
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
                min="100"
                max="250"
                value={formData.height}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{0,3}$/.test(value)) {
                    setFormData({ ...formData, height: value });
                  }
                }}
                placeholder="175"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Altezza tra 100 e 250 cm</p>
            </div>
            
            <div>
              <Label htmlFor="weight" className="text-gray-300">Peso attuale (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="30"
                max="300"
                value={formData.weight}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{0,3}$/.test(value)) {
                    setFormData({ ...formData, weight: value });
                  }
                }}
                placeholder="70"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Peso tra 30 e 300 kg</p>
            </div>
            
            <div>
              <Label htmlFor="target_weight" className="text-gray-300">Peso obiettivo (kg)</Label>
              <Input
                id="target_weight"
                type="number"
                min="30"
                max="300"
                value={formData.target_weight}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{0,3}$/.test(value)) {
                    setFormData({ ...formData, target_weight: value });
                  }
                }}
                placeholder="65"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Peso obiettivo tra 30 e 300 kg</p>
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
                  onClick={() => setFormData({ ...formData, timeframe: timeframe.value })}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                    formData.timeframe === timeframe.value
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
            <div className="text-center mb-6">
              <Users className="h-16 w-16 mx-auto mb-4 text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
              <h3 className="text-2xl font-bold text-white mb-2">
                NutriCoach è esclusivo
              </h3>
              <p className="text-gray-400">
                Questa app è disponibile solo su invito. Vuoi invitare un amico?
              </p>
            </div>
            
            <div>
              <Label htmlFor="friend_email" className="text-gray-300">Email del tuo amico (opzionale)</Label>
              <Input
                id="friend_email"
                type="email"
                value={formData.friend_email}
                onChange={(e) => setFormData({ ...formData, friend_email: e.target.value })}
                placeholder="amico@email.com"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-sm text-gray-400 mt-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Riceverà un invito esclusivo per unirsi a NutriCoach
              </p>
            </div>
          </div>
        );
      
      case 11:
        // Schermata invito WhatsApp
        const signupLink = `${window.location.origin}/auth?signup=1`;
        const whatsappText = encodeURIComponent(
          `Sto usando questa app, secondo me ti piace... fammi sapere poi! ${signupLink}`
        );
        const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <Users className="h-16 w-16 mx-auto mb-2 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
              <h3 className="text-2xl font-bold text-white">Invita un amico</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Invita almeno un amico a cui pensi possa far piacere l'app. Aiuterai lo sviluppo e la diffusione di NutriCoach, te ne siamo grati!
              </p>
            </div>
            <div>
              <Button
                onClick={() => window.open(whatsappUrl, '_blank')}
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:opacity-90"
                size="lg"
              >
                Invita tramite WhatsApp
              </Button>
              <p className="text-xs text-gray-500 mt-3">Il messaggio conterrà il link diretto alla registrazione.</p>
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
        return formData.height && formData.weight && formData.target_weight;
      case 3:
        return formData.timeframe;
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
      case 11:
        // Schermata invito WhatsApp: permetti di completare senza vincoli
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
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold">
                      <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Creiamo il tuo profilo
                      </span>
                    </h1>
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      disabled={loading}
                      className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Salta
                    </Button>
                  </div>
                  <p className="text-gray-400">
                    Passo {step} di {totalSteps}
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
              <div className="space-y-4 mt-8">
                {/* Tasto Skip prominente per i primi passi */}
                {step <= 3 && (
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Salta il quiz e vai al dashboard
                  </Button>
                )}
                
                <div className="flex justify-between">
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
                        } else if (step === 10) {
                          setStep(11);
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
                      {loading ? 'Salvataggio...' : 'Completa'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

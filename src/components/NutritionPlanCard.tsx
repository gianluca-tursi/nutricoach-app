import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Heart, 
  Calculator,
  Zap,
  Apple,
  Beef,
  Cookie
} from 'lucide-react';
import { type NutritionPlan } from '@/lib/nutritionCalculator';

interface NutritionPlanCardProps {
  plan: NutritionPlan;
  consumed?: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
  className?: string;
}

const getGoalIcon = (weeklyChange: number) => {
  if (weeklyChange > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (weeklyChange < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-blue-400" />;
};

const getGoalColor = (weeklyChange: number) => {
  if (weeklyChange > 0) return 'text-green-400';
  if (weeklyChange < 0) return 'text-red-400';
  return 'text-blue-400';
};

const getMacroIcon = (macro: string) => {
  switch (macro) {
    case 'proteins': return <Beef className="w-4 h-4" />;
    case 'carbs': return <Cookie className="w-4 h-4" />;
    case 'fats': return <Apple className="w-4 h-4" />;
    default: return <Zap className="w-4 h-4" />;
  }
};

const getMacroColor = (macro: string) => {
  switch (macro) {
    case 'proteins': return 'text-green-400';
    case 'carbs': return 'text-yellow-400';
    case 'fats': return 'text-red-400';
    default: return 'text-blue-400';
  }
};

const getMacroBgColor = (macro: string) => {
  switch (macro) {
    case 'proteins': return 'bg-green-500/20 border-green-500/30';
    case 'carbs': return 'bg-yellow-500/20 border-yellow-500/30';
    case 'fats': return 'bg-red-500/20 border-red-500/30';
    default: return 'bg-blue-500/20 border-blue-500/30';
  }
};

const getMealIcon = (meal: string) => {
  switch (meal) {
    case 'breakfast': return '🌅';
    case 'lunch': return '🌞';
    case 'dinner': return '🌙';
    case 'snacks': return '🍎';
    default: return '🍽️';
  }
};

export const NutritionPlanCard = memo<NutritionPlanCardProps>(({ 
  plan, 
  consumed, 
  className = '' 
}) => {
  const calculateProgress = (target: number, actual: number) => {
    return Math.min((actual / target) * 100, 100);
  };

  const getRemaining = (target: number, actual: number) => {
    return Math.max(target - actual, 0);
  };

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              Piano Nutrizionale
            </CardTitle>
            <CardDescription className="text-gray-400">
              Calorie e macronutrienti giornalieri
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-400">
            Personalizzato
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Obiettivo e Cambio Peso */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Calorie Giornaliere</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {plan.daily_calories.toLocaleString('it-IT')}
            </p>
            <p className="text-xs text-gray-400">kcal</p>
            {consumed && (
              <Progress 
                value={calculateProgress(plan.daily_calories, consumed.calories)} 
                className="mt-2 h-2"
              />
            )}
          </div>

          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getGoalIcon(plan.weekly_weight_change)}
              <span className="text-sm text-gray-300">Cambio Peso</span>
            </div>
            <p className={`text-2xl font-bold ${getGoalColor(plan.weekly_weight_change)}`}>
              {plan.weekly_weight_change > 0 ? '+' : ''}{plan.weekly_weight_change}
            </p>
            <p className="text-xs text-gray-400">kg/settimana</p>
          </div>
        </div>

        {/* Macronutrienti */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Macronutrienti
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'proteins', label: 'Proteine', value: plan.daily_proteins, unit: 'g' },
              { key: 'carbs', label: 'Carboidrati', value: plan.daily_carbs, unit: 'g' },
              { key: 'fats', label: 'Grassi', value: plan.daily_fats, unit: 'g' }
            ].map((macro) => (
              <div key={macro.key} className={`text-center p-3 rounded-xl border ${getMacroBgColor(macro.key)}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getMacroIcon(macro.key)}
                  <span className="text-sm text-gray-300">{macro.label}</span>
                </div>
                <p className={`text-xl font-bold ${getMacroColor(macro.key)}`}>
                  {macro.value}
                </p>
                <p className="text-xs text-gray-400">{macro.unit}</p>
                {consumed && (
                  <Progress 
                    value={calculateProgress(
                      macro.value, 
                      consumed[macro.key as keyof typeof consumed]
                    )} 
                    className="mt-2 h-1"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Distribuzione Pasti */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Distribuzione Pasti
          </h4>
          <div className="space-y-3">
            {Object.entries(plan.meal_distribution).map(([meal, macros]) => (
              <div key={meal} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getMealIcon(meal)}</span>
                  <span className="text-white capitalize font-medium">{meal}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-400 font-medium">{macros.calories} kcal</span>
                  <div className="flex gap-2">
                    <span className="text-green-400">P: {macros.proteins}g</span>
                    <span className="text-yellow-400">C: {macros.carbs}g</span>
                    <span className="text-red-400">G: {macros.fats}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raccomandazioni */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Raccomandazioni
          </h4>
          <div className="space-y-2">
            {plan.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-800 rounded-lg">
                <Heart className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progresso (se disponibile) */}
        {consumed && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Progresso Oggi</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Calorie</span>
                  <span className="text-gray-400">
                    {consumed.calories} / {plan.daily_calories} kcal
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(plan.daily_calories, consumed.calories)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rimanenti: {getRemaining(plan.daily_calories, consumed.calories)} kcal
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'proteins', label: 'Proteine', target: plan.daily_proteins, consumed: consumed.proteins },
                  { key: 'carbs', label: 'Carboidrati', target: plan.daily_carbs, consumed: consumed.carbs },
                  { key: 'fats', label: 'Grassi', target: plan.daily_fats, consumed: consumed.fats }
                ].map((macro) => (
                  <div key={macro.key} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getMacroIcon(macro.key)}
                      <span className="text-xs text-gray-300">{macro.label}</span>
                    </div>
                    <Progress 
                      value={calculateProgress(macro.target, macro.consumed)} 
                      className="h-1 mb-1"
                    />
                    <p className="text-xs text-gray-400">
                      {macro.consumed}/{macro.target}g
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NutritionPlanCard.displayName = 'NutritionPlanCard';

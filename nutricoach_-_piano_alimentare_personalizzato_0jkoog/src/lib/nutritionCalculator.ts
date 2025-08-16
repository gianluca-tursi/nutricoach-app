// Sistema avanzato di calcolo nutrizionale per NutriCoach
// Basato su formule scientifiche e best practices nutrizionali

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
  target_weight?: number; // in kg
  timeframe_months?: number; // mesi per raggiungere l'obiettivo
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';
  body_fat_percentage?: number; // percentuale di grasso corporeo
  training_frequency?: number; // giorni di allenamento per settimana
  dietary_preferences?: string[]; // preferenze alimentari
}

export interface NutritionPlan {
  daily_calories: number;
  daily_proteins: number;
  daily_carbs: number;
  daily_fats: number;
  meal_distribution: {
    breakfast: { calories: number; proteins: number; carbs: number; fats: number };
    lunch: { calories: number; proteins: number; carbs: number; fats: number };
    dinner: { calories: number; proteins: number; carbs: number; fats: number };
    snacks: { calories: number; proteins: number; carbs: number; fats: number };
  };
  recommendations: string[];
  weekly_weight_change: number; // kg per settimana
}

export class NutritionCalculator {
  private profile: UserProfile;

  constructor(profile: UserProfile) {
    this.profile = profile;
  }

  /**
   * Calcola il BMR usando la formula di Mifflin-St Jeor (più accurata)
   */
  private calculateBMR(): number {
    const { weight, height, age, gender } = this.profile;
    
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  /**
   * Calcola il TDEE con moltiplicatori di attività aggiornati
   */
  private calculateTDEE(): number {
    const bmr = this.calculateBMR();
    
    const activityMultipliers = {
      sedentary: 1.2,        // Poco o nessun esercizio
      light: 1.375,          // Esercizio leggero 1-3 giorni/settimana
      moderate: 1.55,        // Esercizio moderato 3-5 giorni/settimana
      active: 1.725,         // Esercizio intenso 6-7 giorni/settimana
      very_active: 1.9       // Esercizio molto intenso + lavoro fisico
    };

    return bmr * activityMultipliers[this.profile.activity_level];
  }

  /**
   * Calcola il deficit/surplus calorico personalizzato
   */
  private calculateCalorieAdjustment(): number {
    const tdee = this.calculateTDEE();
    
    if (this.profile.goal === 'maintain') {
      return 0;
    }

    if (this.profile.goal === 'lose_weight' && this.profile.target_weight && this.profile.timeframe_months) {
      const weightToLose = this.profile.weight - this.profile.target_weight;
      const weeklyWeightLoss = weightToLose / (this.profile.timeframe_months * 4.33); // settimane
      const weeklyDeficit = weeklyWeightLoss * 7700; // 7700 kcal = 1kg di grasso
      const dailyDeficit = weeklyDeficit / 7;
      
      // Limita il deficit a valori sicuri (max 25% del TDEE)
      const maxSafeDeficit = tdee * 0.25;
      return -Math.min(Math.abs(dailyDeficit), maxSafeDeficit);
    }

    if (this.profile.goal === 'gain_weight' && this.profile.target_weight && this.profile.timeframe_months) {
      const weightToGain = this.profile.target_weight - this.profile.weight;
      const weeklyWeightGain = weightToGain / (this.profile.timeframe_months * 4.33);
      const weeklySurplus = weeklyWeightGain * 7700;
      const dailySurplus = weeklySurplus / 7;
      
      // Limita il surplus a valori sicuri (max 20% del TDEE)
      const maxSafeSurplus = tdee * 0.20;
      return Math.min(dailySurplus, maxSafeSurplus);
    }

    // Valori di default se non specificato target/timeframe
    if (this.profile.goal === 'lose_weight') {
      return -Math.min(500, tdee * 0.20); // Deficit di 500 kcal o 20% del TDEE
    }
    
    if (this.profile.goal === 'gain_weight') {
      return Math.min(300, tdee * 0.15); // Surplus di 300 kcal o 15% del TDEE
    }

    return 0;
  }

  /**
   * Calcola la distribuzione dinamica dei macronutrienti
   */
  private calculateMacronutrients(calories: number): { proteins: number; carbs: number; fats: number } {
    const { weight, goal, training_frequency = 0 } = this.profile;

    let proteins: number;
    let carbs: number;
    let fats: number;

    switch (goal) {
      case 'lose_weight':
        // Per perdita peso: proteine alte, grassi moderati, carboidrati variabili
        proteins = Math.max(1.6 * weight, 0.25 * calories / 4); // Min 1.6g/kg o 25% delle calorie
        fats = 0.25 * calories / 9; // 25% delle calorie
        carbs = (calories - (proteins * 4) - (fats * 9)) / 4; // Resto
        break;

      case 'gain_weight':
      case 'build_muscle':
        // Per aumento massa: proteine alte, carboidrati alti, grassi moderati
        proteins = Math.max(2.0 * weight, 0.30 * calories / 4); // Min 2.0g/kg o 30% delle calorie
        carbs = 0.45 * calories / 4; // 45% delle calorie
        fats = (calories - (proteins * 4) - (carbs * 4)) / 9; // Resto
        break;

      case 'maintain':
      default:
        // Per mantenimento: distribuzione bilanciata
        proteins = Math.max(1.2 * weight, 0.20 * calories / 4); // Min 1.2g/kg o 20% delle calorie
        carbs = 0.50 * calories / 4; // 50% delle calorie
        fats = (calories - (proteins * 4) - (carbs * 4)) / 9; // Resto
        break;
    }

    // Assicura che i grassi non scendano sotto il minimo (20% delle calorie)
    const minFats = 0.20 * calories / 9;
    if (fats < minFats) {
      fats = minFats;
      // Ricalcola carboidrati
      carbs = (calories - (proteins * 4) - (fats * 9)) / 4;
    }

    // Assicura che i carboidrati non scendano sotto il minimo (100g)
    if (carbs < 100) {
      carbs = 100;
      // Ricalcola grassi
      fats = (calories - (proteins * 4) - (carbs * 4)) / 9;
    }

    return {
      proteins: Math.round(proteins),
      carbs: Math.round(carbs),
      fats: Math.round(fats)
    };
  }

  /**
   * Calcola la distribuzione dei pasti
   */
  private calculateMealDistribution(calories: number, proteins: number, carbs: number, fats: number) {
    const { goal, training_frequency = 0 } = this.profile;

    // Distribuzione base
    let breakfastRatio = 0.25;
    let lunchRatio = 0.35;
    let dinnerRatio = 0.30;
    let snacksRatio = 0.10;

    // Adatta in base all'obiettivo e allenamento
    if (goal === 'build_muscle' && training_frequency > 3) {
      // Per bodybuilding: colazione più abbondante, spuntini più frequenti
      breakfastRatio = 0.30;
      lunchRatio = 0.30;
      dinnerRatio = 0.25;
      snacksRatio = 0.15;
    } else if (goal === 'lose_weight') {
      // Per perdita peso: pranzo più abbondante, cena leggera
      breakfastRatio = 0.25;
      lunchRatio = 0.40;
      dinnerRatio = 0.25;
      snacksRatio = 0.10;
    }

    return {
      breakfast: {
        calories: Math.round(calories * breakfastRatio),
        proteins: Math.round(proteins * breakfastRatio),
        carbs: Math.round(carbs * breakfastRatio),
        fats: Math.round(fats * breakfastRatio)
      },
      lunch: {
        calories: Math.round(calories * lunchRatio),
        proteins: Math.round(proteins * lunchRatio),
        carbs: Math.round(carbs * lunchRatio),
        fats: Math.round(fats * lunchRatio)
      },
      dinner: {
        calories: Math.round(calories * dinnerRatio),
        proteins: Math.round(proteins * dinnerRatio),
        carbs: Math.round(carbs * dinnerRatio),
        fats: Math.round(fats * dinnerRatio)
      },
      snacks: {
        calories: Math.round(calories * snacksRatio),
        proteins: Math.round(proteins * snacksRatio),
        carbs: Math.round(carbs * snacksRatio),
        fats: Math.round(fats * snacksRatio)
      }
    };
  }

  /**
   * Genera raccomandazioni personalizzate
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { goal, activity_level, training_frequency = 0 } = this.profile;

    // Raccomandazioni generali
    recommendations.push("Bevi almeno 2-3 litri di acqua al giorno");
    recommendations.push("Mangia lentamente e mastica bene");

    // Raccomandazioni specifiche per obiettivo
    if (goal === 'lose_weight') {
      recommendations.push("Includi proteine magre in ogni pasto");
      recommendations.push("Aumenta il consumo di verdure");
      recommendations.push("Evita zuccheri raffinati e bevande zuccherate");
      recommendations.push("Fai attività fisica regolare");
    } else if (goal === 'gain_weight' || goal === 'build_muscle') {
      recommendations.push("Aumenta gradualmente le porzioni");
      recommendations.push("Includi carboidrati complessi");
      recommendations.push("Fai spuntini tra i pasti principali");
      recommendations.push("Allenati con i pesi 3-4 volte a settimana");
    } else if (goal === 'maintain') {
      recommendations.push("Mantieni una dieta equilibrata");
      recommendations.push("Fai attività fisica moderata");
      recommendations.push("Monitora il peso settimanalmente");
    }

    // Raccomandazioni per livello di attività
    if (activity_level === 'sedentary') {
      recommendations.push("Inizia con 30 minuti di camminata al giorno");
    } else if (activity_level === 'very_active') {
      recommendations.push("Assicurati di riposare adeguatamente");
      recommendations.push("Monitora la frequenza cardiaca");
    }

    return recommendations;
  }

  /**
   * Calcola il piano nutrizionale completo
   */
  public calculateNutritionPlan(): NutritionPlan {
    const tdee = this.calculateTDEE();
    const adjustment = this.calculateCalorieAdjustment();
    const dailyCalories = Math.round(tdee + adjustment);
    
    const macros = this.calculateMacronutrients(dailyCalories);
    const mealDistribution = this.calculateMealDistribution(
      dailyCalories, 
      macros.proteins, 
      macros.carbs, 
      macros.fats
    );

    // Calcola il cambiamento di peso settimanale atteso
    const weeklyWeightChange = adjustment * 7 / 7700; // 7700 kcal = 1kg

    return {
      daily_calories: dailyCalories,
      daily_proteins: macros.proteins,
      daily_carbs: macros.carbs,
      daily_fats: macros.fats,
      meal_distribution: mealDistribution,
      recommendations: this.generateRecommendations(),
      weekly_weight_change: Math.round(weeklyWeightChange * 100) / 100 // Arrotonda a 2 decimali
    };
  }

  /**
   * Aggiorna il piano in base ai progressi
   */
  public updatePlanBasedOnProgress(
    currentWeight: number,
    averageCaloriesLastWeek: number,
    weightChangeLastWeek: number
  ): NutritionPlan {
    const currentPlan = this.calculateNutritionPlan();
    const { goal } = this.profile;

    let adjustedCalories = currentPlan.daily_calories;

    // Adatta le calorie in base ai progressi
    if (goal === 'lose_weight') {
      if (weightChangeLastWeek > -0.5) {
        // Perdita troppo lenta, aumenta il deficit
        adjustedCalories -= 200;
      } else if (weightChangeLastWeek < -1.0) {
        // Perdita troppo veloce, riduci il deficit
        adjustedCalories += 200;
      }
    } else if (goal === 'gain_weight' || goal === 'build_muscle') {
      if (weightChangeLastWeek < 0.5) {
        // Guadagno troppo lento, aumenta il surplus
        adjustedCalories += 200;
      } else if (weightChangeLastWeek > 1.0) {
        // Guadagno troppo veloce, riduci il surplus
        adjustedCalories -= 200;
      }
    }

    // Ricalcola tutto con le nuove calorie
    this.profile.weight = currentWeight; // Aggiorna il peso corrente
    const macros = this.calculateMacronutrients(adjustedCalories);
    const mealDistribution = this.calculateMealDistribution(
      adjustedCalories, 
      macros.proteins, 
      macros.carbs, 
      macros.fats
    );

    return {
      daily_calories: adjustedCalories,
      daily_proteins: macros.proteins,
      daily_carbs: macros.carbs,
      daily_fats: macros.fats,
      meal_distribution: mealDistribution,
      recommendations: this.generateRecommendations(),
      weekly_weight_change: currentPlan.weekly_weight_change
    };
  }

  /**
   * Calcola il BMI e la categoria
   */
  public calculateBMI(): { value: number; category: string } {
    const { weight, height } = this.profile;
    const bmi = weight / Math.pow(height / 100, 2);

    let category: string;
    if (bmi < 18.5) category = 'Sottopeso';
    else if (bmi < 25) category = 'Normopeso';
    else if (bmi < 30) category = 'Sovrappeso';
    else category = 'Obesità';

    return {
      value: Math.round(bmi * 10) / 10,
      category
    };
  }

  /**
   * Calcola la massa magra stimata
   */
  public calculateLeanBodyMass(): number {
    const { weight, gender, body_fat_percentage } = this.profile;
    
    if (body_fat_percentage) {
      return weight * (1 - body_fat_percentage / 100);
    }

    // Stima basata su BMI e genere
    const bmi = this.calculateBMI().value;
    if (gender === 'male') {
      return weight * (1 - (bmi - 20) * 0.02);
    } else {
      return weight * (1 - (bmi - 20) * 0.025);
    }
  }
}

// Funzioni di utilità
export const formatCalories = (calories: number): string => {
  return calories.toLocaleString('it-IT');
};

export const formatMacros = (grams: number): string => {
  return `${Math.round(grams)}g`;
};

export const getGoalDescription = (goal: string): string => {
  const descriptions = {
    lose_weight: 'Perdita di peso',
    gain_weight: 'Aumento di peso',
    maintain: 'Mantenimento peso',
    build_muscle: 'Costruzione muscolare'
  };
  return descriptions[goal as keyof typeof descriptions] || goal;
};

export const getActivityDescription = (activity: string): string => {
  const descriptions = {
    sedentary: 'Sedentario',
    light: 'Leggermente attivo',
    moderate: 'Moderatamente attivo',
    active: 'Molto attivo',
    very_active: 'Estremamente attivo'
  };
  return descriptions[activity as keyof typeof descriptions] || activity;
};

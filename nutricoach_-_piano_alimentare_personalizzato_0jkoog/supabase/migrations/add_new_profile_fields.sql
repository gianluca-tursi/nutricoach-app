-- Aggiunta nuovi campi per il sistema di calcolo nutrizionale avanzato
-- Migrazione per aggiornare la tabella profiles con nuovi campi

-- Aggiungi nuovi campi per obiettivi più dettagliati
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_weight numeric,
ADD COLUMN IF NOT EXISTS timeframe_months integer,
ADD COLUMN IF NOT EXISTS training_frequency integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS body_fat_percentage numeric,
ADD COLUMN IF NOT EXISTS goal_detailed text CHECK (goal_detailed IN ('lose_weight', 'gain_weight', 'maintain', 'build_muscle'));

-- Aggiorna i valori esistenti per mappare i vecchi goal ai nuovi
UPDATE profiles 
SET goal_detailed = 
  CASE 
    WHEN goal = 'lose' THEN 'lose_weight'
    WHEN goal = 'gain' THEN 'gain_weight'
    WHEN goal = 'maintain' THEN 'maintain'
    WHEN goal = 'health' THEN 'maintain'
    ELSE 'maintain'
  END
WHERE goal_detailed IS NULL;

-- Aggiungi vincoli per i nuovi campi
ALTER TABLE profiles 
ADD CONSTRAINT check_target_weight CHECK (target_weight IS NULL OR (target_weight > 0 AND target_weight < 500)),
ADD CONSTRAINT check_timeframe_months CHECK (timeframe_months IS NULL OR (timeframe_months > 0 AND timeframe_months <= 60)),
ADD CONSTRAINT check_training_frequency CHECK (training_frequency >= 0 AND training_frequency <= 7),
ADD CONSTRAINT check_body_fat_percentage CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 50));

-- Aggiungi indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_profiles_goal_detailed ON profiles(goal_detailed);
CREATE INDEX IF NOT EXISTS idx_profiles_training_frequency ON profiles(training_frequency);
CREATE INDEX IF NOT EXISTS idx_profiles_target_weight ON profiles(target_weight);

-- Aggiungi commenti per documentare i nuovi campi
COMMENT ON COLUMN profiles.target_weight IS 'Peso obiettivo in kg';
COMMENT ON COLUMN profiles.timeframe_months IS 'Tempo in mesi per raggiungere l''obiettivo';
COMMENT ON COLUMN profiles.training_frequency IS 'Giorni di allenamento per settimana (0-7)';
COMMENT ON COLUMN profiles.body_fat_percentage IS 'Percentuale di grasso corporeo stimata';
COMMENT ON COLUMN profiles.goal_detailed IS 'Obiettivo dettagliato: lose_weight, gain_weight, maintain, build_muscle';

-- Crea una vista per calcoli nutrizionali avanzati
CREATE OR REPLACE VIEW nutrition_calculations AS
SELECT 
  id,
  age,
  gender,
  height,
  weight,
  target_weight,
  timeframe_months,
  activity_level,
  goal_detailed as goal,
  training_frequency,
  body_fat_percentage,
  daily_calories,
  daily_proteins,
  daily_carbs,
  daily_fats,
  -- Calcolo BMI
  ROUND((weight / POWER(height / 100, 2))::numeric, 1) as bmi,
  -- Categoria BMI
  CASE 
    WHEN (weight / POWER(height / 100, 2)) < 18.5 THEN 'Sottopeso'
    WHEN (weight / POWER(height / 100, 2)) < 25 THEN 'Normopeso'
    WHEN (weight / POWER(height / 100, 2)) < 30 THEN 'Sovrappeso'
    ELSE 'Obesità'
  END as bmi_category,
  -- Calcolo BMR (Mifflin-St Jeor)
  CASE 
    WHEN gender = 'male' THEN 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    ELSE 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  END as bmr,
  -- Calcolo TDEE
  CASE 
    WHEN gender = 'male' THEN (88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)) * 
      CASE activity_level
        WHEN 'sedentary' THEN 1.2
        WHEN 'light' THEN 1.375
        WHEN 'moderate' THEN 1.55
        WHEN 'active' THEN 1.725
        WHEN 'very_active' THEN 1.9
        ELSE 1.55
      END
    ELSE (447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)) * 
      CASE activity_level
        WHEN 'sedentary' THEN 1.2
        WHEN 'light' THEN 1.375
        WHEN 'moderate' THEN 1.55
        WHEN 'active' THEN 1.725
        WHEN 'very_active' THEN 1.9
        ELSE 1.55
      END
  END as tdee,
  -- Cambio peso settimanale atteso
  CASE 
    WHEN goal_detailed = 'lose_weight' AND target_weight IS NOT NULL AND timeframe_months IS NOT NULL THEN
      -((weight - target_weight) / (timeframe_months * 4.33))
    WHEN goal_detailed = 'gain_weight' AND target_weight IS NOT NULL AND timeframe_months IS NOT NULL THEN
      ((target_weight - weight) / (timeframe_months * 4.33))
    ELSE 0
  END as weekly_weight_change_expected
FROM profiles;

-- Crea una funzione per aggiornare automaticamente i calcoli nutrizionali
CREATE OR REPLACE FUNCTION update_nutrition_calculations()
RETURNS TRIGGER AS $$
DECLARE
  new_bmr numeric;
  new_tdee numeric;
  new_calories numeric;
  new_proteins numeric;
  new_carbs numeric;
  new_fats numeric;
  activity_multiplier numeric;
  calorie_adjustment numeric;
BEGIN
  -- Calcola il moltiplicatore di attività
  activity_multiplier := CASE NEW.activity_level
    WHEN 'sedentary' THEN 1.2
    WHEN 'light' THEN 1.375
    WHEN 'moderate' THEN 1.55
    WHEN 'active' THEN 1.725
    WHEN 'very_active' THEN 1.9
    ELSE 1.55
  END;

  -- Calcola BMR
  IF NEW.gender = 'male' THEN
    new_bmr := 88.362 + (13.397 * NEW.weight) + (4.799 * NEW.height) - (5.677 * NEW.age);
  ELSE
    new_bmr := 447.593 + (9.247 * NEW.weight) + (3.098 * NEW.height) - (4.330 * NEW.age);
  END IF;

  -- Calcola TDEE
  new_tdee := new_bmr * activity_multiplier;

  -- Calcola aggiustamento calorico basato sull'obiettivo
  IF NEW.goal_detailed = 'lose_weight' THEN
    IF NEW.target_weight IS NOT NULL AND NEW.timeframe_months IS NOT NULL THEN
      calorie_adjustment := -((NEW.weight - NEW.target_weight) * 7700) / (NEW.timeframe_months * 4.33 * 7);
      calorie_adjustment := GREATEST(calorie_adjustment, -new_tdee * 0.25); -- Max 25% deficit
    ELSE
      calorie_adjustment := -LEAST(500, new_tdee * 0.20);
    END IF;
  ELSIF NEW.goal_detailed = 'gain_weight' THEN
    IF NEW.target_weight IS NOT NULL AND NEW.timeframe_months IS NOT NULL THEN
      calorie_adjustment := ((NEW.target_weight - NEW.weight) * 7700) / (NEW.timeframe_months * 4.33 * 7);
      calorie_adjustment := LEAST(calorie_adjustment, new_tdee * 0.20); -- Max 20% surplus
    ELSE
      calorie_adjustment := LEAST(300, new_tdee * 0.15);
    END IF;
  ELSE
    calorie_adjustment := 0;
  END IF;

  -- Calcola calorie totali
  new_calories := new_tdee + calorie_adjustment;

  -- Calcola macronutrienti
  IF NEW.goal_detailed = 'lose_weight' THEN
    new_proteins := GREATEST(1.6 * NEW.weight, 0.25 * new_calories / 4);
    new_fats := 0.25 * new_calories / 9;
    new_carbs := (new_calories - (new_proteins * 4) - (new_fats * 9)) / 4;
  ELSIF NEW.goal_detailed IN ('gain_weight', 'build_muscle') THEN
    new_proteins := GREATEST(2.0 * NEW.weight, 0.30 * new_calories / 4);
    new_carbs := 0.45 * new_calories / 4;
    new_fats := (new_calories - (new_proteins * 4) - (new_carbs * 4)) / 9;
  ELSE
    new_proteins := GREATEST(1.2 * NEW.weight, 0.20 * new_calories / 4);
    new_carbs := 0.50 * new_calories / 4;
    new_fats := (new_calories - (new_proteins * 4) - (new_carbs * 4)) / 9;
  END IF;

  -- Assicura valori minimi
  IF new_fats < (0.20 * new_calories / 9) THEN
    new_fats := 0.20 * new_calories / 9;
    new_carbs := (new_calories - (new_proteins * 4) - (new_fats * 9)) / 4;
  END IF;

  IF new_carbs < 100 THEN
    new_carbs := 100;
    new_fats := (new_calories - (new_proteins * 4) - (new_carbs * 4)) / 9;
  END IF;

  -- Aggiorna i valori
  NEW.daily_calories := ROUND(new_calories);
  NEW.daily_proteins := ROUND(new_proteins);
  NEW.daily_carbs := ROUND(new_carbs);
  NEW.daily_fats := ROUND(new_fats);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea il trigger per aggiornare automaticamente i calcoli
DROP TRIGGER IF EXISTS trigger_update_nutrition_calculations ON profiles;
CREATE TRIGGER trigger_update_nutrition_calculations
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_calculations();

-- Aggiungi una tabella per tracciare i progressi e adattare il piano
CREATE TABLE IF NOT EXISTS nutrition_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  current_weight numeric NOT NULL,
  average_calories_week numeric,
  weight_change_week numeric,
  calories_adjustment numeric DEFAULT 0,
  proteins_adjustment numeric DEFAULT 0,
  carbs_adjustment numeric DEFAULT 0,
  fats_adjustment numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Indici per la tabella progress
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_user_date ON nutrition_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_date ON nutrition_progress(date);

-- Funzione per calcolare la media settimanale delle calorie
CREATE OR REPLACE FUNCTION get_weekly_average_calories(user_uuid uuid, target_date date)
RETURNS numeric AS $$
DECLARE
  avg_calories numeric;
BEGIN
  SELECT AVG(consumed_calories) INTO avg_calories
  FROM daily_goals
  WHERE user_id = user_uuid
    AND date BETWEEN target_date - INTERVAL '7 days' AND target_date;
  
  RETURN COALESCE(avg_calories, 0);
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare il cambio peso settimanale
CREATE OR REPLACE FUNCTION get_weekly_weight_change(user_uuid uuid, target_date date)
RETURNS numeric AS $$
DECLARE
  weight_change numeric;
BEGIN
  SELECT 
    (current_weight - LAG(current_weight) OVER (ORDER BY date)) INTO weight_change
  FROM nutrition_progress
  WHERE user_id = user_uuid
    AND date BETWEEN target_date - INTERVAL '7 days' AND target_date
  ORDER BY date DESC
  LIMIT 1;
  
  RETURN COALESCE(weight_change, 0);
END;
$$ LANGUAGE plpgsql;

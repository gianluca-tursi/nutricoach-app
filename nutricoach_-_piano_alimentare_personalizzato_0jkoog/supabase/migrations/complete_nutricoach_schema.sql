/*
  # Schema Completo NutriCoach
  Combina le tabelle base + i nuovi campi per il calcolo nutrizionale avanzato
*/

-- ========================================
-- TABELLE BASE
-- ========================================

-- Create profiles table (AGGIORNATA con nuovi campi)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  height numeric NOT NULL CHECK (height > 0),
  weight numeric NOT NULL CHECK (weight > 0),
  activity_level text NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain', 'health')),
  -- NUOVI CAMPI per calcolo nutrizionale avanzato
  target_weight numeric,
  timeframe_months integer,
  training_frequency integer DEFAULT 0,
  body_fat_percentage numeric,
  goal_detailed text CHECK (goal_detailed IN ('lose_weight', 'gain_weight', 'maintain', 'build_muscle')),
  obstacles text[] DEFAULT '{}',
  emotional_goals text[] DEFAULT '{}',
  dietary_restrictions text[] DEFAULT '{}',
  health_conditions text[] DEFAULT '{}',
  daily_calories integer NOT NULL CHECK (daily_calories > 0),
  daily_proteins integer NOT NULL CHECK (daily_proteins > 0),
  daily_carbs integer NOT NULL CHECK (daily_carbs > 0),
  daily_fats integer NOT NULL CHECK (daily_fats > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vincoli per i nuovi campi (con gestione errori)
DO $$
BEGIN
  -- Aggiungi vincoli solo se non esistono già
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_target_weight' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_target_weight CHECK (target_weight IS NULL OR (target_weight > 0 AND target_weight < 500));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_timeframe_months' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_timeframe_months CHECK (timeframe_months IS NULL OR (timeframe_months > 0 AND timeframe_months <= 60));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_training_frequency' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_training_frequency CHECK (training_frequency >= 0 AND training_frequency <= 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_body_fat_percentage' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_body_fat_percentage CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 50));
  END IF;
END $$;

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  photo_url text,
  calories integer NOT NULL CHECK (calories >= 0),
  proteins numeric NOT NULL DEFAULT 0 CHECK (proteins >= 0),
  carbs numeric NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fats numeric NOT NULL DEFAULT 0 CHECK (fats >= 0),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  consumed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create daily_goals table
CREATE TABLE IF NOT EXISTS daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  date date NOT NULL,
  target_calories integer NOT NULL CHECK (target_calories > 0),
  target_proteins integer NOT NULL CHECK (target_proteins > 0),
  target_carbs integer NOT NULL CHECK (target_carbs > 0),
  target_fats integer NOT NULL CHECK (target_fats > 0),
  consumed_calories integer DEFAULT 0 CHECK (consumed_calories >= 0),
  consumed_proteins numeric DEFAULT 0 CHECK (consumed_proteins >= 0),
  consumed_carbs numeric DEFAULT 0 CHECK (consumed_carbs >= 0),
  consumed_fats numeric DEFAULT 0 CHECK (consumed_fats >= 0),
  water_intake integer DEFAULT 0 CHECK (water_intake >= 0),
  steps integer DEFAULT 0 CHECK (steps >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create health_tips table
CREATE TABLE IF NOT EXISTS health_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('nutrition', 'exercise', 'mindfulness', 'sleep', 'hydration')),
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- NUOVE TABELLE PER CALCOLO AVANZATO
-- ========================================

-- Tabella per tracciare i progressi e adattare il piano
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

-- Tabella per il log del peso (weight_logs)
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight numeric NOT NULL CHECK (weight > 0),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ========================================
-- INDICI
-- ========================================

-- Indici per le tabelle base
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON meals(consumed_at);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(date);
CREATE INDEX IF NOT EXISTS idx_health_tips_user_id ON health_tips(user_id);

-- Indici per i nuovi campi profiles
CREATE INDEX IF NOT EXISTS idx_profiles_goal_detailed ON profiles(goal_detailed);
CREATE INDEX IF NOT EXISTS idx_profiles_training_frequency ON profiles(training_frequency);
CREATE INDEX IF NOT EXISTS idx_profiles_target_weight ON profiles(target_weight);

-- Indici per nutrition_progress
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_user_created_at ON nutrition_progress(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_created_at ON nutrition_progress(created_at);

-- Indici per weight_logs
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_created_at ON weight_logs(created_at);

-- ========================================
-- SICUREZZA (RLS)
-- ========================================

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (con gestione errori)
DO $$
BEGIN
  -- Policies per profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create policies for meals (con gestione errori)
DO $$
BEGIN
  -- Policies per meals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Users can view own meals') THEN
    CREATE POLICY "Users can view own meals"
      ON meals FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Users can insert own meals') THEN
    CREATE POLICY "Users can insert own meals"
      ON meals FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Users can update own meals') THEN
    CREATE POLICY "Users can update own meals"
      ON meals FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Users can delete own meals') THEN
    CREATE POLICY "Users can delete own meals"
      ON meals FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for daily_goals (con gestione errori)
DO $$
BEGIN
  -- Policies per daily_goals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_goals' AND policyname = 'Users can view own daily goals') THEN
    CREATE POLICY "Users can view own daily goals"
      ON daily_goals FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_goals' AND policyname = 'Users can insert own daily goals') THEN
    CREATE POLICY "Users can insert own daily goals"
      ON daily_goals FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_goals' AND policyname = 'Users can update own daily goals') THEN
    CREATE POLICY "Users can update own daily goals"
      ON daily_goals FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for health_tips (con gestione errori)
DO $$
BEGIN
  -- Policies per health_tips
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_tips' AND policyname = 'Users can view own health tips') THEN
    CREATE POLICY "Users can view own health tips"
      ON health_tips FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_tips' AND policyname = 'Users can insert own health tips') THEN
    CREATE POLICY "Users can insert own health tips"
      ON health_tips FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_tips' AND policyname = 'Users can update own health tips') THEN
    CREATE POLICY "Users can update own health tips"
      ON health_tips FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for nutrition_progress (con gestione errori)
DO $$
BEGIN
  -- Policies per nutrition_progress
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_progress' AND policyname = 'Users can view own nutrition progress') THEN
    CREATE POLICY "Users can view own nutrition progress"
      ON nutrition_progress FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_progress' AND policyname = 'Users can insert own nutrition progress') THEN
    CREATE POLICY "Users can insert own nutrition progress"
      ON nutrition_progress FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutrition_progress' AND policyname = 'Users can update own nutrition progress') THEN
    CREATE POLICY "Users can update own nutrition progress"
      ON nutrition_progress FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for weight_logs (con gestione errori)
DO $$
BEGIN
  -- Policies per weight_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can view own weight logs') THEN
    CREATE POLICY "Users can view own weight logs"
      ON weight_logs FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can insert own weight logs') THEN
    CREATE POLICY "Users can insert own weight logs"
      ON weight_logs FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can update own weight logs') THEN
    CREATE POLICY "Users can update own weight logs"
      ON weight_logs FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can delete own weight logs') THEN
    CREATE POLICY "Users can delete own weight logs"
      ON weight_logs FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ========================================
-- FUNZIONI E TRIGGER
-- ========================================

-- Funzione per aggiornare updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per updated_at (con gestione errori)
DO $$
BEGIN
  -- Trigger per profiles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger per daily_goals
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_daily_goals_updated_at') THEN
    CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON daily_goals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Funzione per aggiornare automaticamente i calcoli nutrizionali
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

-- Trigger per aggiornare automaticamente i calcoli (con gestione errori)
DO $$
BEGIN
  -- Rimuovi il trigger se esiste
  DROP TRIGGER IF EXISTS trigger_update_nutrition_calculations ON profiles;
  
  -- Crea il trigger
  CREATE TRIGGER trigger_update_nutrition_calculations
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_calculations();
END $$;

-- Funzione per calcolare la media settimanale delle calorie
CREATE OR REPLACE FUNCTION get_weekly_average_calories(user_uuid uuid, target_date date)
RETURNS numeric AS $$
DECLARE
  avg_calories numeric;
BEGIN
  SELECT AVG(consumed_calories) INTO avg_calories
  FROM daily_goals
  WHERE user_id = user_uuid
    AND created_at BETWEEN target_date - INTERVAL '7 days' AND target_date;
  
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
    (current_weight - LAG(current_weight) OVER (ORDER BY created_at)) INTO weight_change
  FROM nutrition_progress
  WHERE user_id = user_uuid
    AND created_at BETWEEN target_date - INTERVAL '7 days' AND target_date
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(weight_change, 0);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VISTE
-- ========================================

-- Vista per calcoli nutrizionali avanzati
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

-- ========================================
-- COMMENTI E DOCUMENTAZIONE
-- ========================================

-- Commenti per i nuovi campi
COMMENT ON COLUMN profiles.target_weight IS 'Peso obiettivo in kg';
COMMENT ON COLUMN profiles.timeframe_months IS 'Tempo in mesi per raggiungere l''obiettivo';
COMMENT ON COLUMN profiles.training_frequency IS 'Giorni di allenamento per settimana (0-7)';
COMMENT ON COLUMN profiles.body_fat_percentage IS 'Percentuale di grasso corporeo stimata';
COMMENT ON COLUMN profiles.goal_detailed IS 'Obiettivo dettagliato: lose_weight, gain_weight, maintain, build_muscle';
COMMENT ON COLUMN profiles.obstacles IS 'Array di ostacoli identificati';
COMMENT ON COLUMN profiles.emotional_goals IS 'Array di obiettivi emotivi';

-- ========================================
-- MIGRAZIONE DATI ESISTENTI
-- ========================================

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

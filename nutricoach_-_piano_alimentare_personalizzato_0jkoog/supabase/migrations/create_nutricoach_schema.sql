/*
  # Schema NutriCoach

  1. Nuove Tabelle
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `age` (integer)
      - `gender` (text)
      - `height` (numeric)
      - `weight` (numeric)
      - `activity_level` (text)
      - `goal` (text)
      - `dietary_restrictions` (text[])
      - `health_conditions` (text[])
      - `daily_calories` (integer)
      - `daily_proteins` (integer)
      - `daily_carbs` (integer)
      - `daily_fats` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `meals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `photo_url` (text)
      - `calories` (integer)
      - `proteins` (numeric)
      - `carbs` (numeric)
      - `fats` (numeric)
      - `meal_type` (text)
      - `consumed_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `daily_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `target_calories` (integer)
      - `target_proteins` (integer)
      - `target_carbs` (integer)
      - `target_fats` (integer)
      - `consumed_calories` (integer)
      - `consumed_proteins` (numeric)
      - `consumed_carbs` (numeric)
      - `consumed_fats` (numeric)
      - `water_intake` (integer)
      - `steps` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `health_tips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category` (text)
      - `title` (text)
      - `content` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  height numeric NOT NULL CHECK (height > 0),
  weight numeric NOT NULL CHECK (weight > 0),
  activity_level text NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'extra')),
  goal text NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain', 'health')),
  dietary_restrictions text[] DEFAULT '{}',
  health_conditions text[] DEFAULT '{}',
  daily_calories integer NOT NULL CHECK (daily_calories > 0),
  daily_proteins integer NOT NULL CHECK (daily_proteins > 0),
  daily_carbs integer NOT NULL CHECK (daily_carbs > 0),
  daily_fats integer NOT NULL CHECK (daily_fats > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON meals(consumed_at);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(date);
CREATE INDEX IF NOT EXISTS idx_health_tips_user_id ON health_tips(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for meals
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for daily_goals
CREATE POLICY "Users can view own daily goals"
  ON daily_goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily goals"
  ON daily_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily goals"
  ON daily_goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for health_tips
CREATE POLICY "Users can view own health tips"
  ON health_tips FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health tips"
  ON health_tips FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health tips"
  ON health_tips FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON daily_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

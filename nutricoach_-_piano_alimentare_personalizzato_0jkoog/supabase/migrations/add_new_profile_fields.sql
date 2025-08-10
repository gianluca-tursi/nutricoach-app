/*
  # Aggiunta nuovi campi al profilo

  1. Modifiche
    - Aggiunge campo `target_weight` per il peso obiettivo
    - Aggiunge campo `timeframe_months` per il periodo in mesi
    - Aggiunge array `obstacles` per gli ostacoli
    - Aggiunge array `emotional_goals` per gli obiettivi emotivi
  
  2. Note
    - I campi sono opzionali (nullable)
    - Gli array sono di tipo text[]
*/

DO $$
BEGIN
  -- Aggiungi target_weight se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_weight'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_weight numeric;
  END IF;

  -- Aggiungi timeframe_months se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timeframe_months'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timeframe_months integer;
  END IF;

  -- Aggiungi obstacles se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'obstacles'
  ) THEN
    ALTER TABLE profiles ADD COLUMN obstacles text[] DEFAULT '{}';
  END IF;

  -- Aggiungi emotional_goals se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emotional_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emotional_goals text[] DEFAULT '{}';
  END IF;
END $$;

-- Aggiunge la tabella quick_foods per gli alimenti rapidi personalizzati
CREATE TABLE IF NOT EXISTS quick_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Utensils',
  calories INTEGER NOT NULL,
  proteins DECIMAL(5,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(5,2) NOT NULL DEFAULT 0,
  fats DECIMAL(5,2) NOT NULL DEFAULT 0,
  gradient TEXT NOT NULL DEFAULT 'from-gray-400 to-gray-600',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per migliorare le performance delle query per utente
CREATE INDEX IF NOT EXISTS idx_quick_foods_user_id ON quick_foods(user_id);

-- Indice per evitare duplicati dello stesso alimento per lo stesso utente
CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_foods_user_name ON quick_foods(user_id, name);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_quick_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quick_foods_updated_at
  BEFORE UPDATE ON quick_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_foods_updated_at();

-- RLS (Row Level Security)
ALTER TABLE quick_foods ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti possono vedere solo i propri alimenti rapidi
CREATE POLICY "Users can view own quick foods" ON quick_foods
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: gli utenti possono inserire solo i propri alimenti rapidi
CREATE POLICY "Users can insert own quick foods" ON quick_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: gli utenti possono aggiornare solo i propri alimenti rapidi
CREATE POLICY "Users can update own quick foods" ON quick_foods
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: gli utenti possono eliminare solo i propri alimenti rapidi
CREATE POLICY "Users can delete own quick foods" ON quick_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Aggiungi campi per dettagli ricette
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_recipe_text BOOLEAN DEFAULT false;

-- Aggiungi commenti per documentazione
COMMENT ON COLUMN recipes.ingredients IS 'Lista degli ingredienti della ricetta';
COMMENT ON COLUMN recipes.instructions IS 'Lista delle istruzioni per preparare la ricetta';
COMMENT ON COLUMN recipes.has_recipe_text IS 'Indica se la ricetta è stata estratta da testo o generata da immagine';

-- Crea indice per ricerca ingredienti
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING GIN (ingredients);

-- Crea indice per ricerca istruzioni
CREATE INDEX IF NOT EXISTS idx_recipes_instructions ON recipes USING GIN (instructions);

-- Aggiungi colonna images alla tabella recipes
ALTER TABLE recipes 
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Aggiungi commento per documentare l'uso
COMMENT ON COLUMN recipes.images IS 'Array di URL delle immagini multiple per la ricetta';

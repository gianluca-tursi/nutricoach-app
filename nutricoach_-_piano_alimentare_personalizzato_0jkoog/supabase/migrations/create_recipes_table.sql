-- Create recipes table (simplified version)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'main' CHECK (category IN ('breakfast', 'main', 'side', 'dessert', 'snack', 'drink')),
  image_url TEXT,
  external_link TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' AND policyname = 'Users can view their own recipes'
    ) THEN
        CREATE POLICY "Users can view their own recipes" ON recipes
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy for INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' AND policyname = 'Users can insert their own recipes'
    ) THEN
        CREATE POLICY "Users can insert their own recipes" ON recipes
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy for UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' AND policyname = 'Users can update their own recipes'
    ) THEN
        CREATE POLICY "Users can update their own recipes" ON recipes
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy for DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' AND policyname = 'Users can delete their own recipes'
    ) THEN
        CREATE POLICY "Users can delete their own recipes" ON recipes
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE recipes IS 'User recipes with simplified structure and AI analysis';
COMMENT ON COLUMN recipes.title IS 'Recipe title';
COMMENT ON COLUMN recipes.description IS 'Recipe description';
COMMENT ON COLUMN recipes.category IS 'Recipe category';
COMMENT ON COLUMN recipes.image_url IS 'URL to recipe image';
COMMENT ON COLUMN recipes.external_link IS 'External link to recipe source';
COMMENT ON COLUMN recipes.tags IS 'Array of recipe tags';

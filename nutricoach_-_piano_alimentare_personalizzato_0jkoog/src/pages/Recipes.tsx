import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Clock, 
  Users, 
  ExternalLink, 
  Camera, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  BookOpen,
  ChefHat,
  Timer,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cooking_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  image_url?: string;
  external_link?: string;
  user_id: string;
  created_at: string;
  tags: string[];
}

export function Recipes() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    cooking_time: 30,
    servings: 2,
    difficulty: 'medium',
    category: 'main',
    tags: []
  });

  const categories = [
    { value: 'all', label: 'Tutte' },
    { value: 'breakfast', label: 'Colazione' },
    { value: 'main', label: 'Piatto Principale' },
    { value: 'side', label: 'Contorno' },
    { value: 'dessert', label: 'Dolce' },
    { value: 'snack', label: 'Spuntino' },
    { value: 'drink', label: 'Bevanda' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Facile', color: 'bg-green-500' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Difficile', color: 'bg-red-500' }
  ];

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recipes:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le ricette",
          variant: "destructive"
        });
      } else {
        setRecipes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecipe = async () => {
    if (!user || !newRecipe.title || !newRecipe.description) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          ...newRecipe,
          user_id: user.id,
          ingredients: newRecipe.ingredients?.filter(ing => ing.trim()),
          instructions: newRecipe.instructions?.filter(inst => inst.trim()),
          tags: newRecipe.tags || []
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding recipe:', error);
        toast({
          title: "Errore",
          description: "Impossibile aggiungere la ricetta",
          variant: "destructive"
        });
      } else {
        setRecipes([data, ...recipes]);
        setShowAddDialog(false);
        setNewRecipe({
          title: '',
          description: '',
          ingredients: [''],
          instructions: [''],
          cooking_time: 30,
          servings: 2,
          difficulty: 'medium',
          category: 'main',
          tags: []
        });
        toast({
          title: "Successo",
          description: "Ricetta aggiunta con successo!"
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) {
        console.error('Error deleting recipe:', error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare la ricetta",
          variant: "destructive"
        });
      } else {
        setRecipes(recipes.filter(r => r.id !== recipeId));
        toast({
          title: "Successo",
          description: "Ricetta eliminata con successo!"
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), '']
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), '']
    }));
  };

  const removeInstruction = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions?.map((inst, i) => i === index ? value : inst)
    }));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulties.find(d => d.value === difficulty);
    return diff?.color || 'bg-gray-500';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const diff = difficulties.find(d => d.value === difficulty);
    return diff?.label || 'Sconosciuta';
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Le Mie Ricette
              </span>
            </h1>
            <p className="text-gray-400 mt-2">
              Gestisci e organizza le tue ricette preferite
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90">
                <Plus className="h-5 w-5 mr-2" />
                Nuova Ricetta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Aggiungi Nuova Ricetta</DialogTitle>
                <DialogDescription>
                  Crea una nuova ricetta con ingredienti, istruzioni e dettagli
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Titolo e Descrizione */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titolo *</label>
                    <Input
                      value={newRecipe.title}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Es. Pasta al Pomodoro"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrizione</label>
                    <Textarea
                      value={newRecipe.description}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descrizione della ricetta..."
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Categoria e Difficoltà */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Categoria</label>
                    <select
                      value={newRecipe.category}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                    >
                      {categories.slice(1).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficoltà</label>
                    <select
                      value={newRecipe.difficulty}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                    >
                      {difficulties.map(diff => (
                        <option key={diff.value} value={diff.value}>{diff.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tempo e Porzioni */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tempo di Cottura (minuti)</label>
                    <Input
                      type="number"
                      value={newRecipe.cooking_time}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, cooking_time: parseInt(e.target.value) }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Porzioni</label>
                    <Input
                      type="number"
                      value={newRecipe.servings}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Link Esterno */}
                <div>
                  <label className="block text-sm font-medium mb-2">Link Esterno (opzionale)</label>
                  <Input
                    value={newRecipe.external_link}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, external_link: e.target.value }))}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                {/* Ingredienti */}
                <div>
                  <label className="block text-sm font-medium mb-2">Ingredienti</label>
                  <div className="space-y-2">
                    {newRecipe.ingredients?.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={ingredient}
                          onChange={(e) => updateIngredient(index, e.target.value)}
                          placeholder={`Ingrediente ${index + 1}`}
                          className="bg-gray-800 border-gray-600 text-white flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addIngredient}
                      className="w-full border-gray-600 text-gray-400 hover:border-gray-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Ingrediente
                    </Button>
                  </div>
                </div>

                {/* Istruzioni */}
                <div>
                  <label className="block text-sm font-medium mb-2">Istruzioni</label>
                  <div className="space-y-2">
                    {newRecipe.instructions?.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          placeholder={`Passo ${index + 1}`}
                          className="bg-gray-800 border-gray-600 text-white flex-1"
                          rows={2}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addInstruction}
                      className="w-full border-gray-600 text-gray-400 hover:border-gray-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Istruzione
                    </Button>
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={addRecipe}
                    className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90 flex-1"
                  >
                    Salva Ricetta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="border-gray-600 text-gray-400 hover:border-gray-500"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtri e Ricerca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca ricette, ingredienti..."
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Lista Ricette */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-white mb-2">
                          {recipe.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400 mb-3">
                          {recipe.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecipe(recipe.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={`${getDifficultyColor(recipe.difficulty)} text-white`}>
                        {getDifficultyLabel(recipe.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        {getCategoryLabel(recipe.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        {recipe.cooking_time} min
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="h-4 w-4 mr-2" />
                        {recipe.servings} porzioni
                      </div>
                      
                      {recipe.external_link && (
                        <div className="flex items-center text-sm text-blue-400">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          <a 
                            href={recipe.external_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Link esterno
                          </a>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-2">Ingredienti principali:</h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{recipe.ingredients.length - 3} altri
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'Nessuna ricetta trovata' : 'Nessuna ricetta ancora'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Prova a modificare i filtri di ricerca' 
                : 'Inizia creando la tua prima ricetta!'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crea Prima Ricetta
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

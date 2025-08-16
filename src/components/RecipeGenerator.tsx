import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChefHat, 
  X, 
  Loader2, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  Users,
  Star,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface FridgeItem {
  name: string;
  quantity: string;
  category: string;
  confidence: number;
}

interface FridgeAnalysisResult {
  items: FridgeItem[];
  totalItems: number;
  confidence: number;
  categories: string[];
}

interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  servings: number;
  difficulty: string;
  category: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  tags: string[];
}

interface RecipeGeneratorProps {
  fridgeData: FridgeAnalysisResult;
  onClose: () => void;
  onSaveRecipe: (recipe: GeneratedRecipe) => void;
}

export function RecipeGenerator({ fridgeData, onClose, onSaveRecipe }: RecipeGeneratorProps) {
  const [step, setStep] = useState<'preferences' | 'generating' | 'results'>('preferences');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null);
  
  // Preferenze utente
  const [preferences, setPreferences] = useState({
    courseType: 'main',
    difficulty: 'medium',
    cookingTime: '30',
    servings: 2,
    dietaryRestrictions: [] as string[],
    cuisine: 'italian',
    lightMeal: false
  });

  // Funzioni per salvare e caricare le preferenze
  const savePreferences = (newPreferences: typeof preferences) => {
    try {
      localStorage.setItem('recipeGeneratorPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Errore nel salvataggio delle preferenze:', error);
    }
  };

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('recipeGeneratorPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validazione dei dati caricati
        if (parsed && typeof parsed === 'object') {
          return {
            courseType: courseTypes.find(c => c.value === parsed.courseType) ? parsed.courseType : 'main',
            difficulty: difficulties.find(d => d.value === parsed.difficulty) ? parsed.difficulty : 'medium',
            cookingTime: ['15', '30', '45', '60', '90', '120'].includes(parsed.cookingTime) ? parsed.cookingTime : '30',
            servings: [1, 2, 3, 4, 6, 8].includes(parsed.servings) ? parsed.servings : 2,
            dietaryRestrictions: Array.isArray(parsed.dietaryRestrictions) ? parsed.dietaryRestrictions : [],
            cuisine: cuisines.find(c => c.value === parsed.cuisine) ? parsed.cuisine : 'italian',
            lightMeal: typeof parsed.lightMeal === 'boolean' ? parsed.lightMeal : false
          };
        }
      }
    } catch (error) {
      console.warn('Errore nel caricamento delle preferenze:', error);
    }
    return null;
  };

  // Carica le preferenze salvate all'avvio
  useEffect(() => {
    const savedPreferences = loadPreferences();
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, []);

  // Salva le preferenze quando cambiano
  const updatePreferences = (newPreferences: typeof preferences) => {
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    // Mostra un toast di conferma per le modifiche importanti
    if (newPreferences.dietaryRestrictions.length !== preferences.dietaryRestrictions.length) {
      toast.success('Preferenze salvate!');
    }
  };

  const courseTypes = [
    { value: 'breakfast', label: 'Colazione' },
    { value: 'main', label: 'Piatto Principale' },
    { value: 'side', label: 'Contorno/Antipasto' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'snack', label: 'Snack' },
    { value: 'drink', label: 'Bevanda' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Medio' },
    { value: 'hard', label: 'Difficile' }
  ];

  const dietaryRestrictions = [
    { value: 'vegetarian', label: 'Vegetariano' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'gluten-free', label: 'Senza Glutine' },
    { value: 'dairy-free', label: 'Senza Latticini' },
    { value: 'low-carb', label: 'Basso Contenuto di Carboidrati' },
    { value: 'low-fat', label: 'Basso Contenuto di Grassi' }
  ];

  const cuisines = [
    { value: 'italian', label: 'Italiana' },
    { value: 'mediterranean', label: 'Mediterranea' },
    { value: 'international', label: 'Internazionale' },
    { value: 'asian', label: 'Asiatica' },
    { value: 'mexican', label: 'Messicana' }
  ];

  const generateRecipes = async () => {
    setIsGenerating(true);
    setStep('generating');
    
    try {
      const recipes = await generateRecipesWithAI(fridgeData, preferences);
      setGeneratedRecipes(recipes);
      setStep('results');
      toast.success(`Generate ${recipes.length} ricette!`);
    } catch (error) {
      console.error('Errore nella generazione delle ricette:', error);
      toast.error('Errore nella generazione delle ricette');
      setStep('preferences');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecipesWithAI = async (
    fridgeData: FridgeAnalysisResult, 
    preferences: any
  ): Promise<GeneratedRecipe[]> => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('Chiave API OpenAI non configurata');
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const availableIngredients = fridgeData.items.map(item => `${item.name} (${item.quantity})`).join(', ');
    
         // Costruisci la sezione delle restrizioni dietetiche
     const dietaryRestrictionsText = preferences.dietaryRestrictions.length > 0 
       ? preferences.dietaryRestrictions.map(restriction => {
           const restrictionInfo = dietaryRestrictions.find(r => r.value === restriction);
           return restrictionInfo ? restrictionInfo.label : restriction;
         }).join(', ')
       : 'Nessuna';

     const prompt = `Genera 3 ricette italiane utilizzando principalmente questi ingredienti disponibili: ${availableIngredients}

Preferenze:
- Tipo di piatto: ${courseTypes.find(c => c.value === preferences.courseType)?.label}
- Difficoltà: ${difficulties.find(d => d.value === preferences.difficulty)?.label}
- Tempo di cottura: massimo ${preferences.cookingTime} minuti
- Porzioni: ${preferences.servings}
- Cucina: ${cuisines.find(c => c.value === preferences.cuisine)?.label}
- Pasto leggero: ${preferences.lightMeal ? 'Sì' : 'No'}
- Restrizioni dietetiche: ${dietaryRestrictionsText}

Rispondi SOLO con JSON valido:

{
  "recipes": [
    {
      "title": "Nome ricetta",
      "description": "Breve descrizione della ricetta",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "instructions": ["passo 1", "passo 2"],
      "cookingTime": "30 minuti",
      "servings": 2,
      "difficulty": "facile",
      "category": "main",
      "calories": 350,
      "proteins": 15,
      "carbs": 45,
      "fats": 12,
      "tags": ["tag1", "tag2"]
    }
  ]
}

Linee guida:
- Usa principalmente gli ingredienti disponibili
- Puoi suggerire 1-2 ingredienti base comuni (olio, sale, pepe)
- Istruzioni chiare e dettagliate
- Calorie e macronutrienti realistici
- Tag appropriati per la categorizzazione
- Ricette autenticamente italiane
- Per la categoria usa SOLO questi valori: "breakfast", "main", "side", "dessert", "snack", "drink"
- RISPETTA ASSOLUTAMENTE le restrizioni dietetiche specificate
- Se ci sono restrizioni dietetiche, assicurati che le ricette le rispettino completamente
- Rispondi SOLO con JSON`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Nessuna risposta dall\'AI');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Formato risposta non valido');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      if (!result.recipes || !Array.isArray(result.recipes)) {
        throw new Error('Formato ricette non valido');
      }

      return result.recipes.map((recipe: any) => ({
        ...recipe,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        tags: Array.isArray(recipe.tags) ? recipe.tags : []
      }));
    } catch (error) {
      console.error('Errore generazione ricette:', error);
      throw error;
    }
  };

  const handleSaveRecipe = (recipe: GeneratedRecipe) => {
    onSaveRecipe(recipe);
    toast.success('Ricetta salvata con successo!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCourseTypeColor = (category: string) => {
    const colors: Record<string, string> = {
      antipasto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      primo: 'bg-red-500/20 text-red-400 border-red-500/30',
      secondo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      contorno: 'bg-green-500/20 text-green-400 border-green-500/30',
      dessert: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      main: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transform-gpu will-change-transform"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 p-6 transform-gpu will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
              <ChefHat className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Generatore di Ricette</h2>
              <p className="text-gray-400">Crea ricette personalizzate con i tuoi ingredienti</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Ingredienti disponibili */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Ingredienti Disponibili</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {fridgeData.items.map((item, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {item.name} ({item.quantity})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preferenze */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tipo di Piatto</label>
                  <select
                    value={preferences.courseType}
                    onChange={(e) => updatePreferences({ ...preferences, courseType: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    {courseTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Difficoltà</label>
                  <select
                    value={preferences.difficulty}
                    onChange={(e) => updatePreferences({ ...preferences, difficulty: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tempo Massimo (minuti)</label>
                  <select
                    value={preferences.cookingTime}
                    onChange={(e) => updatePreferences({ ...preferences, cookingTime: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="15">15 minuti</option>
                    <option value="30">30 minuti</option>
                    <option value="45">45 minuti</option>
                    <option value="60">1 ora</option>
                    <option value="90">1.5 ore</option>
                    <option value="120">2 ore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Porzioni</label>
                  <select
                    value={preferences.servings}
                    onChange={(e) => updatePreferences({ ...preferences, servings: parseInt(e.target.value) })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    <option value={1}>1 persona</option>
                    <option value={2}>2 persone</option>
                    <option value={3}>3 persone</option>
                    <option value={4}>4 persone</option>
                    <option value={6}>6 persone</option>
                    <option value={8}>8 persone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Stile Cucina</label>
                  <select
                    value={preferences.cuisine}
                    onChange={(e) => updatePreferences({ ...preferences, cuisine: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    {cuisines.map(cuisine => (
                      <option key={cuisine.value} value={cuisine.value}>{cuisine.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Opzioni</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="light-meal"
                        checked={preferences.lightMeal}
                        onCheckedChange={(checked) => updatePreferences({ ...preferences, lightMeal: checked as boolean })}
                        className="border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label htmlFor="light-meal" className="text-sm text-gray-300 cursor-pointer">
                        Pasto leggero
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restrizioni dietetiche */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Restrizioni Dietetiche (opzionale)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {dietaryRestrictions.map(restriction => (
                    <div key={restriction.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${restriction.value}`}
                        checked={preferences.dietaryRestrictions.includes(restriction.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updatePreferences({
                              ...preferences,
                              dietaryRestrictions: [...preferences.dietaryRestrictions, restriction.value]
                            });
                          } else {
                            updatePreferences({
                              ...preferences,
                              dietaryRestrictions: preferences.dietaryRestrictions.filter(r => r !== restriction.value)
                            });
                          }
                        }}
                        className="border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label htmlFor={`dietary-${restriction.value}`} className="text-sm text-gray-300 cursor-pointer">
                        {restriction.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={generateRecipes}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Genera Ricette
                </Button>
                <Button
                  onClick={() => {
                    const defaultPreferences = {
                      courseType: 'main',
                      difficulty: 'medium',
                      cookingTime: '30',
                      servings: 2,
                      dietaryRestrictions: [] as string[],
                      cuisine: 'italian',
                      lightMeal: false
                    };
                    updatePreferences(defaultPreferences);
                    toast.success('Preferenze resettate ai valori di default');
                  }}
                  variant="outline"
                  className="px-4"
                >
                  Reset
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="space-y-6">
                <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">Generando le tue ricette...</h3>
                <p className="text-gray-400">L'AI sta creando ricette personalizzate con i tuoi ingredienti</p>
                <Progress value={undefined} className="w-full max-w-md mx-auto" />
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Ricette Generate!</h3>
                <p className="text-gray-400">Ecco le ricette create con i tuoi ingredienti</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedRecipes.map((recipe, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-600 hover:border-gray-500 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-white text-lg">{recipe.title}</CardTitle>
                        <Button
                          onClick={() => handleSaveRecipe(recipe)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-400 text-sm">{recipe.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className={getCourseTypeColor(recipe.category)}>
                          {courseTypes.find(c => c.value === recipe.category)?.label || recipe.category}
                        </Badge>
                        <Badge className={getDifficultyColor(recipe.difficulty)}>
                          {difficulties.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-4 w-4" />
                          {recipe.cookingTime}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="h-4 w-4" />
                          {recipe.servings} porz.
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Star className="h-4 w-4" />
                          {recipe.calories} kcal
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-white mb-2">Ingredienti principali:</h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 4).map((ingredient, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {recipe.ingredients.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.ingredients.length - 4} altri
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedRecipe(recipe)}
                        variant="outline"
                        className="w-full"
                      >
                        Vedi Dettagli
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setStep('preferences')}
                  variant="outline"
                >
                  Nuove Preferenze
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-500 to-blue-500"
                >
                  Chiudi
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialog per dettagli ricetta */}
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-900 border border-gray-600 p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedRecipe.title}</h2>
                <Button
                  onClick={() => setSelectedRecipe(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <p className="text-gray-300">{selectedRecipe.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-2">Informazioni</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div>Tempo: {selectedRecipe.cookingTime}</div>
                      <div>Porzioni: {selectedRecipe.servings}</div>
                      <div>Difficoltà: {selectedRecipe.difficulty}</div>
                      <div>Calorie: {selectedRecipe.calories} kcal</div>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-2">Macronutrienti</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div>Proteine: {selectedRecipe.proteins}g</div>
                      <div>Carboidrati: {selectedRecipe.carbs}g</div>
                      <div>Grassi: {selectedRecipe.fats}g</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">Ingredienti</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">Istruzioni</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                {selectedRecipe.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-white mb-2">Tag</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-green-400 border-green-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSaveRecipe(selectedRecipe)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salva Ricetta
                  </Button>
                  <Button
                    onClick={() => setSelectedRecipe(null)}
                    variant="outline"
                  >
                    Chiudi
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

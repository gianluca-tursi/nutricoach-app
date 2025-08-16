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

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  images?: string[];
  external_link?: string;
  user_id: string;
  created_at: string;
  tags: string[];
  has_recipe_text?: boolean;
  ingredients?: string[];
}

interface RecipeMatch {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  coveragePercentage: number;
}

// Normalizza il nome dell'ingrediente per il confronto
function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Rimuovi punteggiatura
    .replace(/\s+/g, ' ') // Normalizza spazi
    .replace(/i$/, 'o') // Converti plurali in singolari (es: carciofi -> carciofo)
    .replace(/e$/, 'a') // Converti plurali femminili (es: patate -> patata)
    .replace(/che$/, 'ca') // Converti plurali femminili (es: pesche -> pesca)
    .replace(/chi$/, 'co'); // Converti plurali maschili (es: asparagi -> asparago)
}

// Estrae ingredienti da una stringa di testo
function extractIngredientsFromText(text: string): string[] {
  if (!text) return [];
  
  // Cerca pattern comuni per ingredienti
  const ingredientPatterns = [
    /ingredienti?[:\s]*(.*?)(?=istruzioni|preparazione|procedimento|$)/is,
    /(?:per|servono|occorrono)[:\s]*(.*?)(?=procedimento|preparazione|istruzioni|$)/is,
    /(?:lista ingredienti?|ingredienti necessari)[:\s]*(.*?)(?=procedimento|preparazione|istruzioni|$)/is
  ];
  
  for (const pattern of ingredientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Estrai ingredienti dalla lista
      const ingredientsText = match[1].trim();
      return ingredientsText
        .split(/[•\-\*]/) // Split su bullet points
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0)
        .map(ing => {
          // Rimuovi quantità e parentesi
          return ing.replace(/^\d+[.,]?\s*/, '') // Rimuovi numeri all'inizio
                   .replace(/\([^)]*\)/g, '') // Rimuovi parentesi
                   .replace(/^\d+\s*(?:g|kg|ml|l|tazza|cucchiaio|cucchiaino)/i, '') // Rimuovi unità di misura
                   .trim();
        })
        .filter(ing => ing.length > 2); // Filtra ingredienti troppo corti
    }
  }
  
  return [];
}

// Calcola il punteggio di matching tra ingredienti
function calculateIngredientMatch(fridgeIngredients: string[], recipeIngredients: string[]): {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchScore: number;
  coveragePercentage: number;
} {
  const normalizedFridge = fridgeIngredients.map(normalizeIngredient);
  const normalizedRecipe = recipeIngredients.map(normalizeIngredient);
  
  console.log('🔧 Normalizzazione ingredienti:');
  console.log('Frigo normalizzato:', normalizedFridge);
  console.log('Ricetta normalizzata:', normalizedRecipe);
  
  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];
  
  // Controlla ogni ingrediente della ricetta
  for (let i = 0; i < normalizedRecipe.length; i++) {
    const recipeIngredient = normalizedRecipe[i];
    const originalRecipeIngredient = recipeIngredients[i];
    let found = false;
    
    console.log(`\n🔍 Cercando match per: "${originalRecipeIngredient}" (normalizzato: "${recipeIngredient}")`);
    
    // Cerca match esatti o parziali
    for (let j = 0; j < normalizedFridge.length; j++) {
      const fridgeIngredient = normalizedFridge[j];
      const originalFridgeIngredient = fridgeIngredients[j];
      
      console.log(`  Confrontando con: "${originalFridgeIngredient}" (normalizzato: "${fridgeIngredient}")`);
      
      if (recipeIngredient === fridgeIngredient) {
        // Match esatto
        console.log(`  ✅ MATCH ESATTO trovato!`);
        matchedIngredients.push(originalFridgeIngredient);
        found = true;
        break;
      } else if (recipeIngredient.includes(fridgeIngredient) && fridgeIngredient.length > 2) {
        // L'ingrediente del frigo è contenuto nella ricetta (es: "carciofo" in "carciofi")
        console.log(`  ✅ MATCH PARZIALE: "${fridgeIngredient}" contenuto in "${recipeIngredient}"`);
        matchedIngredients.push(originalFridgeIngredient);
        found = true;
        break;
      } else if (fridgeIngredient.includes(recipeIngredient) && recipeIngredient.length > 2) {
        // L'ingrediente della ricetta è contenuto nel frigo (es: "carciofo" in "carciofi")
        console.log(`  ✅ MATCH PARZIALE: "${recipeIngredient}" contenuto in "${fridgeIngredient}"`);
        matchedIngredients.push(originalFridgeIngredient);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`  ❌ Nessun match trovato per "${originalRecipeIngredient}"`);
      missingIngredients.push(originalRecipeIngredient);
    }
  }
  
  // Calcola punteggi
  const matchScore = matchedIngredients.length / normalizedRecipe.length;
  const coveragePercentage = (matchedIngredients.length / normalizedRecipe.length) * 100;
  
  return {
    matchedIngredients,
    missingIngredients,
    matchScore,
    coveragePercentage
  };
}

// Trova ricette compatibili con gli ingredienti del frigo
export async function findMatchingRecipes(
  fridgeData: FridgeAnalysisResult,
  recipes: Recipe[],
  minMatchThreshold: number = 0.3
): Promise<RecipeMatch[]> {
  const fridgeIngredients = fridgeData.items.map(item => item.name);
  const matches: RecipeMatch[] = [];
  
  console.log('🔍 Analisi matching ricette:');
  console.log('Ingredienti nel frigo:', fridgeIngredients);
  
  for (const recipe of recipes) {
    let recipeIngredients: string[] = [];
    
    // Estrai ingredienti dalla ricetta
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipeIngredients = recipe.ingredients;
    } else if (recipe.description) {
      recipeIngredients = extractIngredientsFromText(recipe.description);
    }
    
    if (recipeIngredients.length === 0) {
      continue; // Salta ricette senza ingredienti
    }
    
    console.log(`\n📋 Ricetta: ${recipe.title}`);
    console.log('Ingredienti ricetta:', recipeIngredients);
    
    // Calcola matching
    const match = calculateIngredientMatch(fridgeIngredients, recipeIngredients);
    
    console.log('✅ Ingredienti trovati:', match.matchedIngredients);
    console.log('❌ Ingredienti mancanti:', match.missingIngredients);
    console.log('📊 Percentuale compatibilità:', match.coveragePercentage.toFixed(1) + '%');
    
    // Filtra per soglia minima
    if (match.matchScore >= minMatchThreshold) {
      matches.push({
        recipe,
        matchScore: match.matchScore,
        matchedIngredients: match.matchedIngredients,
        missingIngredients: match.missingIngredients,
        coveragePercentage: match.coveragePercentage
      });
    }
  }
  
  console.log(`\n🎯 Trovate ${matches.length} ricette compatibili`);
  
  // Ordina per punteggio di matching (decrescente)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// Suggerisce ingredienti mancanti per completare una ricetta
export function suggestMissingIngredients(
  recipe: Recipe,
  fridgeData: FridgeAnalysisResult
): string[] {
  const fridgeIngredients = fridgeData.items.map(item => item.name);
  let recipeIngredients: string[] = [];
  
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipeIngredients = recipe.ingredients;
  } else if (recipe.description) {
    recipeIngredients = extractIngredientsFromText(recipe.description);
  }
  
  const match = calculateIngredientMatch(fridgeIngredients, recipeIngredients);
  return match.missingIngredients;
}

// Calcola la compatibilità generale tra frigo e ricetta
export function calculateRecipeCompatibility(
  recipe: Recipe,
  fridgeData: FridgeAnalysisResult
): {
  compatibility: number;
  canMake: boolean;
  missingCount: number;
  availableCount: number;
  totalCount: number;
} {
  const fridgeIngredients = fridgeData.items.map(item => item.name);
  let recipeIngredients: string[] = [];
  
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipeIngredients = recipe.ingredients;
  } else if (recipe.description) {
    recipeIngredients = extractIngredientsFromText(recipe.description);
  }
  
  if (recipeIngredients.length === 0) {
    return {
      compatibility: 0,
      canMake: false,
      missingCount: 0,
      availableCount: 0,
      totalCount: 0
    };
  }
  
  const match = calculateIngredientMatch(fridgeIngredients, recipeIngredients);
  const canMake = match.coveragePercentage >= 70; // Considera fattibile se hai almeno il 70% degli ingredienti
  
  return {
    compatibility: match.matchScore,
    canMake,
    missingCount: match.missingIngredients.length,
    availableCount: match.matchedIngredients.length,
    totalCount: recipeIngredients.length
  };
}

// Filtra ricette per categoria e difficoltà
export function filterRecipesByPreferences(
  recipes: RecipeMatch[],
  preferences: {
    courseType?: string;
    difficulty?: string;
    maxCookingTime?: number;
    dietaryRestrictions?: string[];
  }
): RecipeMatch[] {
  return recipes.filter(match => {
    const recipe = match.recipe;
    
    // Filtro per categoria
    if (preferences.courseType && preferences.courseType !== 'all') {
      if (recipe.category !== preferences.courseType) {
        return false;
      }
    }
    
    // Filtro per restrizioni dietetiche (basato sui tag)
    if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
      const recipeTags = recipe.tags || [];
      const hasRequiredTag = preferences.dietaryRestrictions.some(restriction => 
        recipeTags.some(tag => tag.toLowerCase().includes(restriction.toLowerCase()))
      );
      
      if (!hasRequiredTag) {
        return false;
      }
    }
    
    return true;
  });
}

// Ottimizza la lista degli ingredienti per il frigo
export function optimizeFridgeIngredients(fridgeData: FridgeAnalysisResult): {
  essential: FridgeItem[];
  optional: FridgeItem[];
  expired: FridgeItem[];
} {
  const essential: FridgeItem[] = [];
  const optional: FridgeItem[] = [];
  const expired: FridgeItem[] = [];
  
  // Categorizza ingredienti per priorità
  for (const item of fridgeData.items) {
    const category = item.category.toLowerCase();
    
    // Ingredienti essenziali (base per molte ricette)
    if (['verdure', 'carne', 'pesce', 'uova', 'latticini'].includes(category)) {
      essential.push(item);
    }
    // Ingredienti opzionali (condimenti, spezie)
    else if (['condimenti', 'bevande'].includes(category)) {
      optional.push(item);
    }
    // Altri ingredienti
    else {
      optional.push(item);
    }
  }
  
  return { essential, optional, expired };
}

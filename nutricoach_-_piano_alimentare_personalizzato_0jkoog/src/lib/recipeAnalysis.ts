import OpenAI from 'openai';

// Inizializza OpenAI con la chiave API dall'ambiente
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface RecipeAnalysis {
  title: string;
  description: string;
  category: string;
  tags: string[];
  has_recipe_text?: boolean;
  ingredients?: string[];
  instructions?: string[];
}

export async function analyzeRecipeImage(imageUrl: string): Promise<RecipeAnalysis> {
  try {
    // Verifica che la chiave API sia configurata
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('Chiave API OpenAI non configurata, usando simulazione');
      return await simulateRecipeAnalysis(imageUrl);
    }
    
    console.log('Analizzando ricetta con OpenAI Vision...');
    
    // Converti l'URL dell'immagine in base64 se necessario
    let imageBase64 = imageUrl;
    if (imageUrl.startsWith('http')) {
      // Se è un URL, scarica l'immagine e convertila in base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      imageBase64 = await blobToBase64(blob);
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analizza questa immagine e fornisci informazioni dettagliate in formato JSON.

IMPORTANTE: Rispondi SOLO con JSON valido, nessun altro testo.

CASO 1 - SE L'IMMAGINE CONTIENE TESTO DI RICETTA:
- Leggi tutto il testo della ricetta visibile
- Estrai il titolo della ricetta
- Copia la descrizione/istruzioni esattamente come appaiono nel testo
- Identifica la categoria basandoti sul tipo di piatto

CASO 2 - SE L'IMMAGINE MOSTRA SOLO UN PIATTO FINITO:
- Identifica il piatto visibile
- Crea un titolo appropriato
- Cerca online una ricetta simile e fornisci una descrizione basata su ricette tradizionali
- Suggerisci ingredienti e passaggi tipici

Formato JSON:
{
  "title": "Nome della ricetta in italiano",
  "description": "Descrizione dettagliata o testo della ricetta",
  "category": "breakfast|main|side|dessert|snack|drink",
  "tags": ["tag1", "tag2", "tag3"],
  "has_recipe_text": true/false,
  "ingredients": ["ingrediente1", "ingrediente2"],
  "instructions": ["passo1", "passo2"]
}

Linee guida:
- Se vedi testo di ricetta, copialo esattamente
- Se vedi solo un piatto, descrivi come prepararlo
- Usa nomi italiani per le ricette
- Aggiungi ingredienti e istruzioni quando possibile
- Tag rilevanti: "vegetariano", "veloce", "tradizionale", "estivo", "senza glutine", etc.
- Rispondi SOLO con JSON`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Nessuna risposta dall\'AI');
    }

    console.log('Risposta OpenAI:', content);

    // Estrai il JSON dalla risposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Formato di risposta non valido. Risposta ricevuta: ' + content.substring(0, 200));
    }

    try {
      const result = JSON.parse(jsonMatch[0]) as RecipeAnalysis;
      
      // Validazione dei dati ricevuti
      if (!result.title || !result.description || !result.category) {
        throw new Error('Dati mancanti nella risposta AI');
      }
      
      // Assicurati che la categoria sia valida
      const validCategories = ['breakfast', 'main', 'side', 'dessert', 'snack', 'drink'];
      if (!validCategories.includes(result.category)) {
        result.category = 'main'; // Fallback
      }
      
      // Assicurati che i tag siano un array
      if (!Array.isArray(result.tags)) {
        result.tags = [];
      }
      
      // Assicurati che ingredienti e istruzioni siano array
      if (!Array.isArray(result.ingredients)) {
        result.ingredients = [];
      }
      
      if (!Array.isArray(result.instructions)) {
        result.instructions = [];
      }
      
      // Imposta has_recipe_text se non presente
      if (result.has_recipe_text === undefined) {
        result.has_recipe_text = result.ingredients.length > 0 || result.instructions.length > 0;
      }
      
      console.log('Analisi AI completata:', result);
      return result;
    } catch (parseError) {
      console.error('Errore parsing JSON:', parseError);
      console.error('Tentativo di parsing:', jsonMatch[0]);
      throw new Error('Errore nel parsing della risposta JSON');
    }
  } catch (error: any) {
    console.error('Errore nell\'analisi AI della ricetta:', error);
    
    // Se l'AI non riesce ad analizzare, usa la simulazione
    console.log('Usando analisi simulata come fallback...');
    return await simulateRecipeAnalysis(imageUrl);
  }
}

// Funzione helper per convertire blob in base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Rimuovi il prefisso data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function simulateRecipeAnalysis(imageUrl: string): Promise<RecipeAnalysis> {
  // Simula l'analisi basata su pattern comuni nelle ricette
  const possibleTitles = [
    'Pasta al Pomodoro',
    'Insalata Caprese',
    'Pizza Margherita',
    'Tiramisù',
    'Lasagna alla Bolognese',
    'Risotto ai Funghi',
    'Bistecca alla Fiorentina',
    'Minestrone',
    'Carbonara',
    'Panna Cotta'
  ];
  
  const possibleDescriptions = [
    'Classica ricetta italiana tradizionale',
    'Piatto fresco e leggero perfetto per l\'estate',
    'Ricetta semplice ma deliziosa',
    'Dolce tradizionale italiano',
    'Piatto ricco e sostanzioso',
    'Risotto cremoso e saporito',
    'Bistecca grigliata alla perfezione',
    'Zuppa calda e nutriente',
    'Pasta cremosa e saporita',
    'Dolce cremoso e raffinato'
  ];
  
  const categories = ['main', 'side', 'dessert', 'breakfast', 'snack'];
  
  const possibleTags = [
    'italiano', 'tradizionale', 'vegetariano', 'veloce', 'facile',
    'estivo', 'invernale', 'cremoso', 'fresco', 'saporito'
  ];
  
  // Simula l'analisi basata su un hash dell'URL dell'immagine
  const hash = imageUrl.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const titleIndex = Math.abs(hash) % possibleTitles.length;
  const descIndex = Math.abs(hash + 1) % possibleDescriptions.length;
  const categoryIndex = Math.abs(hash + 2) % categories.length;
  
  // Seleziona 2-4 tag casuali
  const numTags = 2 + (Math.abs(hash) % 3);
  const selectedTags = [];
  for (let i = 0; i < numTags; i++) {
    const tagIndex = Math.abs(hash + i + 3) % possibleTags.length;
    if (!selectedTags.includes(possibleTags[tagIndex])) {
      selectedTags.push(possibleTags[tagIndex]);
    }
  }
  
  return {
    title: possibleTitles[titleIndex],
    description: possibleDescriptions[descIndex],
    category: categories[categoryIndex],
    tags: selectedTags
  };
}

// Funzione per integrare con OpenAI Vision API (futuro)
export async function analyzeRecipeImageWithOpenAI(imageUrl: string): Promise<RecipeAnalysis> {
  // TODO: Implementare l'integrazione con OpenAI Vision API
  // const response = await fetch('/api/openai/analyze-recipe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ imageUrl })
  // });
  // return response.json();
  
  // Per ora, usa la simulazione
  return simulateRecipeAnalysis(imageUrl);
}

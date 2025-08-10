import OpenAI from 'openai';

// Inizializza OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Necessario per l'uso nel browser
});

export interface FoodAnalysisResult {
  foods: Array<{
    name: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }>;
  total_calories: number;
  total_proteins: number;
  total_carbs: number;
  total_fats: number;
  confidence: number;
}

// Trascrive l'audio usando Whisper
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Converti il Blob in File per l'API
    const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
    
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'it',
    });

    return response.text;
  } catch (error) {
    console.error('Errore nella trascrizione:', error);
    throw new Error('Errore nella trascrizione audio');
  }
}

// Analizza il testo del cibo usando GPT-4
export async function analyzeFoodText(text: string): Promise<FoodAnalysisResult> {
  try {
    const prompt = `
Analizza il seguente testo che descrive un pasto e identifica il PIATTO PRINCIPALE con i suoi valori nutrizionali.

Testo: "${text}"

IMPORTANTE: Identifica il PIATTO PRINCIPALE, non gli ingredienti singoli. 
Se la persona dice "ho mangiato pasta al pomodoro", il piatto principale è "Pasta al pomodoro", non "pasta" e "pomodoro" separatamente.

Rispondi SOLO con un JSON valido nel seguente formato:
{
  "foods": [
    {
      "name": "NOME DEL PIATTO PRINCIPALE",
      "calories": numero_calorie_per_porzione,
      "proteins": grammi_proteine_per_porzione,
      "carbs": grammi_carboidrati_per_porzione,
      "fats": grammi_grassi_per_porzione
    }
  ],
  "total_calories": calorie_del_piatto_principale,
  "total_proteins": proteine_del_piatto_principale,
  "total_carbs": carboidrati_del_piatto_principale,
  "total_fats": grassi_del_piatto_principale,
  "confidence": percentuale_confidenza_analisi
}

Esempi:
- "Ho mangiato pasta al pomodoro" → piatto principale: "Pasta al pomodoro"
- "Ho preso una pizza margherita" → piatto principale: "Pizza margherita"
- "Ho mangiato risotto ai funghi" → piatto principale: "Risotto ai funghi"

La confidenza deve essere un numero tra 0 e 100.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sei un esperto nutrizionista. Analizza accuratamente i pasti e fornisci valori nutrizionali realistici.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Nessuna risposta dall\'AI');
    }

    // Estrai il JSON dalla risposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Formato di risposta non valido');
    }

    const result = JSON.parse(jsonMatch[0]) as FoodAnalysisResult;
    
    // Validazione dei dati
    if (!result.foods || !Array.isArray(result.foods)) {
      throw new Error('Dati alimentari non validi');
    }

    return result;
  } catch (error) {
    console.error('Errore nell\'analisi del testo:', error);
    
    // Fallback con valori di default
    return {
      foods: [
        {
          name: 'Pasto non identificato',
          calories: 300,
          proteins: 15,
          carbs: 30,
          fats: 10,
        }
      ],
      total_calories: 300,
      total_proteins: 15,
      total_carbs: 30,
      total_fats: 10,
      confidence: 30,
    };
  }
} 
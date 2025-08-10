import OpenAI from 'openai';

// Inizializza OpenAI con la chiave API dall'ambiente
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Solo per sviluppo - in produzione usare un backend
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

export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
  // Verifica che la chiave API sia configurata
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('Chiave API OpenAI non configurata. Aggiungi VITE_OPENAI_API_KEY al file .env');
  }
  
  // Verifica che l'immagine sia valida
  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error('Immagine non valida o troppo piccola');
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a helpful nutrition assistant. Please analyze this food image and provide nutritional information in JSON format.

IMPORTANT: Respond ONLY with valid JSON, no other text.

JSON format:
{
  "foods": [
    {
      "name": "food name in Italian",
      "calories": 150,
      "proteins": 10,
      "carbs": 20,
      "fats": 5
    }
  ],
  "total_calories": 150,
  "total_proteins": 10,
  "total_carbs": 20,
  "total_fats": 5,
  "confidence": 85
}

Guidelines:
- Analyze the food items visible in the image
- Provide realistic nutritional estimates for Italian portions
- Use only numbers for nutritional values
- Calculate totals by summing individual food values
- Confidence should be between 0-100
- If image is unclear, make best estimate based on visible items
- Respond with JSON only`
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

  

        // Se l'AI risponde con un messaggio di errore, prova con un prompt più semplice
        if (content.includes("I'm sorry") || content.includes("can't assist") || content.includes("unable to")) {
  
          
          const simpleResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this food image and return JSON with nutritional info: {"foods":[{"name":"food name","calories":150,"proteins":10,"carbs":20,"fats":5}],"total_calories":150,"total_proteins":10,"total_carbs":20,"total_fats":5,"confidence":80}`
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
            max_tokens: 500,
          });
          
          const simpleContent = simpleResponse.choices[0]?.message?.content;
          if (simpleContent && !simpleContent.includes("I'm sorry")) {

            // Usa la risposta semplice
            const jsonMatch = simpleContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[0]) as FoodAnalysisResult;
                if (result.foods && typeof result.total_calories === 'number') {
                  return result;
                }
              } catch (parseError) {
                console.error('Error parsing simple response:', parseError);
              }
            }
          }
        }

    // Estrai il JSON dalla risposta - cerca sia JSON completo che parziale
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Se non trova JSON, prova a cercare solo la parte con i dati
      jsonMatch = content.match(/\{[^}]*"foods"[^}]*\}/);
    }
    
    if (!jsonMatch) {
      throw new Error('Formato di risposta non valido. Risposta ricevuta: ' + content.substring(0, 200));
    }

    try {
      const result = JSON.parse(jsonMatch[0]) as FoodAnalysisResult;
      
      // Validazione dei dati ricevuti
      if (!result.foods || !Array.isArray(result.foods)) {
        throw new Error('Dati cibi mancanti o non validi');
      }
      
      if (typeof result.total_calories !== 'number') {
        throw new Error('Calorie totali mancanti o non valide');
      }
      
      return result;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
      throw new Error('Errore nel parsing della risposta JSON');
    }
      } catch (error: any) {
        console.error('Errore nell\'analisi dell\'immagine:', error);
        
        // Se l'AI non riesce ad analizzare, fornisci un risultato di fallback
        if (error.message && (error.message.includes('unable to provide') || error.message.includes("can't assist") || error.message.includes("I'm sorry"))) {
  
          return {
            foods: [
              {
                name: "Cibo non identificato",
                calories: 300,
                proteins: 15,
                carbs: 40,
                fats: 10
              }
            ],
            total_calories: 300,
            total_proteins: 15,
            total_carbs: 40,
            total_fats: 10,
            confidence: 30
          };
        }
        
        throw new Error('Errore nell\'analisi dell\'immagine. Riprova.');
      }
} 
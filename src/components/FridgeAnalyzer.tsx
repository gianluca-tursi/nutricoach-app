import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Loader2, CheckCircle, Sparkles, Package } from 'lucide-react';
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

interface FridgeAnalyzerProps {
  onAnalysisComplete: (result: FridgeAnalysisResult) => void;
  onClose: () => void;
}

export function FridgeAnalyzer({ onAnalysisComplete, onClose }: FridgeAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FridgeAnalysisResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        // Avvia automaticamente l'analisi
        setTimeout(() => analyzeImageWithData(result), 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error('Errore nell\'accesso alla fotocamera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      stopCamera();
      
      // Avvia automaticamente l'analisi
      setTimeout(() => analyzeImageWithData(imageData), 500);
    }
  };

  const analyzeImageWithData = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Rimuovi il prefisso data:image/jpeg;base64, per ottenere solo il base64
      const base64Data = imageData.split(',')[1];
      const result = await analyzeFridgeImage(base64Data);
      setAnalysisResult(result);
      
      if (result.confidence < 50) {
        toast.warning('Bassa confidenza nell\'analisi. Alcuni ingredienti potrebbero non essere stati identificati correttamente.');
      } else {
        toast.success(`Analisi completata! Trovati ${result.totalItems} ingredienti.`);
      }
    } catch (error) {
      console.error('Errore nell\'analisi del frigo:', error);
      toast.error('Errore nell\'analisi del frigo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFridgeImage = async (imageBase64: string): Promise<FridgeAnalysisResult> => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('Chiave API OpenAI non configurata');
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analizza questa foto del frigo e identifica tutti gli ingredienti alimentari visibili. 

IMPORTANTE: Rispondi SOLO con JSON valido, senza testo aggiuntivo prima o dopo.

Formato JSON richiesto:
{
  "items": [
    {
      "name": "nome ingrediente in italiano",
      "quantity": "quantità stimata (es. '1 confezione', '500g', '2 pezzi')",
      "category": "categoria (es. 'verdure', 'frutta', 'latticini', 'carne', 'pesce', 'uova', 'condimenti', 'bevande')",
      "confidence": 85
    }
  ],
  "totalItems": 10,
  "confidence": 80,
  "categories": ["verdure", "frutta", "latticini"]
}

Linee guida:
- Identifica solo ingredienti alimentari
- Stima quantità realistiche
- Usa categorie appropriate
- Confidence per ogni item: 0-100
- Confidence generale: media delle confidenze
- Includi solo categorie presenti
- NON aggiungere testo prima o dopo il JSON
- NON usare markdown o code blocks
- Rispondi SOLO con il JSON puro`
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
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Nessuna risposta dall\'AI');
      }

      console.log('🔍 Risposta AI grezza:', content);

      // Estrai JSON dalla risposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ Nessun JSON trovato nella risposta:', content);
        console.log('🔄 Tentativo di fallback per risposta senza JSON...');
        return {
          items: [],
          totalItems: 0,
          confidence: 0,
          categories: []
        };
      }

      try {
        const result = JSON.parse(jsonMatch[0]) as FridgeAnalysisResult;
        console.log('✅ JSON parsato correttamente:', result);
        
        // Validazione e pulizia
        if (!Array.isArray(result.items)) {
          result.items = [];
        }
        
        result.totalItems = result.items.length;
        result.categories = [...new Set(result.items.map(item => item.category))];
        
        if (result.items.length > 0) {
          result.confidence = Math.round(
            result.items.reduce((sum, item) => sum + (item.confidence || 0), 0) / result.items.length
          );
        }

        return result;
      } catch (parseError) {
        console.error('❌ Errore parsing JSON:', parseError);
        console.error('❌ JSON estratto:', jsonMatch[0]);
        
        // Fallback: prova a creare un risultato base
        console.log('🔄 Tentativo di fallback...');
        return {
          items: [],
          totalItems: 0,
          confidence: 0,
          categories: []
        };
      }
    } catch (error) {
      console.error('Errore analisi frigo:', error);
      throw error;
    }
  };

  const handleConfirm = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
    }
  };

  const resetPhoto = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      verdure: 'bg-green-500/20 text-green-400 border-green-500/30',
      frutta: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      latticini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      carne: 'bg-red-500/20 text-red-400 border-red-500/30',
      pesce: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      uova: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      condimenti: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      bevande: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-2 md:p-4 transform-gpu will-change-transform overflow-y-auto"
      style={{ 
        minHeight: '100vh',
        paddingTop: 'max(env(safe-area-inset-top), 4rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 5rem)',
        alignItems: 'flex-start'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 p-4 md:p-6 transform-gpu will-change-transform shadow-2xl my-4 overflow-y-auto"
        style={{ 
          maxHeight: 'calc(100vh - 9rem)',
          minHeight: 'fit-content',
          marginTop: '0',
          alignSelf: 'flex-start',
          scrollPaddingBottom: '1rem'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
              <Package className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analisi Frigo</h2>
              <p className="text-gray-400">Scatta una foto del tuo frigo per identificare gli ingredienti</p>
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
          {!selectedImage ? (
            <motion.div
              key="upload-options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Opzioni di caricamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => document.getElementById('fridge-file-input')?.click()}
                  className="h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                >
                  <Upload className="h-8 w-8 text-white" />
                  <span className="text-white font-medium">Carica Foto</span>
                  <span className="text-sm text-blue-100">Dal tuo dispositivo</span>
                </Button>

                <Button
                  onClick={startCamera}
                  className="h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                >
                  <Camera className="h-8 w-8 text-white" />
                  <span className="text-white font-medium">Scatta Foto</span>
                  <span className="text-sm text-green-100">Con la fotocamera</span>
                </Button>
              </div>

              <input
                id="fridge-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Fotocamera */}
              {isCameraActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-gray-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    >
                      Scatta Foto
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                    >
                      Annulla
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Immagine selezionata */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-800">
                <img
                  src={selectedImage}
                  alt="Foto del frigo"
                  className="w-full h-64 object-cover"
                />
                <Button
                  onClick={resetPhoto}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!analysisResult && !isAnalyzing && selectedImage && (
                <div className="text-center text-gray-400">
                  <p>L'analisi partirà automaticamente...</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-gray-300">Analizzando il contenuto del frigo...</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}

              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Analisi Completata
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {/* Confidenza */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Confidenza:</span>
                        <Badge className={analysisResult.confidence > 70 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                          {analysisResult.confidence}%
                        </Badge>
                      </div>

                      {/* Statistiche */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                        <div>
                          <span className="text-sm text-gray-400">Ingredienti trovati</span>
                          <div className="font-bold text-lg text-white">{analysisResult.totalItems}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Categorie</span>
                          <div className="font-bold text-lg text-white">{analysisResult.categories.length}</div>
                        </div>
                      </div>

                      {/* Ingredienti identificati */}
                      <div>
                        <h4 className="font-medium mb-3 text-white">Ingredienti identificati:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {analysisResult.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl border border-gray-600/50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white">{item.name}</span>
                                  <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                                    {item.category}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-400">{item.quantity}</span>
                              </div>
                              <Badge className={item.confidence > 70 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                                {item.confidence}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pulsante Conferma */}
                  <div className="pt-4">
                    <Button
                      onClick={handleConfirm}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                    >
                      Cerca Ricette
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

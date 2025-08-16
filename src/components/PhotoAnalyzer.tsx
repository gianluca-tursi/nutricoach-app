import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { analyzeFoodImage, FoodAnalysisResult } from '@/lib/openai';
import { toast } from 'sonner';
import { formatOneDecimal } from '@/lib/utils';

interface PhotoAnalyzerProps {
  onAnalysisComplete: (result: FoodAnalysisResult) => void;
  onClose: () => void;
}

export function PhotoAnalyzer({ onAnalysisComplete, onClose }: PhotoAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
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
      const result = await analyzeFoodImage(base64Data);
      setAnalysisResult(result);
      
      if (result.confidence < 50) {
        toast.warning('Bassa confidenza nell\'analisi. I risultati potrebbero non essere accurati.');
      } else {
        toast.success('Analisi completata con successo!');
      }
    } catch (error) {
      console.error('Errore nell\'analisi dell\'immagine:', error);
      toast.error('Errore nell\'analisi dell\'immagine');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    if (selectedImage) {
      await analyzeImageWithData(selectedImage);
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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 p-6 transform-gpu will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analisi Foto</h2>
              <p className="text-gray-400">Carica o scatta una foto del tuo pasto</p>
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
                  onClick={() => document.getElementById('file-input')?.click()}
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
                id="file-input"
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
                  alt="Foto del pasto"
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
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-gray-300">Analizzando l'immagine...</span>
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

                      {/* Cibi identificati */}
                      <div>
                        <h4 className="font-medium mb-3 text-white">Cibi identificati:</h4>
                        <div className="space-y-2">
                          {analysisResult.foods.map((food, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl border border-gray-600/50">
                              <div>
                                <span className="font-medium text-white">{food.name}</span>
                              </div>
                              <span className="text-sm font-medium text-white">{food.calories} kcal</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totale nutrizionale */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                        <div>
                          <span className="text-sm text-gray-400">Calorie totali</span>
                          <div className="font-bold text-lg text-white">{analysisResult.total_calories} kcal</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-gray-800/50 rounded-2xl p-3">
                            <div className="font-bold text-lg text-white">{formatOneDecimal(analysisResult.total_proteins)}g</div>
                            <div className="text-xs text-gray-400">Proteine</div>
                          </div>
                          <div className="bg-gray-800/50 rounded-2xl p-3">
                            <div className="font-bold text-lg text-white">{formatOneDecimal(analysisResult.total_carbs)}g</div>
                            <div className="text-xs text-gray-400">Carboidrati</div>
                          </div>
                          <div className="bg-gray-800/50 rounded-2xl p-3">
                            <div className="font-bold text-lg text-white">{formatOneDecimal(analysisResult.total_fats)}g</div>
                            <div className="text-xs text-gray-400">Grassi</div>
                          </div>
                        </div>
                      </div>
                    
                      <Button
                        onClick={handleConfirm}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                      >
                        Conferma e Salva
                      </Button>
                    </div>
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
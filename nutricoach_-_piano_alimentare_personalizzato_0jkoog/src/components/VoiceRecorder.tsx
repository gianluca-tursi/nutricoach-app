import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Loader2, CheckCircle, Sparkles, X } from 'lucide-react';
import { transcribeAudio, analyzeFoodText, FoodAnalysisResult } from '@/lib/textAnalysis';
import { toast } from 'sonner';
import { formatOneDecimal } from '@/lib/utils';

interface VoiceRecorderProps {
  onAnalysisComplete: (result: FoodAnalysisResult) => void;
  onClose: () => void;
}

export function VoiceRecorder({ onAnalysisComplete, onClose }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);
  const startedRef = useRef<boolean>(false);

  // Avvia automaticamente la registrazione quando il componente si monta
  useEffect(() => {
    if (startedRef.current) return; // Previeni doppio avvio in StrictMode
    startedRef.current = true;
    startRecording();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleTranscribeAudio(audioBlob);
      };

      // Avvio
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTsRef.current = Date.now();

      // Pulisci eventuale interval precedente
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Timer basato su timestamp reale
      intervalRef.current = setInterval(() => {
        if (startTsRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - startTsRef.current) / 1000);
          setRecordingTime(elapsedSeconds);
        }
      }, 250);

      toast.info('Registrazione iniziata... Parla del tuo pasto!');
    } catch (error) {
      toast.error('Errore nell\'accesso al microfono');
      console.error('Errore registrazione:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);

      // Ferma timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTsRef.current = null;

      toast.info('Registrazione terminata. Trascrizione in corso...');
    }
  };

  const handleTranscribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(audioBlob);
      setTranscription(text);
      toast.success('Trascrizione completata! Analisi AI in corso...');
      
      // Chiudi subito lo stato di trascrizione e passa all'analisi
      setIsTranscribing(false);
      await handleAnalyzeTranscription(text);
    } catch (error) {
      console.error('Errore trascrizione:', error);
      toast.error('Errore nella trascrizione audio');
      setIsTranscribing(false);
    }
  };

  const handleAnalyzeTranscription = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodText(text);
      setAnalysisResult(result);
      
      if (result.confidence < 50) {
        toast.warning('Bassa confidenza nell\'analisi. I risultati potrebbero non essere accurati.');
      } else {
        toast.success('Analisi AI completata con successo!');
      }
    } catch (error) {
      console.error('Errore analisi AI:', error);
      toast.error('Errore nell\'analisi AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
    }
  };

  const resetRecording = () => {
    setTranscription('');
    setAnalysisResult(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    startRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transform-gpu will-change-transform"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md mx-4 transform-gpu will-change-transform"
      >
        <div className="glass-dark rounded-3xl p-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Registrazione Vocale</h2>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isRecording && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="mx-auto w-24 h-24 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <Mic className="h-12 w-12 text-white" />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-white text-lg font-medium mb-2">Registrazione in corso...</p>
                  <p className="text-gray-400 mb-4">Parla del tuo pasto</p>
                  <div className="text-4xl font-bold text-red-400 mb-4 font-mono">
                    {formatTime(recordingTime)}
                  </div>
                  
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Registrazione
                  </Button>
                </div>
              </motion.div>
            )}

            {isTranscribing && !analysisResult && (
              <motion.div
                key="transcribing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white text-lg font-medium mb-2">Trascrizione in corso...</p>
                  <p className="text-gray-400">Elaborazione dell'audio</p>
                </div>
              </motion.div>
            )}

            {isAnalyzing && !analysisResult && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-purple-400 motion-safe:animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white text-lg font-medium mb-2">Analisi AI in corso...</p>
                  <p className="text-gray-400">Analisi dei valori nutrizionali</p>
                </div>
              </motion.div>
            )}

            {analysisResult && !isAnalyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-4">Analisi completata!</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Confidenza</span>
                        <Badge 
                          className={`${
                            analysisResult.confidence >= 80 ? 'bg-green-500' :
                            analysisResult.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          } text-white`}
                        >
                          {analysisResult.confidence}%
                        </Badge>
                      </div>
                      <Progress value={analysisResult.confidence} className="h-2" />
                    </div>

                    {/* Piatto principale evidenziato */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-blue-500/30">
                      <h4 className="text-white font-semibold mb-2">🍽️ Piatto Principale</h4>
                      <div className="text-center mb-3">
                        <p className="text-xl font-bold text-white">{analysisResult.foods[0]?.name || 'Pasto non identificato'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{analysisResult.total_calories}</p>
                          <p className="text-sm text-gray-400">Calorie</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{formatOneDecimal(analysisResult.total_proteins)}g</p>
                          <p className="text-sm text-gray-400">Proteine</p>
                        </div>
                      </div>
                    </div>

                    {/* Dettagli nutrizionali aggiuntivi */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                        <p className="text-lg font-bold text-white">{formatOneDecimal(analysisResult.total_carbs)}g</p>
                        <p className="text-sm text-gray-400">Carboidrati</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                        <p className="text-lg font-bold text-white">{formatOneDecimal(analysisResult.total_fats)}g</p>
                        <p className="text-sm text-gray-400">Grassi</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleConfirm}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                    >
                      Conferma Pasto
                    </Button>
                    <Button
                      onClick={resetRecording}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800/50"
                    >
                      Nuova Registrazione
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
} 
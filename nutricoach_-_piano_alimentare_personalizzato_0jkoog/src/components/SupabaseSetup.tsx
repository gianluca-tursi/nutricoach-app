import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, Database, Key, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SupabaseSetup() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    toast.success('Copiato negli appunti!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="h-16 w-16 text-green-600 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            NutriCoach
          </h1>
          <p className="text-gray-600 mt-2">Configurazione Database</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connetti Supabase
            </CardTitle>
            <CardDescription>
              Per utilizzare NutriCoach, devi prima configurare il database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTitle>⚠️ Configurazione Richiesta</AlertTitle>
              <AlertDescription>
                Supabase non è ancora configurato. Segui questi passaggi per iniziare:
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Connetti Supabase nel Chat
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Usa il comando di connessione Supabase nella chat box per collegare il tuo progetto.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Aggiorna il file .env
                </h3>
                <p className="text-sm text-gray-600 ml-8 mb-3">
                  Dopo la connessione, aggiorna il file <code className="bg-gray-200 px-1 rounded">.env</code> con le tue credenziali:
                </p>
                <div className="ml-8 space-y-2">
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>VITE_SUPABASE_URL=<span className="text-blue-600">your_project_url</span></span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('VITE_SUPABASE_URL=', 'url')}
                      >
                        {copiedUrl ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>VITE_SUPABASE_ANON_KEY=<span className="text-blue-600">your_anon_key</span></span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY=', 'key')}
                      >
                        {copiedKey ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Riavvia l'applicazione
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Dopo aver aggiornato il file .env, riavvia il server di sviluppo per applicare le modifiche.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4">
              <Button asChild>
                <a 
                  href="https://supabase.com/docs/guides/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Documentazione Supabase
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Hai bisogno di aiuto? Chiedi nella chat per assistenza nella configurazione.</p>
        </div>
      </motion.div>
    </div>
  );
}

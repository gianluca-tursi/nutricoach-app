import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Sparkles,
  Database,
  Key,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export function Setup() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const handleSaveConfig = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error('Per favore inserisci entrambi i valori');
      return;
    }

    // In un'app reale, salveresti questi valori in modo sicuro
    // Per ora mostriamo solo un messaggio di successo
    toast.success('Configurazione salvata! Ricarica la pagina per applicare le modifiche.');
    setIsConfigured(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Sparkles className="h-16 w-16 text-green-600 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Configurazione Lumari
            </h1>
            <p className="text-gray-600 mt-2">Configura Supabase per iniziare ad usare l'applicazione</p>
          </div>

          {/* Alert */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configurazione richiesta</AlertTitle>
            <AlertDescription>
              Per utilizzare Lumari, devi configurare Supabase. Segui le istruzioni qui sotto.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Istruzioni</TabsTrigger>
              <TabsTrigger value="configure">Configura</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions">
              <Card>
                <CardHeader>
                  <CardTitle>Come configurare Supabase</CardTitle>
                  <CardDescription>
                    Segui questi passaggi per creare il tuo progetto Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Crea un account Supabase</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Vai su Supabase e crea un account gratuito se non ne hai già uno.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                            Vai a Supabase <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Crea un nuovo progetto</h3>
                        <p className="text-gray-600 text-sm">
                          Clicca su "New Project" e inserisci:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                          <li>Nome progetto: <code className="bg-gray-100 px-1 rounded">lumari</code></li>
                          <li>Password del database (salvala in un posto sicuro)</li>
                          <li>Regione: scegli quella più vicina a te</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Copia le credenziali</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Una volta creato il progetto, vai su Settings → API e copia:
                        </p>
                        <div className="space-y-2">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">Project URL</p>
                                <p className="font-mono text-sm">https://tuoprogetto.supabase.co</p>
                              </div>
                              <Globe className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">anon public key</p>
                                <p className="font-mono text-sm">eyJhbGc...</p>
                              </div>
                              <Key className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        4
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Crea il file .env</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Crea un file <code className="bg-gray-100 px-1 rounded">.env</code> nella root del progetto con:
                        </p>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                          <div className="flex justify-between items-start">
                            <pre className="text-green-400">
{`VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://tuoprogetto.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGc...`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        5
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Esegui le migrazioni</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Vai nell'SQL Editor di Supabase e esegui le query che trovi nella cartella <code className="bg-gray-100 px-1 rounded">supabase/migrations</code>
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://app.supabase.com/project/_/sql" target="_blank" rel="noopener noreferrer">
                            Apri SQL Editor <Database className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Tutto pronto!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Una volta completati questi passaggi, ricarica la pagina e Lumari sarà pronto all'uso.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configure">
              <Card>
                <CardHeader>
                  <CardTitle>Inserisci le credenziali Supabase</CardTitle>
                  <CardDescription>
                    Inserisci l'URL e la chiave pubblica del tuo progetto Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Supabase URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://tuoprogetto.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Supabase Anon Key</Label>
                    <Input
                      id="key"
                      type="text"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Queste credenziali devono essere salvate in un file <code className="font-mono bg-gray-100 px-1 rounded">.env</code> nella root del progetto.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleSaveConfig} 
                    className="w-full"
                    disabled={!supabaseUrl || !supabaseAnonKey}
                  >
                    Salva Configurazione
                  </Button>

                  {isConfigured && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Configurazione salvata! Crea il file .env con le credenziali inserite e ricarica la pagina.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

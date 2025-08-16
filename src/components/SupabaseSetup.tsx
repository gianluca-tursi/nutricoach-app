import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Database, Key, Globe } from 'lucide-react';

export function SupabaseSetup() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  if (!openaiApiKey) missingVars.push('VITE_OPENAI_API_KEY');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Configurazione Richiesta</CardTitle>
          <CardDescription className="text-gray-400">
            Lumari richiede alcune configurazioni per funzionare correttamente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-red-900/20 border-red-700">
            <AlertDescription className="text-red-300">
              <strong>Attenzione:</strong> Le seguenti variabili d'ambiente non sono configurate:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {missingVars.map((varName) => (
              <div key={varName} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  {varName.includes('SUPABASE') ? (
                    <Database className="w-4 h-4 text-white" />
                  ) : varName.includes('OPENAI') ? (
                    <Key className="w-4 h-4 text-white" />
                  ) : (
                    <Globe className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{varName}</p>
                  <p className="text-gray-400 text-sm">
                    {varName.includes('SUPABASE_URL') && 'URL del progetto Supabase'}
                    {varName.includes('SUPABASE_ANON_KEY') && 'Chiave anonima Supabase'}
                    {varName.includes('OPENAI_API_KEY') && 'Chiave API OpenAI'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-semibold mb-2">Come Configurare:</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>1. Supabase:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vai su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">supabase.com</a></li>
                <li>Crea un nuovo progetto</li>
                <li>Copia l'URL del progetto e la chiave anonima</li>
              </ul>
              
              <p className="mt-3"><strong>2. OpenAI:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vai su <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">platform.openai.com</a></li>
                <li>Crea una nuova API key</li>
                <li>Copia la chiave API</li>
              </ul>
              
              <p className="mt-3"><strong>3. Netlify:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vai su <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">app.netlify.com</a></li>
                <li>Seleziona il tuo sito</li>
                <li>Vai su Site settings → Environment variables</li>
                <li>Aggiungi le variabili con i valori copiati</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Ricarica dopo la configurazione
            </Button>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>Dopo aver configurato le variabili d'ambiente, ricarica la pagina per continuare.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

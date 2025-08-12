import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [params] = useSearchParams();

  // Se arriva ?signup=1 apri la tab registrazione
  useState(() => {
    const wantsSignup = params.get('signup') === '1';
    if (wantsSignup) setTab('signup');
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string | null;

    try {
      if (isSignUp) {
        if (!confirm || confirm !== password) {
          toast.error('Le password non coincidono');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        toast.success('Account creato! Benvenuto in NutriCoach');
        navigate('/onboarding');
      } else {
        await signIn(email, password);
        toast.success('Bentornato!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    if (!email) return toast.error('Inserisci la tua email');
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase non configurato');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      toast.success('Email di reset inviata!');
      setResetMode(false);
    } catch (err: any) {
      toast.error(err.message || 'Errore reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="h-16 w-16 text-white mx-auto mb-4 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
          </motion.div>
          <h1 className="text-4xl font-bold"><span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">NutriCoach</span></h1>
          <p className="text-gray-400 mt-2">Il tuo assistente nutrizionale personale</p>
        </div>

        <Card className="glass-dark border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">{resetMode ? 'Reset Password' : 'Benvenuto'}</CardTitle>
            <CardDescription className="text-gray-400">{resetMode ? 'Inserisci la tua email per ricevere il link di reset' : 'Inizia il tuo percorso verso uno stile di vita più sano'}</CardDescription>
          </CardHeader>
          <CardContent>
            {resetMode ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="reset-email" name="email" type="email" placeholder="nome@esempio.com" className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" required />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setResetMode(false)} className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800/50"><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-black">Invia link</Button>
                </div>
              </form>
            ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black">Accedi</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black">Registrati</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="nome@esempio.com"
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setResetMode(true)} className="w-full text-gray-400 hover:text-white"><KeyRound className="h-4 w-4 mr-2" />Password dimenticata?</Button>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-green-400 to-blue-400 text-black" disabled={loading}>
                    {loading ? 'Accesso in corso...' : 'Accedi'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="nome@esempio.com"
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-gray-300">Ripeti Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-confirm"
                        name="confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-green-400 to-blue-400 text-black" disabled={loading}>
                    {loading ? 'Registrazione in corso...' : 'Registrati'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>)}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

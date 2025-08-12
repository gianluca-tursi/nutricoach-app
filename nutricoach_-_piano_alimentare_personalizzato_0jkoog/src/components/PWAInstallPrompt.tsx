import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimationOptimizer } from '@/lib/animationOptimizer';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);
  const { getFramerMotionConfig, shouldReduceAnimations } = useAnimationOptimizer();

  useEffect(() => {
    // Controlla se l'utente ha già visto il prompt
    const checkHasSeenPrompt = () => {
      const seen = localStorage.getItem('pwa-prompt-seen');
      setHasSeenPrompt(!!seen);
    };

    // Rileva il tipo di dispositivo
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setDeviceType('ios');
      } else if (/android/.test(userAgent)) {
        setDeviceType('android');
      } else if (/windows|mac|linux/.test(userAgent)) {
        setDeviceType('desktop');
      } else {
        setDeviceType('unknown');
      }
    };

    // Controlla se l'app è già installata
    const checkIfInstalled = () => {
      // Per iOS
      if (deviceType === 'ios') {
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
        setIsInstalled(isInStandaloneMode);
      }
      // Per Android/Desktop
      else if (deviceType === 'android' || deviceType === 'desktop') {
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
        setIsInstalled(isInStandaloneMode);
      }
    };

    checkHasSeenPrompt();
    detectDevice();
    checkIfInstalled();

    // Gestisce l'evento beforeinstallprompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostra il prompt solo se non è già installata e non è già stato visto
      if (!isInstalled && !hasSeenPrompt) {
        setShowPrompt(true);
      }
    };

    // Gestisce l'evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // Aggiungi event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostra il prompt per iOS dopo un delay (non c'è beforeinstallprompt su iOS)
    if (deviceType === 'ios' && !isInstalled && !hasSeenPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Mostra dopo 3 secondi

      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deviceType, isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
        // Marca come visto anche se installato
        localStorage.setItem('pwa-prompt-seen', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          title: 'Aggiungi NutriCoach alla Home',
          steps: [
            'Tocca l\'icona Condividi (□↑)',
            'Scorri e tocca "Aggiungi alla Home"',
            'Tocca "Aggiungi" per confermare'
          ],
          icon: Smartphone
        };
      case 'android':
        return {
          title: 'Installa NutriCoach',
          steps: [
            'Tocca "Installa" qui sotto',
            'Conferma l\'installazione',
            'L\'app apparirà nella home'
          ],
          icon: Smartphone
        };
      case 'desktop':
        return {
          title: 'Installa NutriCoach',
          steps: [
            'Tocca "Installa" qui sotto',
            'Conferma l\'installazione',
            'L\'app apparirà nel menu Start'
          ],
          icon: Monitor
        };
      default:
        return {
          title: 'Installa NutriCoach',
          steps: [
            'Usa il menu del browser',
            'Cerca "Installa app" o "Aggiungi alla home"',
            'Segui le istruzioni del browser'
          ],
          icon: Download
        };
    }
  };

  const instructions = getInstallInstructions();
  const IconComponent = instructions.icon;

  if (isInstalled || !showPrompt || hasSeenPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceAnimations() ? { opacity: 0 } : { opacity: 0, y: 100 }}
        animate={shouldReduceAnimations() ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={shouldReduceAnimations() ? { opacity: 0 } : { opacity: 0, y: 100 }}
        transition={getFramerMotionConfig()}
        className="fixed bottom-4 left-4 right-4 z-50 gpu-accelerated"
      >
        <div className="glass-dark border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <IconComponent className="h-6 w-6 text-green-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-2">
                {instructions.title}
              </h3>
              
              <div className="space-y-1 mb-3">
                {instructions.steps.map((step, index) => (
                  <p key={index} className="text-xs text-gray-300">
                    {index + 1}. {step}
                  </p>
                ))}
              </div>

              {deviceType === 'android' || deviceType === 'desktop' ? (
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-gradient-to-r from-green-400 to-blue-400 text-black text-xs font-medium"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Installa App
                </Button>
              ) : (
                <p className="text-xs text-gray-400">
                  Usa le istruzioni sopra per aggiungere l'app
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setShowPrompt(false);
                // Marca come visto quando l'utente chiude il prompt
                localStorage.setItem('pwa-prompt-seen', 'true');
              }}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

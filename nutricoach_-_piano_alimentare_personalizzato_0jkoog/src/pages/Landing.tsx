import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Apple, 
  Brain, 
  Dumbbell, 
  Wallet, 
  Sparkles, 
  Star, 
  Users, 
  Zap, 
  Target, 
  TrendingUp,
  Heart,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Play,
  Download,
  Globe,
  Lock,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const apps = [
  {
    id: 'nutrition',
    name: 'Nutrition Coach',
    tagline: 'Il tuo personal trainer nutrizionale',
    description: 'Analizza foto del cibo, traccia i tuoi pasti e raggiungi i tuoi obiettivi di salute con l\'AI.',
    icon: Apple,
    gradient: 'from-green-400 to-emerald-600',
    features: ['Analisi foto con AI', 'Tracciamento pasti', 'Obiettivi personalizzati', 'Dashboard intelligente'],
    status: 'Disponibile ora',
    color: 'green'
  },
  {
    id: 'journal',
    name: 'Life Journal Coach',
    tagline: 'Il tuo confidente digitale',
    description: 'Parla delle tue giornate e ricevi consigli personalizzati per migliorare il tuo benessere mentale.',
    icon: Brain,
    gradient: 'from-purple-400 to-pink-600',
    features: ['Diario vocale', 'Analisi sentimenti', 'Consigli personalizzati', 'Tracciamento umore'],
    status: 'Prossimamente',
    color: 'purple'
  },
  {
    id: 'workout',
    name: 'Workout Coach',
    tagline: 'Il tuo trainer personale',
    description: 'Registra allenamenti, monitora progressi e ricevi programmi di allenamento su misura.',
    icon: Dumbbell,
    gradient: 'from-orange-400 to-red-600',
    features: ['Tracciamento allenamenti', 'Programmi personalizzati', 'Monitoraggio progressi', 'Video guide'],
    status: 'Prossimamente',
    color: 'orange'
  },
  {
    id: 'financial',
    name: 'Financial Coach',
    tagline: 'Il tuo consulente finanziario',
    description: 'Gestisci spese, risparmi e investimenti con consigli intelligenti per la tua salute finanziaria.',
    icon: Wallet,
    gradient: 'from-blue-400 to-indigo-600',
    features: ['Tracciamento spese', 'Budget intelligente', 'Consigli risparmio', 'Analisi investimenti'],
    status: 'Prossimamente',
    color: 'blue'
  }
];

const testimonials = [
  {
    name: 'Marco Rossi',
    role: 'Imprenditore',
    content: 'Nutrition Coach ha rivoluzionato il mio rapporto con il cibo. L\'analisi foto è incredibile!',
    rating: 5
  },
  {
    name: 'Laura Bianchi',
    role: 'Fitness Enthusiast',
    content: 'Finalmente un\'app che capisce davvero le mie esigenze nutrizionali. Consigliatissima!',
    rating: 5
  },
  {
    name: 'Giuseppe Verdi',
    role: 'Personal Trainer',
    content: 'Uso Nutrition Coach con i miei clienti. È uno strumento professionale e intuitivo.',
    rating: 5
  }
];

const stats = [
  { number: '10K+', label: 'Utenti attivi', icon: Users },
  { number: '50K+', label: 'Foto analizzate', icon: Apple },
  { number: '4.9', label: 'Rating medio', icon: Star },
  { number: '95%', label: 'Soddisfazione', icon: Heart }
];

export function Landing() {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-purple-900/20 to-blue-900/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-purple-500/10 to-blue-500/10"
              style={{
                backgroundSize: '400% 400%',
              }}
            />
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-green-400 to-blue-400 text-black px-4 py-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 mr-2" />
              Il tuo coltellino svizzero digitale
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Trasforma la tua vita
              </span>
              <br />
              <span className="text-white">con le nostre app</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Una suite completa di app intelligenti per gestire ogni aspetto della tua vita quotidiana. 
              Dalla nutrizione alla finanza, dal fitness al benessere mentale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90 text-lg px-8 py-6">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Download className="h-5 w-5 mr-2" />
                  {user ? "Vai alla Dashboard" : "Inizia Gratis"}
                </Link>
              </Button>
              <Button size="lg" className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg px-8 py-6 transition-all duration-300">
                <Play className="h-5 w-5 mr-2" />
                Guarda Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Apps Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Le nostre <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">app intelligenti</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ogni app è progettata per essere il tuo compagno digitale perfetto, 
              utilizzando l'intelligenza artificiale per offrirti esperienze personalizzate.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${app.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <app.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">{app.name}</CardTitle>
                    <CardDescription className="text-gray-400">{app.tagline}</CardDescription>
                    <Badge 
                      variant={app.status === 'Disponibile ora' ? 'default' : 'secondary'}
                      className={`mt-2 ${
                        app.status === 'Disponibile ora' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {app.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-sm">{app.description}</p>
                    <ul className="space-y-2">
                      {app.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-400">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                                         {app.status === 'Disponibile ora' && (
                       <Button asChild className="w-full mt-4 bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90">
                         <Link to={user ? "/dashboard" : "/auth"}>
                           {user ? "Vai alla Dashboard" : "Prova Ora"}
                           <ArrowRight className="h-4 w-4 ml-2" />
                         </Link>
                       </Button>
                     )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Numeri che <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">parlano</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-black" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Cosa dicono i <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">nostri utenti</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-900/50 border-gray-800 h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Perché scegliere le <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">nostre app</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Intelligenza Artificiale',
                description: 'Algoritmi avanzati che imparano dalle tue abitudini per offrirti consigli sempre più personalizzati.'
              },
              {
                icon: Shield,
                title: 'Privacy Garantita',
                description: 'I tuoi dati sono al sicuro con noi. Crittografia end-to-end e conformità GDPR.'
              },
              {
                icon: Smartphone,
                title: 'Design Intuitivo',
                description: 'Interfacce moderne e facili da usare, progettate per offrire la migliore esperienza utente.'
              },
              {
                icon: Globe,
                title: 'Sincronizzazione Cloud',
                description: 'Accedi ai tuoi dati da qualsiasi dispositivo, sempre aggiornati e sincronizzati.'
              },
              {
                icon: Clock,
                title: 'Sempre Disponibile',
                description: 'Le nostre app sono sempre attive, pronte ad aiutarti quando ne hai bisogno.'
              },
              {
                icon: Target,
                title: 'Obiettivi Personalizzati',
                description: 'Imposta i tuoi obiettivi e monitora i progressi con metriche dettagliate e insights.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto a <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">trasformare</span> la tua vita?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Inizia oggi stesso con Nutrition Coach e scopri il potere dell'intelligenza artificiale 
              applicata al tuo benessere quotidiano.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                             <Button asChild size="lg" className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90 text-lg px-8 py-6">
                 <Link to={user ? "/dashboard" : "/auth"}>
                   <Download className="h-5 w-5 mr-2" />
                   {user ? "Vai alla Dashboard" : "Inizia Gratis Ora"}
                 </Link>
               </Button>
              <Button size="lg" className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg px-8 py-6 transition-all duration-300">
                <Play className="h-5 w-5 mr-2" />
                Scopri di Più
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-green-400 mr-2" />
            <span className="text-2xl font-bold">Digital Swiss Army Knife</span>
          </div>
          <p className="text-gray-400 mb-6">
            Il tuo coltellino svizzero digitale per una vita più sana, produttiva e felice.
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Termini</a>
            <a href="#" className="hover:text-white transition-colors">Supporto</a>
            <a href="#" className="hover:text-white transition-colors">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 
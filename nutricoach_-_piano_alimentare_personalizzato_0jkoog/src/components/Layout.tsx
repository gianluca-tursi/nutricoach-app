import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera, TrendingUp, User, LogOut, Sparkles, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { useAnimationOptimizer } from '@/lib/animationOptimizer';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getFramerMotionConfig, shouldReduceAnimations } = useAnimationOptimizer();

  const handleSignOut = async () => {
    await signOut();
    // Il logout ora naviga automaticamente a /auth
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home', color: 'from-purple-500 to-pink-500' },
    { path: '/meals', icon: Camera, label: 'Traccia', color: 'from-green-500 to-teal-500' },
    { path: '/history', icon: CalendarDays, label: 'Archivio', color: 'from-indigo-500 to-blue-500' },
    { path: '/progress', icon: TrendingUp, label: 'Progressi', color: 'from-blue-500 to-cyan-500' },
    { path: '/profile', icon: User, label: 'Profilo', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 mesh-gradient opacity-50" />
      <div className="fixed inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[128px] opacity-30 animate-morph" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] opacity-30 animate-morph animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500 rounded-full filter blur-[128px] opacity-20 animate-morph animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-50 glass-dark border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative transform-gpu will-change-transform"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="h-8 w-8 text-white relative z-10" />
              </motion.div>
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  NutriCoach
                </span>
              </h1>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hover:bg-red-500/20 text-white"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8 pb-32">
        <Outlet />
      </main>

      {/* Floating action button */}
      <motion.button
        whileHover={shouldReduceAnimations() ? {} : { scale: 1.1 }}
        whileTap={shouldReduceAnimations() ? {} : { scale: 0.95 }}
        transition={getFramerMotionConfig()}
        onClick={() => navigate('/meals')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-lg flex items-center justify-center z-50 motion-safe:animate-pulse-glow gpu-accelerated"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 group"
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl opacity-20 transform-gpu will-change-transform`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    whileHover={shouldReduceAnimations() ? {} : { scale: 1.1 }}
                    whileTap={shouldReduceAnimations() ? {} : { scale: 0.95 }}
                    transition={getFramerMotionConfig()}
                    className="relative gpu-accelerated"
                  >
                    <item.icon
                      className={`h-6 w-6 relative z-10 transition-all duration-300 ${
                        isActive
                          ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                          : 'text-gray-400 group-hover:text-white'
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`text-xs mt-1 transition-all duration-300 ${
                      isActive
                        ? 'text-white font-medium'
                        : 'text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

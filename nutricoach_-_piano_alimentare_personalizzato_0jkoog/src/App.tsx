import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { OptimizedPageTransition } from '@/components/OptimizedPageTransition';

// Lazy loading delle pagine con correzione per named exports
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MealTracker = lazy(() => import('@/pages/MealTracker').then(module => ({ default: module.MealTracker })));
const Progress = lazy(() => import('@/pages/Progress').then(module => ({ default: module.Progress })).catch(() => ({ default: () => <div>Caricamento Progress...</div> })));
const MealHistory = lazy(() => import('@/pages/MealHistory').then(module => ({ default: module.MealHistory })));
const Profile = lazy(() => import('@/pages/Profile').then(module => ({ default: module.Profile })));
const Auth = lazy(() => import('@/pages/Auth').then(module => ({ default: module.Auth })));
const Onboarding = lazy(() => import('@/pages/Onboarding').then(module => ({ default: module.Onboarding })));
const Setup = lazy(() => import('@/pages/Setup').then(module => ({ default: module.Setup })));
const Landing = lazy(() => import('@/pages/Landing').then(module => ({ default: module.Landing })));

// Loading component memoizzato
const LoadingScreen = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-white text-lg">Caricamento...</p>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

// Profile loading component memoizzato
const ProfileLoadingScreen = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-white text-lg">Caricamento profilo...</p>
    </div>
  </div>
));

ProfileLoadingScreen.displayName = 'ProfileLoadingScreen';

// Page loading component
const PageLoading = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
      <p className="text-white text-sm">Caricamento pagina...</p>
    </div>
  </div>
));

PageLoading.displayName = 'PageLoading';

function App() {
  // Hooks in ordine corretto
  const { user, loading: authLoading, initAuthListener } = useAuthStore();
  const { profile, loading: profileLoading, fetchProfile } = useProfileStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileRequested, setProfileRequested] = useState(false);

  // Memoizza l'inizializzazione per evitare chiamate multiple
  const initializeApp = useCallback(() => {
    if (isSupabaseConfigured) {
      initAuthListener();
      // Diamo tempo agli store di inizializzarsi
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsInitialized(true);
    }
  }, [initAuthListener]);



  // Memoizza le condizioni di loading
  const showLoading = useMemo(() => authLoading || !isInitialized, [authLoading, isInitialized]);

  // Memoizza le rotte protette
  const protectedRoutes = useMemo(() => {
    if (!user) return null;
    
    console.log('Protected routes evaluation:', {
      user: !!user,
      profile: !!profile,
      profileLoading,
      profileReady,
      shouldRedirectToOnboarding: !profile && !profileLoading,
      shouldShowLoading: profileLoading
    });
    
    return (
      <>
        {/* Se l'utente non ha un profilo E non sta caricando, vai all'onboarding */}
        {!profile && !profileLoading && profileReady ? (
          <Route path="*" element={<Navigate to="/onboarding" />} />
        ) : profileLoading || !profileReady ? (
          <Route path="*" element={
            (() => {
              console.log('Showing ProfileLoadingScreen because:', { profileLoading, profileReady });
              return <ProfileLoadingScreen />;
            })()
          } />
        ) : (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={
              <Suspense fallback={<PageLoading />}>
                <OptimizedPageTransition>
                  <Dashboard />
                </OptimizedPageTransition>
              </Suspense>
            } />
            <Route path="/meals" element={
              <Suspense fallback={<PageLoading />}>
                <OptimizedPageTransition>
                  <MealTracker />
                </OptimizedPageTransition>
              </Suspense>
            } />
            <Route path="/progress" element={
              <Suspense fallback={<PageLoading />}>
                <OptimizedPageTransition>
                  <Progress />
                </OptimizedPageTransition>
              </Suspense>
            } />
            <Route path="/history" element={
              <Suspense fallback={<PageLoading />}>
                <OptimizedPageTransition>
                  <MealHistory />
                </OptimizedPageTransition>
              </Suspense>
            } />
            <Route path="/profile" element={
              <Suspense fallback={<PageLoading />}>
                <OptimizedPageTransition>
                  <Profile />
                </OptimizedPageTransition>
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}
      </>
    );
  }, [user, profile, profileLoading, profileReady]);

  // Memoizza le rotte pubbliche
  const publicRoutes = useMemo(() => (
    <>
      <Route path="/" element={
        <Suspense fallback={<PageLoading />}>
          <Landing />
        </Suspense>
      } />
      <Route path="/auth" element={
        !user ? (
          <Suspense fallback={<PageLoading />}>
            <Auth />
          </Suspense>
        ) : (
          <Navigate to="/dashboard" />
        )
      } />
      <Route path="/onboarding" element={
        user ? (
          <Suspense fallback={<PageLoading />}>
            <Onboarding />
          </Suspense>
        ) : (
          <Navigate to="/auth" />
        )
      } />
    </>
  ), [user]);

  // Effects
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Timeout di sicurezza per evitare loading infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('App initialization timeout, forcing initialization');
        setIsInitialized(true);
      }
      if (user && !profileReady) {
        console.warn('Profile loading timeout, forcing ready state');
        setProfileReady(true);
      }
    }, 10000); // 10 secondi

    return () => clearTimeout(timeout);
  }, [isInitialized, user, profileReady]);

  useEffect(() => {
    if (user && isSupabaseConfigured && !profileRequested && isInitialized) {
      console.log('Fetching profile for user:', user.id);
      setProfileRequested(true);
      fetchProfile(user.id);
    }
  }, [user?.id, isSupabaseConfigured, profileRequested, isInitialized, fetchProfile]);

  // Reset flag quando cambia utente
  useEffect(() => {
    if (user?.id) {
      setProfileRequested(false);
      setProfileReady(false);
    }
  }, [user?.id]);

  // Quando il profilo è caricato, aspetta un momento prima di considerarlo pronto
  useEffect(() => {
    console.log('Profile ready effect:', {
      profileLoading,
      profileRequested,
      profile: !!profile,
      profileReady
    });
    
    if (!profileLoading && profile) {
      console.log('Profile loaded, setting ready in 300ms:', profile);
      const timer = setTimeout(() => {
        console.log('Setting profileReady to true');
        setProfileReady(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (profileLoading) {
      console.log('Profile loading, setting ready to false');
      setProfileReady(false);
    }
  }, [profileLoading, profile]);

  // Preload delle pagine più utilizzate quando l'utente è autenticato
  useEffect(() => {
    if (user && profile) {
      // Preload delle pagine principali
      import('@/pages/Dashboard');
      import('@/pages/MealTracker');
      import('@/pages/Progress');
    }
  }, [user, profile]);

  // Se Supabase non è configurato, mostra la pagina di setup
  if (!isSupabaseConfigured) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={
            <Suspense fallback={<PageLoading />}>
              <Setup />
            </Suspense>
          } />
        </Routes>
        <Toaster position="top-center" richColors />
      </Router>
    );
  }

  // Mostra loading mentre verifica l'autenticazione
  if (showLoading) {
    return <LoadingScreen />;
  }

  // Debug logs
  console.log('App state:', {
    authLoading,
    isInitialized,
    user: !!user,
    profile: !!profile,
    profileLoading,
    profileReady,
    showLoading,
    userEmail: user?.email,
    profileId: profile?.id
  });



  return (
    <Router>
      <Routes>
        {/* Rotte pubbliche */}
        {publicRoutes}

        {/* Rotte protette */}
        {protectedRoutes}
      </Routes>
      <Toaster position="top-center" richColors />
    </Router>
  );
}

export default memo(App);

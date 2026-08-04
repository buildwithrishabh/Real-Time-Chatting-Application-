import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ChatPage } from './pages/chat/ChatPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { authApi } from './api/auth.api';
import { useAuthStore } from './store/auth.store';
import { connectSocket } from './socket/client';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { IncomingCallModal } from './components/call/IncomingCallModal';
import { ActiveCallModal } from './components/call/ActiveCallModal';

export function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await authApi.refresh();
        setAuth(data.accessToken, data.user, data.isProfileComplete);
        connectSocket();
      } catch {
        // Unauthenticated session - proceed as guest
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [setAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />

          {/* Guest Auth Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          {/* Protected Chat App Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <IncomingCallModal />
      <ActiveCallModal />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

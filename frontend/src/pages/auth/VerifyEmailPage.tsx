import { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { authApi } from '../../api/auth.api';

export function VerifyEmailPage() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing verification token.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Verification failed or token expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Mesh Blur Orbs */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-violet-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none animate-pulse-slow" />
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none animate-pulse-slow" />

      <div className="bg-[#09090B] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 max-w-md w-full p-8 text-center z-10 animate-scale-in">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="font-extrabold text-xl gradient-text">ChitChat</span>
        </Link>

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#5D5FEF]/10 border border-[#5D5FEF]/30 flex items-center justify-center text-[#5D5FEF]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Verifying your email...</h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Please wait while we confirm your email address.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Email Verified! 🎉</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs font-medium">
                Your email has been successfully verified. You can now log in to access all features.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full mt-2 py-3 px-4 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5D5FEF]/25 active:scale-[0.99] transition-all duration-200"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Verification Failed</h3>
              <p className="text-xs text-rose-400 mt-1 font-medium">{errorMessage}</p>
            </div>
            <Link
              to="/login"
              className="w-full mt-2 py-3 px-4 bg-[#111114] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm rounded-2xl transition-all"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

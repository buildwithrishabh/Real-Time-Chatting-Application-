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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center animate-scale-in">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ChitChat</span>
        </div>

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifying your email...</h3>
            <p className="text-xs text-slate-500">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Email Verified!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <Link
              to="/login"
              className="px-6 py-2.5 gradient-btn text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <XCircle className="w-12 h-12 text-rose-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verification Failed</h3>
            <p className="text-xs text-rose-500 dark:text-rose-400 mb-4">{errorMessage}</p>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

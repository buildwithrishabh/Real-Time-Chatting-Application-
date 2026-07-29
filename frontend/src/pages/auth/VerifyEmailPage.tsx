import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { authApi } from '../../api/auth.api';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">ChitChat</span>
        </div>

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verifying your email address...
            </h3>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your email address has been confirmed. You can now access all features of ChitChat.
            </p>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
            >
              Continue to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <XCircle className="w-14 h-14 text-red-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Verification Failed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              The verification link is invalid or has expired.
            </p>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-6">
        <MessageSquare className="w-8 h-8 fill-current" />
      </div>
      <h1 className="text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Chat
      </Link>
    </div>
  );
}

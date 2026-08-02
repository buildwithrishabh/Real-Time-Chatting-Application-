import { useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword(token, newPassword);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Mesh Blur Orbs */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-violet-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none animate-pulse-slow" />
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none animate-pulse-slow" />

      <div className="bg-[#09090B] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden z-10 animate-scale-in">
        {/* Left Hero Column */}
        <div className="hidden md:flex bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-cyan-500/10 p-8 sm:p-12 flex-col justify-between items-center text-center border-r border-white/10">
          <Link to="/" className="flex items-center gap-2.5 self-start">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-xl gradient-text">ChitChat</span>
          </Link>

          <div className="my-8 flex flex-col items-center">
            <div className="w-48 h-48 bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 rounded-full flex items-center justify-center relative mb-6 shadow-inner border border-white/10 animate-float">
              <ShieldCheck className="w-20 h-20 text-[#5D5FEF] stroke-[1.5]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Secure Reset
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-medium">
              Choose a strong, unique password to keep your ChitChat account safe.
            </p>
          </div>

          <div className="text-xs text-zinc-500 font-medium">© 2026 ChitChat Inc.</div>
        </div>

        {/* Right Form Column */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          {/* Mobile Header Brand Logo */}
          <Link to="/" className="flex md:hidden items-center gap-2 mb-4 self-center">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-lg gradient-text">ChitChat</span>
          </Link>

          <div className="mb-5 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Set New Password 🔐
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Please enter and confirm your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5D5FEF]/25 active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#5D5FEF]" /> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

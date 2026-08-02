import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { loginSchema } from '../../lib/validators';
import type { LoginFormData } from '../../lib/validators';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/utils';
import { toast } from 'sonner';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Welcome back to ChitChat!');
      navigate('/chat');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Mesh Blur Orbs */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-violet-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none animate-pulse-slow" />
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none animate-pulse-slow" />

      <div className="bg-[#09090B] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden z-10 animate-scale-in">
        {/* Left Hero Column - Hidden on mobile for clean form-first layout */}
        <div className="hidden md:flex bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-cyan-500/10 p-8 sm:p-12 flex-col justify-between items-center text-center border-r border-white/10">
          <Link to="/" className="flex items-center gap-2.5 self-start">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-xl gradient-text">ChitChat</span>
          </Link>

          <div className="my-8 flex flex-col items-center">
            <div className="w-52 h-52 bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 rounded-full flex items-center justify-center relative mb-6 shadow-inner border border-white/10 animate-float">
              <MessageSquare className="w-24 h-24 text-[#5D5FEF] stroke-[1.5]" />
              <span className="absolute top-6 right-6 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#09090B] animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Connect Effortlessly
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-medium">
              Experience lightning-fast real-time messaging, status updates, and rich attachments.
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
              Welcome Back! 👋
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Sign in to continue to ChitChat
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 transition-all font-medium"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end text-xs pt-0.5">
              <Link
                to="/forgot-password"
                className="font-bold text-[#5D5FEF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5D5FEF]/25 active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-5 text-xs text-zinc-400 font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-extrabold text-[#5D5FEF] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

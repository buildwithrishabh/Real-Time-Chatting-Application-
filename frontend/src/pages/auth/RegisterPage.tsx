import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { registerSchema } from '../../lib/validators';
import type { RegisterFormData } from '../../lib/validators';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/utils';
import { toast } from 'sonner';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerAuth, isRegistering } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerAuth({
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Account created! Please check your email to verify your account before logging in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Registration failed. Please check your details.'));
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
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Join the Community
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-medium">
              Start real-time conversations with friends, teams, and communities anywhere in the world.
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

          <div className="mb-4 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create an Account 🚀
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Join ChitChat and start connecting
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  {...register('username')}
                  placeholder="arjun_sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-medium"
                />
              </div>
              {errors.username && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.username.message}</p>
              )}
            </div>

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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-medium"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/25 focus:border-[#5D5FEF]/60 font-medium"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>


            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 px-4 bg-gradient-to-tr from-[#5D5FEF] to-[#3B82F6] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5D5FEF]/25 active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              {isRegistering ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center mt-4 text-xs text-zinc-400 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-extrabold text-[#5D5FEF] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

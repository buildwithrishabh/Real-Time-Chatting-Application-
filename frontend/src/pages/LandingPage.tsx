import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  Lock,
  Cloud,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors select-none overflow-x-hidden">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight gradient-text">
              ChitChat
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Features
            </Link>
            <Link to="/how-it-works" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              How it Works
            </Link>
            <Link to="/about-us" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              About Us
            </Link>
          </nav>

          {/* Desktop Header Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/chat')}
                className="px-6 py-2.5 gradient-btn text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                Open App
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 gradient-btn text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Header Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex flex-col gap-3 text-sm font-semibold animate-scale-in shadow-xl">
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-slate-700 dark:text-slate-200 hover:text-violet-600"
          >
            Features
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-slate-700 dark:text-slate-200 hover:text-violet-600"
          >
            How it Works
          </Link>
          <Link
            to="/about-us"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-slate-700 dark:text-slate-200 hover:text-violet-600"
          >
            About Us
          </Link>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="w-full py-2.5 text-center gradient-btn text-white font-bold rounded-xl text-sm"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full py-2.5 text-center text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 text-center gradient-btn text-white font-bold rounded-xl text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-28 pb-12 sm:pb-20 lg:pb-28 px-6 sm:px-10 lg:px-16 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 items-center">
        {/* Ambient Radial Background Glow */}
        <div className="absolute w-[350px] sm:w-[650px] h-[350px] sm:h-[650px] bg-violet-600/15 dark:bg-violet-600/20 rounded-full blur-3xl -top-10 left-1/4 pointer-events-none animate-pulse-slow" />
        <div className="absolute w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-cyan-500/15 dark:bg-cyan-500/20 rounded-full blur-3xl bottom-0 right-10 pointer-events-none animate-pulse-slow" />

        {/* Hero Text Column */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-5 sm:space-y-7 z-10">
          <h1 className="text-[40px] sm:text-6xl lg:text-7xl xl:text-[80px] font-black tracking-tight leading-[1.06] text-slate-900 dark:text-white">
            Connect & Chat. <br />
            <span className="gradient-text">Stay Close.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-medium">
            ChitChat is an ultra-fast real-time messaging platform. Powered by Socket.io, Redis Pub/Sub, and in-memory JWT security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 w-full sm:w-auto pt-1">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 gradient-btn text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl shadow-violet-600/30 hover-lift"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>

            <Link
              to="/features"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center shadow-xs hover-lift"
            >
              Explore Features
            </Link>
          </div>

          {/* Sleek Horizontal Trust Badges Bar */}
          <div className="flex items-center justify-center sm:justify-start flex-wrap gap-x-4 gap-y-2.5 pt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <span>In-Memory JWT</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <Zap className="w-4 h-4 text-cyan-600" />
              <span>Sub-Second Latency</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Group Channels</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Mockup Column */}
        <div className="relative flex items-center justify-center z-10 w-full mt-4 lg:mt-0">
          {/* Floating Pill 1 (Desktop) */}
          <div className="hidden sm:flex absolute -top-6 -left-4 lg:-left-10 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-2xl items-center gap-3 animate-float">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Sub-second Latency</p>
              <p className="text-[10px] text-slate-500 font-medium">Socket.io real-time engine</p>
            </div>
          </div>

          {/* Floating Pill 2 (Desktop) */}
          <div className="hidden sm:flex absolute -bottom-6 -right-4 lg:-right-10 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-2xl items-center gap-3 animate-float-slow">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-600 flex items-center justify-center font-bold text-sm">
              🔒
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">In-Memory Tokens</p>
              <p className="text-[10px] text-slate-500 font-medium">XSS protected architecture</p>
            </div>
          </div>

          {/* Compact Phone Preview Card */}
          <div className="w-full max-w-md lg:max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-200/60 dark:shadow-none space-y-4 hover-lift">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-violet-600 fill-current" />
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg">ChitChat Live</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-bold">Online</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                    alt=""
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-violet-500/30"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Priya Verma</span>
                    <span className="text-[11px] text-violet-600 font-bold">Just now</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                    Hey! Did you check the new update?
                  </p>
                </div>
                <span className="w-5 h-5 rounded-full gradient-btn text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  2
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                  alt=""
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Rohan Mehta</span>
                    <span className="text-[11px] text-slate-400">9:15 AM</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Let's catch up later today</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-md">
                  CG
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">College Group</span>
                    <span className="text-[11px] text-slate-400">Yesterday</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Sneha: Project files attached</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Showcase Section */}
      <section id="features" className="py-12 sm:py-20 px-6 sm:px-10 lg:px-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Speed & Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Everything you need for seamless real-time messaging, built on high-performance cloud infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-sm hover-lift">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">Sub-Second Delivery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Powered by Socket.io and Redis Pub/Sub adapter to ensure instant real-time message delivery across instances.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-sm hover-lift">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">In-Memory Security</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                JWT access tokens reside purely in application memory with silent cookie rotation, protecting against XSS and token leaks.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-sm hover-lift">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">Direct Signed Uploads</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Fast browser-to-Cloudinary media attachments for images, video, and files with background virus scanning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <MessageSquare className="w-4 h-4 text-violet-600 fill-current" /> ChitChat
          </div>
          <div>© 2026 ChitChat Inc. All rights reserved.</div>
          <div className="flex gap-6 font-medium">
            <Link to="/features" className="hover:underline">Features</Link>
            <Link to="/how-it-works" className="hover:underline">How it Works</Link>
            <Link to="/about-us" className="hover:underline">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

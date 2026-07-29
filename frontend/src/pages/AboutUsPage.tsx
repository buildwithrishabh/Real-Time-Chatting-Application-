import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Globe,
  Shield,
  Zap,
  Code2,
  Heart,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

export function AboutUsPage() {
  const { darkMode, toggleDarkMode } = useUIStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const values = [
    {
      icon: Zap,
      title: 'Speed First',
      description: 'We optimize every millisecond from WebSocket message dispatch to Redis Pub/Sub broadcast.',
    },
    {
      icon: Shield,
      title: 'Uncompromising Security',
      description: 'Your access tokens never touch persistent browser storage. Security is built into every layer.',
    },
    {
      icon: Heart,
      title: 'Design Excellence',
      description: 'Interfaces should feel alive, intuitive, and delightful with rich animations and theme controls.',
    },
    {
      icon: Code2,
      title: 'Modern Architecture',
      description: 'Built with React 18, TypeScript, Node.js Express v5, MongoDB, Redis, and Socket.io.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors select-none">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <MessageSquare className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight gradient-text">
            ChitChat
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link to="/features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Features
          </Link>
          <Link to="/how-it-works" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            How it Works
          </Link>
          <Link to="/about-us" className="text-violet-600 dark:text-violet-400 font-bold">
            About Us
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/chat"
              className="px-6 py-2.5 gradient-btn text-white text-sm font-semibold rounded-xl"
            >
              Open App
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2.5 gradient-btn text-white text-sm font-semibold rounded-xl"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-6 py-6 flex flex-col gap-4 text-sm font-semibold animate-scale-in">
          <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">
            Features
          </Link>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">
            How it Works
          </Link>
          <Link to="/about-us" onClick={() => setMobileMenuOpen(false)} className="py-2 text-violet-600 font-bold">
            About Us
          </Link>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link to="/chat" className="w-full py-3 text-center gradient-btn text-white font-bold rounded-xl">
                Open App
              </Link>
            ) : (
              <Link to="/login" className="w-full py-3 text-center gradient-btn text-white font-bold rounded-xl">
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            About ChitChat
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            ChitChat was created with a single vision: to build a high-performance, beautiful, and secure real-time messaging application that connects people instantly without sacrificing privacy.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{v.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {v.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Global Connection Section */}
        <div className="mt-20 p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Built for Global Scalability
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
            With Redis pub/sub message routing, BullMQ background queues, and Cloudinary direct uploads, ChitChat handles high concurrency effortlessly.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <MessageSquare className="w-4 h-4 text-violet-600 fill-current" /> ChitChat
        </div>
        <div>© 2026 ChitChat Inc. All rights reserved.</div>
      </footer>
    </div>
  );
}

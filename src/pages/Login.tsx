import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { BrandMark } from '../components/common/Brand';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to login';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in with Google';
      setFormError(msg);
      toast.error(msg);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-6">
            <BrandMark className="w-16 h-16" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to Vestiga</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Sign in to your secure vault</p>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 ${formError ? 'animate-shake' : ''}`}>
          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Input
              type="password"
              label="Account Password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center font-medium">
                {formError}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full justify-center mt-2 group"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-500">
              New to Vestiga?{' '}
              <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-bold hover:underline transition-all">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 flex flex-col items-center justify-center gap-1 text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-teal-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700/80">End-to-End Encrypted</span>
          </div>
          <span className="text-[11px] text-gray-400">We cannot see your passwords.</span>
        </div>

        {/* Legal Links */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-gray-400">
          <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
        </div>
      </motion.div>
    </div>
  );
}

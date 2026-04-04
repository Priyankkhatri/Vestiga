import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to create account';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
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
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-6">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your Vault</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Initialize your secure cloud perimeter</p>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 ${formError ? 'animate-shake' : ''}`}>
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
              label="Master Password"
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
                <>Sign Up <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-bold hover:underline transition-all">
                Sign In
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
      </motion.div>
    </div>
  );
}

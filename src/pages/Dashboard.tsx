import { useMemo } from 'react';
import { useVault } from '../context/VaultContext';
import { getCategoryIcon } from '../components/vault/VaultHelpers';
import { Badge } from '../components/ui/Badge';
import { PasswordItem } from '../types/vault';
import React from 'react';
import { X, ArrowRight, ShieldCheck, Activity, FolderLock, ShieldAlert, KeyRound, Clock, AlertTriangle } from 'lucide-react';
import { calculatePasswordStrength, findReusedPasswordsSync, calculateSecurityScore } from '../utils/securityUtils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { items } = useVault();
  const { tier, itemCount, refreshProfile, session } = useAuth();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = React.useState(true);

  const handleUpgrade = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://vestiga-api.onrender.com/api';
      const response = await fetch(`${baseUrl}/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();

      const options = {
        key: result.data.keyId,
        subscription_id: result.data.subscriptionId,
        name: 'Vestiga Pro',
        description: 'Monthly Subscription',
        handler: async function (response: any) {
          await refreshProfile();
          alert('Welcome to Vestiga Pro! Your account has been upgraded.');
        },
        theme: { color: '#0d9488' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('[Dashboard] Upgrade error:', err);
      alert('Failed to start checkout. Please try again.');
    }
  };

  const passwords = useMemo(() => items.filter((i): i is PasswordItem => i.type === 'password'), [items]);
  
  const weakPasswords = useMemo(() => passwords.filter(i => calculatePasswordStrength(i.password) <= 1), [passwords]);
  const weakCount = weakPasswords.length;

  const reusedGroups = useMemo(() => findReusedPasswordsSync(items), [items]);
  const reusedCount = useMemo(() => reusedGroups.reduce((acc, g) => acc + g.items.length, 0), [reusedGroups]);

  const healthScore = useMemo(() => calculateSecurityScore(items, reusedGroups), [items, reusedGroups]);

  const atRiskPasswords = useMemo(() => [...weakPasswords].slice(0, 5), [weakPasswords]);
  const recentItems = useMemo(() => 
    [...items]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6), 
    [items]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Your vault health and security status</p>
        </div>
        {tier === 'pro' && (
          <Badge variant="teal" className="flex items-center gap-1.5 py-1 px-3">
            <ShieldCheck size={12} />
            PRO ACTIVE
          </Badge>
        )}
      </div>

      {/* Pro Upgrade Banner */}
      {tier === 'free' && showBanner && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mb-8 relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-900/10 group"
        >
          {/* Close Button */}
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 z-20 p-1.5 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Upgrade to Vestiga Pro</h3>
                <p className="text-teal-50/80 text-sm mt-1 max-w-md">
                  Unlock unlimited passwords, AI security scans, and advanced threat detection. 
                  Currently using <span className="font-bold text-white">{itemCount}/16</span> passwords.
                </p>
              </div>
            </div>
            <button 
              onClick={handleUpgrade}
              className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0"
            >
              Get Pro Now
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-6">
        
        {/* Metric Band */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <FolderLock size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Items</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          </div>
          
          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <ShieldAlert size={14} className={weakCount > 0 ? "text-red-500" : ""} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Weak Passwords</span>
            </div>
            <div className={`text-2xl font-bold ${weakCount > 0 ? "text-red-600" : "text-gray-900"}`}>{weakCount}</div>
          </div>
          
          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <KeyRound size={14} className={reusedCount > 0 ? "text-amber-500" : ""} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Reused Passwords</span>
            </div>
            <div className={`text-2xl font-bold ${reusedCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{reusedCount}</div>
          </div>
          
          <div className="flex-1 p-5 bg-gray-50/50 rounded-r-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Activity size={14} className="text-teal-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Vault Health</span>
              </div>
              <span className={`text-[11px] font-bold ${healthScore > 80 ? 'text-teal-600' : healthScore > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {healthScore}/100
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${healthScore > 80 ? 'bg-teal-500' : healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Security Action Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  Security Alerts
                </h3>
                {atRiskPasswords.length > 0 && (
                  <Link to="/security" className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 group">
                    View Audit
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
              
              <div className="flex-1">
                {atRiskPasswords.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {atRiskPasswords.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                          <td className="px-5 py-3">
                            <span className="text-[13px] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">{item.title}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[12px] text-gray-500">{item.username || item.website || '—'}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Badge variant="red" className="text-[10px] uppercase">{item.strength || 'Weak'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-teal-50 rounded-full border border-teal-100 flex items-center justify-center mb-3">
                      <ShieldCheck size={20} className="text-teal-600" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-900">Vault Secure</span>
                    <span className="text-[12px] text-gray-500 mt-1 max-w-[250px]">No immediate security risks found. Your credentials are strong.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={15} className="text-gray-400" />
                  Recent Activity
                </h3>
              </div>
              
              <div className="flex-1">
                {recentItems.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {recentItems.map(item => (
                      <Link key={item.id} to={`/item/${item.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                        <div className="w-7 h-7 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 shrink-0 mt-0.5 group-hover:border-teal-200 group-hover:text-teal-600 transition-colors">
                          {getCategoryIcon(item.type, 14)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">{item.title}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wide">{item.type}</span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <FolderLock size={24} className="text-gray-300 mb-2" />
                    <span className="text-[12px] font-semibold text-gray-900">Quiet Here</span>
                    <span className="text-[11px] text-gray-500 mt-1">Empty vault or no recent changes.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
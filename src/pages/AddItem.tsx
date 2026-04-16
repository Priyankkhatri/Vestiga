import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, MapPin, CreditCard, FileText, FolderLock, ArrowLeft, ArrowRight, Check, Wand2, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useVault } from '../context/VaultContext';
import { VaultCategory, VaultItem } from '../types/vault';
import { calculatePasswordStrength, getPasswordStrengthLabel, strengthScoreToLabel } from '../utils/securityUtils';
import { analyzePassword } from '../../packages/crypto/src/entropy';
import { aiPasswordAnalyze, aiCategorize } from '../services/vaultService';
import { hasQuota, invalidateQuotaCache } from '../features/ai/quotaTracker';

const itemTypes = [
  { type: 'password' as VaultCategory, icon: KeyRound, label: 'Password', desc: 'Login credentials for websites & apps' },
  { type: 'address' as VaultCategory, icon: MapPin, label: 'Address', desc: 'Physical storage for autofill data' },
  { type: 'card' as VaultCategory, icon: CreditCard, label: 'Card', desc: 'Secure credit & debit card details' },
  { type: 'note' as VaultCategory, icon: FileText, label: 'Secure Note', desc: 'Encrypted private text content' },
  { type: 'document' as VaultCategory, icon: FolderLock, label: 'Document', desc: 'AES-256 cloud file storage' },
];

function generatePassword(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map(x => chars[x % chars.length]).join('');
}

export function AddItem() {
  const { type: preselectedType } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const { addItem, addToast } = useVault();

  const [step, setStep] = useState(preselectedType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<VaultCategory | null>(
    preselectedType as VaultCategory || null
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState('');
  const [passwordInsight, setPasswordInsight] = useState<string | null>(null);
  const [localPasswordScore, setLocalPasswordScore] = useState(0);
  const [localStrengthLabel, setLocalStrengthLabel] = useState('weak');

  const updateField = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Handle AI error statuses
  const handleAIError = (status?: number) => {
    if (status === 401) addToast('AI features unavailable — check your API key in .env', 'error');
    else if (status === 429) addToast('AI quota reached — try again later', 'error');
    else addToast('AI service unavailable', 'error');
  };

  // 1. Debounced Local Strength Calculation (300ms)
  useEffect(() => {
    const password = formData.password || '';
    if (!password) {
      setLocalPasswordScore(0);
      setLocalStrengthLabel('weak');
      return;
    }

    const timer = setTimeout(() => {
      const score = calculatePasswordStrength(password);
      setLocalPasswordScore(score);
      setLocalStrengthLabel(strengthScoreToLabel(score));
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.password]);

  // 2. Debounced AI Password Analysis (500ms) + Cleanup
  useEffect(() => {
    const password = formData.password || '';
    const abortController = new AbortController();

    if (!password) {
      setPasswordInsight(null);
      return;
    }

    const score = calculatePasswordStrength(password);
    if (score > 2) {
      setPasswordInsight(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const quotaOk = await hasQuota('password_analysis');
        if (!quotaOk) return;

        const entropy = analyzePassword(password);
        const res = await aiPasswordAnalyze(entropy.score, entropy.flags, abortController.signal);
        
        if (res.success && res.data) {
          setPasswordInsight(res.data.analysis);
          invalidateQuotaCache();
        } else if (!res.success && res.error !== 'Network error') {
          handleAIError(res.status);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('AI Analysis failed:', err);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [formData.password]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (selectedType === 'password') {
      if (!formData.title) newErrors.title = 'Site name is required';
      if (!formData.username) newErrors.username = 'Username or email is required';
      if (!formData.password) newErrors.password = 'Password is required';
    } else if (selectedType === 'address') {
      if (!formData.title) newErrors.title = 'Label is required';
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
    } else if (selectedType === 'card') {
      if (!formData.cardName) newErrors.cardName = 'Financial label is required';
      if (!formData.number) newErrors.number = 'Card number is required';
    } else if (selectedType === 'note') {
      if (!formData.title) newErrors.title = 'Note title is required';
      if (!formData.content) newErrors.content = 'Content is required';
    } else if (selectedType === 'document') {
      if (!formData.fileName) newErrors.fileName = 'Document name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      addToast('Please correct the errors before saving', 'error');
      setStep(2);
      return;
    }
    setIsSaving(true);
    const now = new Date().toISOString();
    let finalTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (finalTags.length === 0 && (formData.title || formData.website)) {
      const quotaOk = await hasQuota('categorization');
      if (quotaOk) {
        const res = await aiCategorize(formData.title || formData.website || '', formData.url || '');
        if (res.success && res.data) {
          finalTags.push(res.data.category);
          invalidateQuotaCache();
        } else if (!res.success) {
          handleAIError(res.status);
        }
      }
    }

    const base = {
      id: crypto.randomUUID(),
      type: selectedType!,
      title: formData.title || formData.siteName || formData.cardName || formData.fileName || 'Untitled',
      favorite: false,
      tags: finalTags,
      folder: formData.folder || '',
      notes: formData.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    let item: VaultItem;
    try {
      switch (selectedType) {
        case 'password':
          item = { ...base, type: 'password', website: formData.website || '', url: formData.url || '', username: formData.username || '', password: formData.password || '', strength: getPasswordStrengthLabel(formData.password || '') } as any;
          break;
        case 'address':
          item = { ...base, type: 'address', fullName: formData.fullName || '', phone: formData.phone || '', addressLine1: formData.addressLine1 || '', addressLine2: formData.addressLine2, city: formData.city || '', state: formData.state || '', country: formData.country || '', zipCode: formData.zipCode || '' } as any;
          break;
        case 'card':
          item = { ...base, type: 'card', cardName: formData.cardName || '', cardholderName: formData.cardholderName || '', number: formData.number || '', expiry: formData.expiry || '', cvv: formData.cvv || '', billingAddress: formData.billingAddress } as any;
          break;
        case 'note':
          item = { ...base, type: 'note', content: formData.content || '', sensitive: true } as any;
          break;
        case 'document':
          item = { ...base, type: 'document', fileName: formData.fileName || '', fileSize: '0 KB', fileType: 'application/octet-stream', encrypted: true } as any;
          break;
        default: return;
      }
      await addItem(item);
      navigate('/vault');
    } catch (err) {
      addToast('Failed to save item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const segmentColors = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-400'];

  const renderFields = () => {
    switch (selectedType) {
      case 'password':
        return (
          <div className="space-y-4">
            <Input label="Site Name" placeholder="e.g. Google" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} error={errors.title} />
            <Input label="Website Domain" placeholder="google.com" value={formData.website || ''} onChange={e => updateField('website', e.target.value)} />
            <Input label="Login URL" placeholder="https://google.com/login" value={formData.url || ''} onChange={e => updateField('url', e.target.value)} />
            <Input label="Username / Email" placeholder="user@email.com" value={formData.username || ''} onChange={e => updateField('username', e.target.value)} error={errors.username} />
            <div className="space-y-1.5">
              <Input type="password" label="Secure Password" placeholder="••••••••••••" value={formData.password || ''} onChange={e => updateField('password', e.target.value)} error={errors.password} />
              {(formData.password || '').length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1.5 h-1.5">
                    {segmentColors.map((color, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${i < localPasswordScore ? color : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    localStrengthLabel === 'weak' ? 'text-red-500' :
                    localStrengthLabel === 'fair' ? 'text-amber-500' :
                    localStrengthLabel === 'strong' ? 'text-yellow-600' :
                    'text-green-500'
                  }`}>{localStrengthLabel}</p>
                  {passwordInsight && (
                    <div className="mt-2 p-2.5 rounded-lg bg-teal-50 border border-teal-100 flex gap-2 items-start">
                      <Wand2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-teal-800 font-medium leading-relaxed">{passwordInsight}</p>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => updateField('password', generatePassword())}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-700 uppercase tracking-widest cursor-pointer mt-2"
              >
                <Wand2 size={12} strokeWidth={2.5} /> Generate High Entropy Key
              </button>
            </div>
          </div>
        );
      case 'address':
        return (
          <div className="space-y-4">
            <Input label="Label" placeholder="e.g. Primary Residence" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} error={errors.title} />
            <Input label="Full Name" placeholder="Alex Morgan" value={formData.fullName || ''} onChange={e => updateField('fullName', e.target.value)} error={errors.fullName} />
            <Input label="Phone Number" placeholder="+1 (555) 000-0000" value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
            <Input label="Address Line 1" placeholder="742 Evergreen Terrace" value={formData.addressLine1 || ''} onChange={e => updateField('addressLine1', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" placeholder="San Francisco" value={formData.city || ''} onChange={e => updateField('city', e.target.value)} />
              <Input label="State / Province" placeholder="California" value={formData.state || ''} onChange={e => updateField('state', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Country" placeholder="United States" value={formData.country || ''} onChange={e => updateField('country', e.target.value)} />
              <Input label="ZIP / Postal Code" placeholder="94102" value={formData.zipCode || ''} onChange={e => updateField('zipCode', e.target.value)} />
            </div>
          </div>
        );
      case 'card':
        return (
          <div className="space-y-4">
            <Input label="Financial Label" placeholder="e.g. Visa Corporate" value={formData.cardName || ''} onChange={e => updateField('cardName', e.target.value)} error={errors.cardName} />
            <Input label="Cardholder Name" placeholder="ALEX MORGAN" value={formData.cardholderName || ''} onChange={e => updateField('cardholderName', e.target.value)} />
            <Input type="password" label="Card Number" placeholder="•••• •••• •••• ••••" value={formData.number || ''} onChange={e => updateField('number', e.target.value)} error={errors.number} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Expiry Date" placeholder="MM / YY" value={formData.expiry || ''} onChange={e => updateField('expiry', e.target.value)} />
              <Input type="password" label="CVV" placeholder="•••" value={formData.cvv || ''} onChange={e => updateField('cvv', e.target.value)} />
            </div>
          </div>
        );
      case 'note':
        return (
          <div className="space-y-4">
            <Input label="Note Title" placeholder="e.g. Recovery Phrases" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} error={errors.title} />
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${errors.content ? 'text-red-500' : 'text-gray-500'}`}>Secure Content</label>
              <textarea
                placeholder="Paste your sensitive content here..."
                value={formData.content || ''}
                onChange={e => updateField('content', e.target.value)}
                rows={8}
                className={`w-full bg-white border ${errors.content ? 'border-red-500 ring-4 ring-red-50' : 'border-gray-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-50'} rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 resize-none shadow-sm`}
              />
              {errors.content && <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-500" /> {errors.content}</p>}
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="space-y-4">
            <Input label="Document Name" placeholder="identity_scan.pdf" value={formData.fileName || ''} onChange={e => updateField('fileName', e.target.value)} error={errors.fileName} />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Internal Security Protocol</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors p-10 text-center cursor-pointer group shadow-sm">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                  <FolderLock size={32} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Click to securely append file</p>
                <p className="text-xs text-gray-500">All documents are AES-256 encrypted Client-side</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-6 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Create Secure Entry</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Phase {step} <span className="text-gray-300">/ 3</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map(s => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-teal-600' : 'bg-gray-200'}`} />))}
        </div>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-1">Infrastructure Selection</h3>
              <div className="space-y-3">
                {itemTypes.map(it => (
                  <button key={it.type} onClick={() => { setSelectedType(it.type); setStep(2); }} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:shadow-sm transition-all text-left group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors"><it.icon size={24} /></div>
                      <div>
                        <p className="text-base font-semibold text-gray-900 mb-0.5">{it.label}</p>
                        <p className="text-sm font-medium text-gray-500">{it.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-teal-500" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === 2 && selectedType && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              <Card variant="section"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">Identification & Attributes</h3>{renderFields()}</Card>
              <Card variant="section">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">Classification & Meta</h3>
                <div className="space-y-4">
                  <Input label="Search Keywords (Tags)" placeholder="e.g. Work, Finance, Social" value={tags} onChange={e => setTags(e.target.value)} />
                  <Input label="Directory Folder" placeholder="e.g. Master Vault" value={formData.folder || ''} onChange={e => updateField('folder', e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Additional Context</label>
                    <textarea placeholder="Enter optional metadata..." value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50 transition-all resize-none shadow-sm" />
                  </div>
                </div>
              </Card>
              <div className="flex gap-4 pt-4 mb-20"><Button variant="secondary" onClick={() => setStep(1)} className="w-1/3 justify-center"><ArrowLeft size={16} className="mr-2" /> Back</Button><Button onClick={() => validate() && setStep(3)} className="w-2/3 justify-center">Security Review <ArrowRight size={16} className="ml-2" /></Button></div>
            </motion.div>
          )}
          {step === 3 && selectedType && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
              <Card variant="section" className="relative overflow-hidden"><div className="absolute top-0 left-0 w-2 h-full bg-teal-600" /><div className="flex items-center gap-4 mb-8">
                {(() => { const typeInfo = itemTypes.find(t => t.type === selectedType)!; return (<><div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><typeInfo.icon size={24} /></div><div><p className="text-lg font-bold text-gray-900">{formData.title || formData.siteName || formData.cardName || formData.fileName || 'Untitled Entry'}</p><p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mt-1">{typeInfo.label} Object</p></div></>); })()}
              </div><div className="space-y-4">{Object.entries(formData).filter(([k, v]) => v && !['title', 'folder', 'notes'].includes(k)).map(([k, v]) => (<div key={k} className="flex justify-between py-3 border-b border-gray-100 last:border-0 group"><span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1')}</span><span className="text-sm font-semibold text-gray-900 truncate max-w-[60%] text-right font-mono">{['password', 'cvv'].includes(k.toLowerCase()) ? '••••••••••••' : v}</span></div>))}</div></Card>
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"><div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 shadow-sm"><Check size={20} /></div><div><p className="text-sm font-bold text-teal-900 mb-1">Zero-Knowledge Verification</p><p className="text-xs text-teal-700 font-medium">All sensitive attributes will be encrypted with your Master Key before being transmitted to the secure cloud directory.</p></div></div>
              <div className="flex gap-4 mb-20"><Button variant="secondary" onClick={() => setStep(2)} className="w-1/3 justify-center" disabled={isSaving}>Modify Detail</Button><Button onClick={handleSave} className="w-2/3 justify-center" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Finalize & Save'}</Button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

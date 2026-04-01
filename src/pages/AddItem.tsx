import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, MapPin, CreditCard, FileText, FolderLock, ArrowLeft, ArrowRight, Check, Wand2, ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useVault } from '../context/VaultContext';
import { VaultCategory, VaultItem } from '../types/vault';

const itemTypes = [
  { type: 'password' as VaultCategory, icon: KeyRound, label: 'Password', desc: 'Login credentials for websites & apps', color: 'text-vault-gold', bg: 'bg-vault-gold/10 border-vault-gold/20' },
  { type: 'address' as VaultCategory, icon: MapPin, label: 'Address', desc: 'Physical addresses for autofill', color: 'text-vault-info', bg: 'bg-vault-info/10 border-vault-info/20' },
  { type: 'card' as VaultCategory, icon: CreditCard, label: 'Card', desc: 'Credit & debit card details', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { type: 'note' as VaultCategory, icon: FileText, label: 'Secure Note', desc: 'Private text content', color: 'text-vault-success', bg: 'bg-vault-success/10 border-vault-success/20' },
  { type: 'document' as VaultCategory, icon: FolderLock, label: 'Document', desc: 'Encrypted file storage', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
];

function generatePassword(length = 18): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map(x => chars[x % chars.length]).join('');
}

export function AddItem() {
  const { type: preselectedType } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const { addItem } = useVault();

  const [step, setStep] = useState(preselectedType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<VaultCategory | null>(
    preselectedType as VaultCategory || null
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [tags, setTags] = useState('');

  const updateField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const now = new Date().toISOString();
    const base = {
      id: `item-${Date.now()}`,
      type: selectedType!,
      title: formData.title || formData.siteName || formData.cardName || formData.fileName || 'Untitled',
      favorite: false,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      folder: formData.folder || '',
      notes: formData.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    let item: VaultItem;
    switch (selectedType) {
      case 'password':
        item = { ...base, type: 'password', website: formData.website || '', url: formData.url || '', username: formData.username || '', password: formData.password || '', strength: getStrength(formData.password || '') } as any;
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
      default:
        return;
    }
    addItem(item);
    navigate('/vault');
  };

  const getStrength = (pw: string): 'weak' | 'fair' | 'strong' | 'excellent' => {
    if (pw.length < 6) return 'weak';
    if (pw.length < 10) return 'fair';
    if (pw.length < 14 || !/[!@#$%^&*]/.test(pw)) return 'strong';
    return 'excellent';
  };

  const renderFields = () => {
    switch (selectedType) {
      case 'password':
        return (
          <div className="space-y-4">
            <Input label="Site Name" placeholder="e.g. Google" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            <Input label="Website" placeholder="google.com" value={formData.website || ''} onChange={e => updateField('website', e.target.value)} />
            <Input label="URL" placeholder="https://accounts.google.com" value={formData.url || ''} onChange={e => updateField('url', e.target.value)} />
            <Input label="Username / Email" placeholder="user@email.com" value={formData.username || ''} onChange={e => updateField('username', e.target.value)} />
            <div>
              <Input label="Password" sensitive placeholder="Enter password" value={formData.password || ''} onChange={e => updateField('password', e.target.value)} />
              <button
                onClick={() => updateField('password', generatePassword())}
                className="mt-2 flex items-center gap-1.5 text-xs text-vault-gold hover:underline cursor-pointer"
              >
                <Wand2 size={12} /> Generate strong password
              </button>
            </div>
          </div>
        );
      case 'address':
        return (
          <div className="space-y-4">
            <Input label="Label" placeholder="e.g. Home Address" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            <Input label="Full Name" placeholder="Alex Morgan" value={formData.fullName || ''} onChange={e => updateField('fullName', e.target.value)} />
            <Input label="Phone" placeholder="+1 (555) 123-4567" value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
            <Input label="Address Line 1" placeholder="742 Evergreen Terrace" value={formData.addressLine1 || ''} onChange={e => updateField('addressLine1', e.target.value)} />
            <Input label="Address Line 2" placeholder="Apt, Suite, etc. (optional)" value={formData.addressLine2 || ''} onChange={e => updateField('addressLine2', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" placeholder="San Francisco" value={formData.city || ''} onChange={e => updateField('city', e.target.value)} />
              <Input label="State" placeholder="California" value={formData.state || ''} onChange={e => updateField('state', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Country" placeholder="United States" value={formData.country || ''} onChange={e => updateField('country', e.target.value)} />
              <Input label="ZIP Code" placeholder="94102" value={formData.zipCode || ''} onChange={e => updateField('zipCode', e.target.value)} />
            </div>
          </div>
        );
      case 'card':
        return (
          <div className="space-y-4">
            <Input label="Card Name" placeholder="e.g. Visa Platinum" value={formData.cardName || ''} onChange={e => updateField('cardName', e.target.value)} />
            <Input label="Cardholder Name" placeholder="ALEX MORGAN" value={formData.cardholderName || ''} onChange={e => updateField('cardholderName', e.target.value)} />
            <Input label="Card Number" sensitive placeholder="4532 •••• •••• 7891" value={formData.number || ''} onChange={e => updateField('number', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Expiry" placeholder="MM/YY" value={formData.expiry || ''} onChange={e => updateField('expiry', e.target.value)} />
              <Input label="CVV" sensitive placeholder="•••" value={formData.cvv || ''} onChange={e => updateField('cvv', e.target.value)} />
            </div>
            <Input label="Billing Address" placeholder="Optional" value={formData.billingAddress || ''} onChange={e => updateField('billingAddress', e.target.value)} />
          </div>
        );
      case 'note':
        return (
          <div className="space-y-4">
            <Input label="Title" placeholder="e.g. WiFi Passwords" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-vault-text-secondary uppercase tracking-wider">Content</label>
              <textarea
                placeholder="Enter your secure note..."
                value={formData.content || ''}
                onChange={e => updateField('content', e.target.value)}
                rows={6}
                className="w-full bg-vault-surface-2 border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-gold/50 resize-none transition-colors"
              />
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="space-y-4">
            <Input label="File Name" placeholder="passport_scan.pdf" value={formData.fileName || ''} onChange={e => updateField('fileName', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-vault-text-secondary uppercase tracking-wider">File Upload</label>
              <div className="border-2 border-dashed border-vault-border rounded-xl p-8 text-center hover:border-vault-gold/30 transition-colors cursor-pointer">
                <FolderLock size={32} className="text-vault-text-muted mx-auto mb-3" />
                <p className="text-sm text-vault-text-secondary mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-vault-text-muted">Files are encrypted before storage</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-vault-surface-2 text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-vault-text">Add New Item</h2>
          <p className="text-xs text-vault-text-muted">Step {step} of 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-vault-gold' : 'bg-vault-surface-3'}`} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Choose type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-vault-text-secondary uppercase tracking-wider mb-4">Choose Item Type</h3>
            {itemTypes.map(it => (
              <motion.button
                key={it.type}
                whileHover={{ x: 4 }}
                onClick={() => { setSelectedType(it.type); setStep(2); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedType === it.type
                    ? 'bg-vault-gold/5 border-vault-gold/20'
                    : 'bg-vault-surface border-vault-border hover:bg-vault-surface-2'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${it.bg} ${it.color}`}>
                  <it.icon size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-vault-text">{it.label}</p>
                  <p className="text-xs text-vault-text-muted">{it.desc}</p>
                </div>
                <ChevronRight size={16} className="text-vault-text-muted" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Fill details */}
        {step === 2 && selectedType && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {renderFields()}
            <div className="space-y-4">
              <Input label="Tags" placeholder="e.g. work, personal (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
              <Input label="Folder" placeholder="e.g. Finance" value={formData.folder || ''} onChange={e => updateField('folder', e.target.value)} />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-vault-text-secondary uppercase tracking-wider">Notes</label>
                <textarea
                  placeholder="Additional notes (optional)"
                  value={formData.notes || ''}
                  onChange={e => updateField('notes', e.target.value)}
                  rows={3}
                  className="w-full bg-vault-surface-2 border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-gold/50 resize-none transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Review <ArrowRight size={14} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Save */}
        {step === 3 && selectedType && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="vault-card p-5 space-y-3">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const typeInfo = itemTypes.find(t => t.type === selectedType)!;
                  return (
                    <>
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${typeInfo.bg} ${typeInfo.color}`}>
                        <typeInfo.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-vault-text">{formData.title || formData.siteName || formData.cardName || formData.fileName || 'Untitled'}</p>
                        <p className="text-xs text-vault-text-muted">{typeInfo.label}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              {Object.entries(formData).filter(([_, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-vault-border/30">
                  <span className="text-xs text-vault-text-muted uppercase tracking-wider">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-xs text-vault-text font-medium truncate max-w-[60%] text-right">
                    {['password', 'cvv'].includes(k) ? '•••••••' : v}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft size={14} /> Edit
              </Button>
              <Button onClick={handleSave} icon={<Check size={16} />} className="flex-1">
                Save to Vault
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

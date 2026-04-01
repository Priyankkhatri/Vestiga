import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Edit, Trash2, ExternalLink, Eye, EyeOff, Clock, Calendar, Tag, Folder, Shield,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { CopyButton } from '../components/ui/CopyButton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getCategoryIcon, getCategoryColor, getCategoryBg, getCategoryLabel } from '../components/vault/VaultHelpers';
import { PasswordItem, AddressItem, CardItem, NoteItem, DocumentItem, VaultItem } from '../types/vault';

function FieldRow({ label, value, sensitive = false, copyable = true }: {
  label: string; value: string; sensitive?: boolean; copyable?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const displayValue = sensitive && !revealed ? '•'.repeat(Math.min(value.length, 16)) : value;

  return (
    <div className="flex items-center justify-between py-3 border-b border-vault-border/50 group">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-vault-text-muted uppercase tracking-wider mb-1 font-medium">{label}</p>
        <p className={`text-sm text-vault-text truncate ${sensitive ? 'font-mono' : ''}`}>{displayValue}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {sensitive && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="p-1.5 rounded-lg text-vault-text-muted hover:text-vault-text transition-colors cursor-pointer"
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {copyable && <CopyButton value={value} size={14} />}
      </div>
    </div>
  );
}

function PasswordStrengthBar({ strength }: { strength: string }) {
  const levels = { weak: 25, fair: 50, strong: 75, excellent: 100 };
  const colors = { weak: 'bg-vault-danger', fair: 'bg-vault-warning', strong: 'bg-vault-info', excellent: 'bg-vault-success' };
  const badgeVariants = { weak: 'danger' as const, fair: 'warning' as const, strong: 'info' as const, excellent: 'success' as const };
  const pct = levels[strength as keyof typeof levels] || 0;
  const color = colors[strength as keyof typeof colors] || 'bg-vault-text-muted';

  return (
    <div className="py-3 border-b border-vault-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-vault-text-muted uppercase tracking-wider font-medium">Password Strength</p>
        <Badge variant={badgeVariants[strength as keyof typeof badgeVariants] || 'default'}>{strength}</Badge>
      </div>
      <div className="h-1.5 bg-vault-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function renderPasswordFields(item: PasswordItem) {
  return (
    <>
      <FieldRow label="Website" value={item.website} />
      <FieldRow label="URL" value={item.url} />
      <FieldRow label="Username" value={item.username} />
      <FieldRow label="Password" value={item.password} sensitive />
      <PasswordStrengthBar strength={item.strength} />
    </>
  );
}

function renderAddressFields(item: AddressItem) {
  return (
    <>
      <FieldRow label="Full Name" value={item.fullName} />
      <FieldRow label="Phone" value={item.phone} />
      <FieldRow label="Address Line 1" value={item.addressLine1} />
      {item.addressLine2 && <FieldRow label="Address Line 2" value={item.addressLine2} />}
      <FieldRow label="City" value={item.city} />
      <FieldRow label="State" value={item.state} />
      <FieldRow label="Country" value={item.country} />
      <FieldRow label="ZIP Code" value={item.zipCode} />
    </>
  );
}

function renderCardFields(item: CardItem) {
  return (
    <>
      <FieldRow label="Card Name" value={item.cardName} />
      <FieldRow label="Cardholder" value={item.cardholderName} />
      <FieldRow label="Card Number" value={item.number} sensitive />
      <FieldRow label="Expiry" value={item.expiry} />
      <FieldRow label="CVV" value={item.cvv} sensitive />
      {item.billingAddress && <FieldRow label="Billing Address" value={item.billingAddress} />}
    </>
  );
}

function renderNoteFields(item: NoteItem) {
  return (
    <div className="py-3 border-b border-vault-border/50">
      <p className="text-[10px] text-vault-text-muted uppercase tracking-wider mb-2 font-medium">Content</p>
      <div className="p-4 bg-vault-surface-2 rounded-xl border border-vault-border">
        <pre className="text-sm text-vault-text whitespace-pre-wrap font-sans leading-relaxed">{item.content}</pre>
      </div>
    </div>
  );
}

function renderDocumentFields(item: DocumentItem) {
  return (
    <>
      <FieldRow label="File Name" value={item.fileName} />
      <FieldRow label="File Size" value={item.fileSize} />
      <FieldRow label="File Type" value={item.fileType} />
      <div className="py-3 border-b border-vault-border/50">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-vault-success" />
          <span className="text-xs text-vault-text-muted">{item.encrypted ? 'Encrypted at rest' : 'Not encrypted'}</span>
        </div>
      </div>
    </>
  );
}

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, toggleFavorite, deleteItem } = useVault();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const item = items.find(i => i.id === id);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-vault-text-muted">Item not found</p>
      </div>
    );
  }

  const renderFields = () => {
    switch (item.type) {
      case 'password': return renderPasswordFields(item as PasswordItem);
      case 'address': return renderAddressFields(item as AddressItem);
      case 'card': return renderCardFields(item as CardItem);
      case 'note': return renderNoteFields(item as NoteItem);
      case 'document': return renderDocumentFields(item as DocumentItem);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto p-6"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-vault-text-muted hover:text-vault-text transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${getCategoryBg(item.type)} ${getCategoryColor(item.type)}`}>
          {getCategoryIcon(item.type, 24)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-vault-text truncate">{item.title}</h2>
            <button
              onClick={() => toggleFavorite(item.id)}
              className="cursor-pointer"
            >
              <Star size={18} className={item.favorite ? 'text-vault-gold fill-vault-gold' : 'text-vault-text-muted hover:text-vault-gold'} />
            </button>
          </div>
          <Badge variant="gold">{getCategoryLabel(item.type)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Edit size={14} />}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
        </div>
      </div>

      {/* URL action for passwords */}
      {item.type === 'password' && (
        <a
          href={(item as PasswordItem).url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-vault-surface border border-vault-border text-sm text-vault-info hover:bg-vault-surface-2 transition-colors"
        >
          <ExternalLink size={14} />
          Open {(item as PasswordItem).website}
          <span className="ml-auto text-xs text-vault-text-muted">↗</span>
        </a>
      )}

      {/* Field rows */}
      <div className="vault-card p-5 mb-6">
        {renderFields()}

        {/* Notes */}
        {item.notes && item.type !== 'note' && (
          <div className="py-3 border-b border-vault-border/50">
            <p className="text-[10px] text-vault-text-muted uppercase tracking-wider mb-1 font-medium">Notes</p>
            <p className="text-sm text-vault-text-secondary">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="vault-card p-5">
        <h3 className="text-xs font-semibold text-vault-text-secondary uppercase tracking-wider mb-3">Metadata</h3>
        <div className="space-y-2.5">
          {item.folder && (
            <div className="flex items-center gap-2 text-xs text-vault-text-muted">
              <Folder size={13} /> <span>{item.folder}</span>
            </div>
          )}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-vault-text-muted">
              <Tag size={13} />
              <div className="flex gap-1 flex-wrap">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-vault-surface-3 rounded-md text-vault-text-secondary">{tag}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-vault-text-muted">
            <Calendar size={13} /> Created: {new Date(item.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-xs text-vault-text-muted">
            <Clock size={13} /> Modified: {new Date(item.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deleteItem(item.id); navigate(-1); }}
        title="Delete Item"
        description={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </motion.div>
  );
}

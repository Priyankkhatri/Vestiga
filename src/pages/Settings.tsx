import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Download, Upload, Key, Clock, Eye, Keyboard, Palette, AlertTriangle,
  Trash2, RotateCcw, Lock, Monitor, Fingerprint, Bell, Moon, Zap,
} from 'lucide-react';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useVault } from '../context/VaultContext';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}

function SettingsSection({ title, icon, children, danger }: SettingsSectionProps) {
  return (
    <div className={`vault-card p-5 ${danger ? 'border-vault-danger/20' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${danger ? 'text-vault-danger' : 'text-vault-text-secondary'}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Settings() {
  const { addToast } = useVault();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Mock settings state
  const [settings, setSettings] = useState({
    biometric: false,
    autoLock: true,
    lockOnClose: true,
    clipboardClear: true,
    autofill: true,
    autofillOverlay: true,
    multiAccount: true,
    darkMode: true,
    compactMode: false,
    motionReduce: false,
    tooltips: true,
    showHidden: false,
    backupReminder: true,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-2xl space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-vault-text">Settings</h2>
        <p className="text-xs text-vault-text-muted mt-0.5">Manage your vault preferences and security</p>
      </div>

      {/* Security */}
      <SettingsSection title="Security" icon={<Shield size={14} className="text-vault-gold" />}>
        <Button variant="secondary" size="sm" icon={<Key size={14} />} className="w-full justify-start">
          Change Master Password
        </Button>
        <Toggle checked={settings.biometric} onChange={() => toggle('biometric')} label="Biometric Unlock" description="Use fingerprint or face recognition" />
        <Toggle checked={settings.autoLock} onChange={() => toggle('autoLock')} label="Auto-lock" description="Lock vault after 5 minutes of inactivity" />
        <Toggle checked={settings.lockOnClose} onChange={() => toggle('lockOnClose')} label="Lock on Close" description="Lock vault when browser is closed" />
        <Toggle checked={settings.clipboardClear} onChange={() => toggle('clipboardClear')} label="Clear Clipboard" description="Auto-clear clipboard after 30 seconds" />
      </SettingsSection>

      {/* Backup & Export */}
      <SettingsSection title="Backup & Export" icon={<Download size={14} className="text-vault-info" />}>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />} className="flex-1"
            onClick={() => addToast('Vault exported successfully', 'success')}>
            Export Vault
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} className="flex-1">
            Import Backup
          </Button>
        </div>
        <Button variant="secondary" size="sm" icon={<Key size={14} />} className="w-full justify-start">
          View Recovery Key
        </Button>
        <Toggle checked={settings.backupReminder} onChange={() => toggle('backupReminder')} label="Backup Reminder" description="Remind to backup vault monthly" />
      </SettingsSection>

      {/* Autofill */}
      <SettingsSection title="Autofill" icon={<Zap size={14} className="text-vault-success" />}>
        <Toggle checked={settings.autofill} onChange={() => toggle('autofill')} label="Enable Autofill" description="Automatically fill login forms" />
        <Toggle checked={settings.autofillOverlay} onChange={() => toggle('autofillOverlay')} label="Autofill Overlay" description="Show suggestion overlay on form fields" />
        <Toggle checked={settings.multiAccount} onChange={() => toggle('multiAccount')} label="Multi-account Suggestions" description="Show all matching accounts for a site" />
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection title="Preferences" icon={<Monitor size={14} className="text-vault-text-secondary" />}>
        <Toggle checked={settings.showHidden} onChange={() => toggle('showHidden')} label="Show Hidden Fields" description="Always reveal sensitive fields" />
        <Toggle checked={settings.tooltips} onChange={() => toggle('tooltips')} label="Tooltips" description="Show helpful tooltips on hover" />
        <Toggle checked={settings.compactMode} onChange={() => toggle('compactMode')} label="Compact Mode" description="Reduce spacing and element sizes" />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance" icon={<Palette size={14} className="text-purple-400" />}>
        <Toggle checked={settings.darkMode} onChange={() => toggle('darkMode')} label="Dark Mode" description="Dark theme (default)" />
        <Toggle checked={settings.motionReduce} onChange={() => toggle('motionReduce')} label="Reduce Motion" description="Minimize animations and transitions" />
        <div>
          <p className="text-sm font-medium text-vault-text mb-2">Accent Color</p>
          <div className="flex gap-2">
            {['#d4a843', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#f59e0b'].map(color => (
              <button
                key={color}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                  color === '#d4a843' ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone" icon={<AlertTriangle size={14} className="text-vault-danger" />} danger>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} className="w-full justify-start"
          onClick={() => setShowDeleteConfirm(true)}>
          Delete Vault
        </Button>
        <Button variant="danger" size="sm" icon={<RotateCcw size={14} />} className="w-full justify-start"
          onClick={() => setShowResetConfirm(true)}>
          Reset All Data
        </Button>
      </SettingsSection>

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => addToast('Vault deleted (demo)', 'info')}
        title="Delete Vault"
        description="This will permanently delete all your vault data. This action cannot be undone."
        confirmLabel="Delete Everything"
        danger
      />
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => addToast('Data reset (demo)', 'info')}
        title="Reset All Data"
        description="This will clear all items, settings, and preferences. Your vault will be empty."
        confirmLabel="Reset"
        danger
      />
    </motion.div>
  );
}

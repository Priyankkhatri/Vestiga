export type VaultCategory = 'password' | 'address' | 'card' | 'note' | 'document';

export interface VaultItemBase {
  id: string;
  type: VaultCategory;
  title: string;
  favorite: boolean;
  tags: string[];
  folder?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordItem extends VaultItemBase {
  type: 'password';
  website: string;
  url: string;
  username: string;
  password: string;
  strength: 'weak' | 'fair' | 'strong' | 'excellent';
}

export interface AddressItem extends VaultItemBase {
  type: 'address';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CardItem extends VaultItemBase {
  type: 'card';
  cardName: string;
  cardholderName: string;
  number: string;
  expiry: string;
  cvv: string;
  billingAddress?: string;
}

export interface NoteItem extends VaultItemBase {
  type: 'note';
  content: string;
  sensitive: boolean;
}

export interface DocumentItem extends VaultItemBase {
  type: 'document';
  fileName: string;
  fileSize: string;
  fileType: string;
  encrypted: boolean;
}

export type VaultItem = PasswordItem | AddressItem | CardItem | NoteItem | DocumentItem;

export interface VaultState {
  isLocked: boolean;
  items: VaultItem[];
  searchQuery: string;
  activeCategory: VaultCategory | 'all';
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface SecurityAuditResult {
  totalItems: number;
  healthScore: number;
  weakPasswords: PasswordItem[];
  reusedPasswords: { password: string; items: PasswordItem[] }[];
  oldPasswords: PasswordItem[];
  missingFields: VaultItem[];
}

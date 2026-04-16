import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { useMasterPassword } from '../../context/MasterPasswordContext';
import {
  EXTENSION_SOURCE,
  EXTENSION_VAULT_REQUEST,
  EXTENSION_VAULT_ADD_REQUEST,
  WEBAPP_SOURCE,
  WEBAPP_VAULT_RESPONSE,
  WEBAPP_VAULT_ADD_RESPONSE,
} from '../../lib/extensionAuthBridge';
import { getPasswordStrengthLabel } from '../../utils/securityUtils';

export function ExtensionVaultBridge() {
  const { user } = useAuth();
  const { items, isLoading, addItem } = useVault();
  const { isUnlocked } = useMasterPassword();
  const latestStateRef = useRef({
    userId: user?.id ?? null,
    items,
    isLoading,
  });

  useEffect(() => {
    latestStateRef.current = {
      userId: user?.id ?? null,
      items,
      isLoading,
    };
  }, [isLoading, items, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      const data = event.data;
      if (
        !data
        || data.source !== EXTENSION_SOURCE
        || typeof data.requestId !== 'string'
      ) {
        return;
      }

      if (data.type === EXTENSION_VAULT_REQUEST) {
      window.postMessage(
        {
          source: WEBAPP_SOURCE,
          type: WEBAPP_VAULT_RESPONSE,
          requestId: data.requestId,
          payload: latestStateRef.current,
        },
        window.location.origin,
      );
        return;
      }

      if (data.type === EXTENSION_VAULT_ADD_REQUEST) {
        const payload = data.payload as any;
        if (!user?.id) {
          window.postMessage(
            { source: WEBAPP_SOURCE, type: WEBAPP_VAULT_ADD_RESPONSE, requestId: data.requestId, payload: { success: false, error: 'Not signed in to Vestiga web app' } },
            window.location.origin,
          );
          return;
        }
        if (!isUnlocked) {
          window.postMessage(
            { source: WEBAPP_SOURCE, type: WEBAPP_VAULT_ADD_RESPONSE, requestId: data.requestId, payload: { success: false, error: 'Vestiga vault is locked. Unlock the web app vault first.' } },
            window.location.origin,
          );
          return;
        }

        const now = new Date().toISOString();
        const url = typeof payload?.url === 'string' ? payload.url : '';
        const title = typeof payload?.title === 'string' ? payload.title : '';
        let website = '';
        try {
          website = url ? new URL(url).hostname.replace(/^www\./, '') : '';
        } catch {
          website = '';
        }

        const password = typeof payload?.password === 'string' ? payload.password : '';
        const username = typeof payload?.username === 'string' ? payload.username : '';

        const item = {
          id: crypto.randomUUID(),
          type: 'password',
          title: title || website || 'Saved login',
          favorite: false,
          tags: [],
          folder: '',
          notes: '',
          createdAt: now,
          updatedAt: now,
          website,
          url,
          username,
          password,
          strength: getPasswordStrengthLabel(password),
        } as any;

        addItem(item)
          .then(() => {
            window.postMessage(
              { source: WEBAPP_SOURCE, type: WEBAPP_VAULT_ADD_RESPONSE, requestId: data.requestId, payload: { success: true } },
              window.location.origin,
            );
          })
          .catch((err) => {
            window.postMessage(
              { source: WEBAPP_SOURCE, type: WEBAPP_VAULT_ADD_RESPONSE, requestId: data.requestId, payload: { success: false, error: err?.message || 'Save failed' } },
              window.location.origin,
            );
          });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addItem, isUnlocked, user?.id]);

  return null;
}

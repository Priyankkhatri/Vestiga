import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import {
  EXTENSION_SOURCE,
  EXTENSION_VAULT_REQUEST,
  WEBAPP_SOURCE,
  WEBAPP_VAULT_RESPONSE,
} from '../../lib/extensionAuthBridge';

export function ExtensionVaultBridge() {
  const { user } = useAuth();
  const { items, isLoading } = useVault();
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
        || data.type !== EXTENSION_VAULT_REQUEST
        || typeof data.requestId !== 'string'
      ) {
        return;
      }

      window.postMessage(
        {
          source: WEBAPP_SOURCE,
          type: WEBAPP_VAULT_RESPONSE,
          requestId: data.requestId,
          payload: latestStateRef.current,
        },
        window.location.origin,
      );
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}

import type { Session } from '@supabase/supabase-js';

export const EXTENSION_AUTH_REQUEST = 'VESTIGA_AUTH_SESSION_REQUEST';
export const WEBAPP_AUTH_RESPONSE = 'VESTIGA_AUTH_SESSION_RESPONSE';
export const WEBAPP_AUTH_CHANGED = 'VESTIGA_AUTH_SESSION_CHANGED';

const EXTENSION_SOURCE = 'vestiga-extension';
const WEBAPP_SOURCE = 'vestiga-webapp';

export interface ExtensionSessionPayload {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string | null;
  };
}

function serializeSession(session: Session | null): ExtensionSessionPayload | null {
  if (!session?.access_token || !session.refresh_token || !session.user?.id) {
    return null;
  }

  const expiresAt = session.expires_at
    ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 0);

  if (!expiresAt) {
    return null;
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  };
}

export function registerExtensionAuthBridge(
  getSession: () => Promise<Session | null>,
) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleMessage = async (event: MessageEvent) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data;
    if (
      !data
      || data.source !== EXTENSION_SOURCE
      || data.type !== EXTENSION_AUTH_REQUEST
      || typeof data.requestId !== 'string'
    ) {
      return;
    }

    let session: ExtensionSessionPayload | null = null;

    try {
      session = serializeSession(await getSession());
    } catch (error) {
      console.error('[ExtensionBridge] Failed to resolve session:', error);
    }

    window.postMessage(
      {
        source: WEBAPP_SOURCE,
        type: WEBAPP_AUTH_RESPONSE,
        requestId: data.requestId,
        session,
      },
      window.location.origin,
    );
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}

export function broadcastSessionToExtension(session: Session | null) {
  if (typeof window === 'undefined') {
    return;
  }

  window.postMessage(
    {
      source: WEBAPP_SOURCE,
      type: WEBAPP_AUTH_CHANGED,
      session: serializeSession(session),
    },
    window.location.origin,
  );
}

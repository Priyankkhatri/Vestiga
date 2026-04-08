import { api } from './apiClient';

interface CreateSubscriptionData {
  keyId: string;
  subscriptionId: string;
}

interface CreateSubscriptionResult {
  success: boolean;
  data?: CreateSubscriptionData;
  error?: string;
  status?: number;
  alreadyPro?: boolean;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

interface StartProCheckoutOptions {
  email?: string | null;
  onSuccess?: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

export async function startProCheckout(options: StartProCheckoutOptions = {}) {
  if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
    throw new Error('Razorpay checkout failed to load. Please refresh and try again.');
  }

  const result = await api.post<CreateSubscriptionData>('/payments/create-subscription') as CreateSubscriptionResult;

  if (result.alreadyPro) {
    return { alreadyPro: true as const };
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to start checkout. Please try again.');
  }

  if (!result.data?.keyId || !result.data.subscriptionId) {
    throw new Error('Payment setup is incomplete. Please try again.');
  }

  const checkout = new window.Razorpay({
    key: result.data.keyId,
    subscription_id: result.data.subscriptionId,
    name: 'Vestiga Pro',
    description: 'Monthly Subscription',
    prefill: options.email ? { email: options.email } : undefined,
    theme: { color: '#0d9488' },
    handler: async (response) => {
      await options.onSuccess?.(response);
    },
  });

  checkout.open();

  return { alreadyPro: false as const };
}

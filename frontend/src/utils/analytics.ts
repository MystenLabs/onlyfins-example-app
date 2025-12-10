declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        callback?: () => void;
        props?: Record<string, string | number>;
        revenue?: {
          amount: number;
          currency?: string;
        };
      }
    ) => void;
  }
}

export const trackEvent = (
  eventName: string,
  props?: Record<string, string | number>,
  callback?: () => void
) => {
  if (typeof window !== 'undefined' && window.plausible) {
    try {
      window.plausible(eventName, {
        props,
        callback,
      });
    } catch (error) {
      console.error('Failed to track event:', eventName, error);
    }
  }
};

export const trackError = (
  errorType: string,
  errorMessage: string,
  context?: Record<string, string | number>
) => {
  trackEvent(`error_${errorType}`, {
    message: errorMessage.slice(0, 100),
    ...context,
  });
};

export const AnalyticsEvents = {
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  USERNAME_CREATED: 'username_created',
  SESSION_KEY_SIGNED: 'session_key_signed',
  FEED_REFRESHED: 'feed_refreshed',
  POST_LIKED: 'post_liked',
  POST_UNLIKED: 'post_unliked',
  POST_COMMENT_CLICKED: 'post_comment_clicked',
  POST_SHARE_CLICKED: 'post_share_clicked',
  UNLOCK_CLICKED: 'unlock_clicked',
  PAYMENT_MODAL_OPENED: 'payment_modal_opened',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_CANCELLED: 'payment_cancelled',
  CONTENT_UNLOCKED: 'content_unlocked',
  IMAGE_DECRYPTED: 'image_decrypted',
  GITHUB_CLICKED: 'github_clicked',
  DISCORD_CLICKED: 'discord_clicked',
} as const;

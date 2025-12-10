import { Card, Flex, Text, Button, Box, Spinner } from '@radix-ui/themes';
import { usePayForContent } from '../hooks/usePayForContent';
import { trackEvent, trackError, AnalyticsEvents } from '../utils/analytics';

interface PaymentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  postId: string;
}

export function PaymentPopover({
  isOpen,
  onClose,
  title,
  postId,
}: PaymentPopoverProps) {
  const mutation = usePayForContent();

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    trackEvent(AnalyticsEvents.PAYMENT_CONFIRMED, {
      post_id: postId,
    });
    mutation.mutate(
      { postId },
      {
        onSuccess: (viewerTokenId) => {
          console.log('Access granted! ViewerToken:', viewerTokenId);
          trackEvent(AnalyticsEvents.CONTENT_UNLOCKED, {
            post_id: postId,
            viewer_token_id: viewerTokenId,
          });
          onClose();
          // ViewerTokens query will auto-refetch, paywall will disappear
        },
        onError: (error) => {
          console.error('Access request failed:', error);
          trackError('payment', error instanceof Error ? error.message : 'Failed to unlock content', {
            post_id: postId,
          });
        },
      }
    );
  };

  const handleCancel = () => {
    trackEvent(AnalyticsEvents.PAYMENT_CANCELLED, {
      post_id: postId,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
        onClick={mutation.isPending ? undefined : handleCancel}
      />

      {/* Payment Card */}
      <Card
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          backgroundColor: 'var(--color-panel-solid)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Flex direction="column" gap="4" p="4">
          {/* Title */}
          <Text size="4" weight="bold">
            {title}
          </Text>

          {/* Demo Disclaimer */}
          <Flex direction="column" gap="3" py="2">
            <Text size="3" weight="medium" align="center">
              🆓 Free Demo Access
            </Text>
            <Text size="2" color="gray" align="center" style={{ lineHeight: '1.5' }}>
              For demonstration purposes, this content is free to access.
              In production, creators would set their own fees, and 100% of those
              fees would go directly to the creator.
            </Text>
          </Flex>

          {/* Error State */}
          {mutation.isError && (
            <Flex direction="column" gap="2" py="2">
              <Text size="2" color="red" align="center">
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to unlock content'}
              </Text>
            </Flex>
          )}

          {/* Buttons */}
          <Flex gap="2" justify="end">
            <Button
              variant="soft"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              onClick={handleConfirm}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Spinner size="1" style={{ marginRight: '8px' }} />}
              {mutation.isPending ? 'Processing...' : 'Confirm Access'}
            </Button>
          </Flex>
        </Flex>
    </Card>
    </>
  );
}

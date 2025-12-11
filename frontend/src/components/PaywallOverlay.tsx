import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { PaymentPopover } from './PaymentPopover';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { InfoTooltip } from './InfoTooltip';
import { WEB3_BENEFITS } from '../constants';
import { useToast } from '../providers/ToastProvider';

interface PaywallOverlayProps {
  postId: string;
}

export function PaywallOverlay({ postId }: PaywallOverlayProps) {
  const [showPaymentPopover, setShowPaymentPopover] = useState(false);
  const currentAccount = useCurrentAccount();
  const { showToast } = useToast();

  const handleUnlockClick = () => {
    trackEvent(AnalyticsEvents.UNLOCK_CLICKED, {
      post_id: postId,
    });
    if (!currentAccount) {
      showToast('Please sign in at the top of the page first');
      return;
    }
    trackEvent(AnalyticsEvents.PAYMENT_MODAL_OPENED, {
      post_id: postId,
    });
    setShowPaymentPopover(true);
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <Flex direction="column" gap="3" align="center" style={{ position: 'relative' }}>
        <Box
          style={{
            padding: '16px',
            borderRadius: '50%',
            backgroundColor: 'var(--gray-a3)',
            border: '2px solid var(--gray-a5)',
          }}
        >
          <LockClosedIcon width="32" height="32" />
        </Box>

        <Flex direction="column" gap="1" align="center">
          <Flex align="center" gap="1">
            <Text size="4" weight="bold">
              Premium Image
            </Text>
            <InfoTooltip title={WEB3_BENEFITS.CREATOR_CONTROL.title}>
              {WEB3_BENEFITS.CREATOR_CONTROL.content}
            </InfoTooltip>
          </Flex>
          <Flex align="center" gap="1">
            <Text size="2" color="gray">
              Unlock to view the full image
            </Text>
            <InfoTooltip title={WEB3_BENEFITS.PERMANENT_ACCESS.title}>
              {WEB3_BENEFITS.PERMANENT_ACCESS.content}
            </InfoTooltip>
          </Flex>
          
        </Flex>

        <Button
          size="3"
          variant="solid"
          onClick={handleUnlockClick}
          style={{ cursor: 'pointer' }}
        >
          Unlock Image (Free Demo)
        </Button>

        <PaymentPopover
          isOpen={showPaymentPopover}
          onClose={() => setShowPaymentPopover(false)}
          title="Unlock Image"
          postId={postId}
        />
      </Flex>
    </Box>
  );
}

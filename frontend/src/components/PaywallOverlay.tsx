import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { PaymentPopover } from './PaymentPopover';
import { useState } from 'react';

interface PaywallOverlayProps {
  minPrice: number;
  userBalance: number;
  onUnlock: (amount: number) => void;
}

export function PaywallOverlay({ minPrice, userBalance, onUnlock }: PaywallOverlayProps) {
  const [showPaymentPopover, setShowPaymentPopover] = useState(false);

  const handleUnlockClick = () => {
    setShowPaymentPopover(true);
  };

  const handlePaymentConfirm = (amount: number) => {
    onUnlock(amount);
    setShowPaymentPopover(false);
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
          <Text size="4" weight="bold">
            Premium Content
          </Text>
          <Text size="2" color="gray">
            Unlock this post to view
          </Text>
        </Flex>

        <Button
          size="3"
          variant="solid"
          onClick={handleUnlockClick}
          style={{ cursor: 'pointer' }}
        >
          Unlock for ${minPrice}+
        </Button>

        <PaymentPopover
          isOpen={showPaymentPopover}
          onClose={() => setShowPaymentPopover(false)}
          onConfirm={handlePaymentConfirm}
          minAmount={minPrice}
          maxAmount={50}
          defaultAmount={minPrice}
          title="Unlock Content"
          userBalance={userBalance}
        />
      </Flex>
    </Box>
  );
}

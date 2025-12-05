import { Card, Flex, Text, Button, Slider, Box } from '@radix-ui/themes';
import { useState, useEffect } from 'react';

interface PaymentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
  defaultAmount?: number;
  title: string;
  userBalance: number;
}

export function PaymentPopover({
  isOpen,
  onClose,
  onConfirm,
  minAmount = 1,
  maxAmount = 100,
  defaultAmount,
  title,
  userBalance,
}: PaymentPopoverProps) {
  const [amount, setAmount] = useState<number>(defaultAmount || minAmount);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount || minAmount);
    }
  }, [isOpen, defaultAmount, minAmount]);

  if (!isOpen) {
    return null;
  }

  const hasInsufficientBalance = amount > userBalance;

  const handleConfirm = async () => {
    if (hasInsufficientBalance) return;

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    onConfirm(amount);
    setIsProcessing(false);
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
        onClick={onClose}
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

        {/* Balance Display */}
        <Flex justify="between" align="center">
          <Text size="2" color="gray">
            Your Balance:
          </Text>
          <Text size="3" weight="bold" style={{ color: 'var(--green-9)' }}>
            ${userBalance.toFixed(2)}
          </Text>
        </Flex>

        {/* Amount Display */}
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Amount:
            </Text>
            <Text size="5" weight="bold">
              ${amount.toFixed(2)}
            </Text>
          </Flex>

          {/* Slider */}
          <Slider
            value={[amount]}
            onValueChange={(values) => setAmount(values[0])}
            min={minAmount}
            max={maxAmount}
            step={1}
            disabled={isProcessing}
          />

          <Flex justify="between">
            <Text size="1" color="gray">
              ${minAmount}
            </Text>
            <Text size="1" color="gray">
              ${maxAmount}
            </Text>
          </Flex>
        </Flex>

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <Text size="2" color="red">
            Insufficient balance. You need ${(amount - userBalance).toFixed(2)} more.
          </Text>
        )}

        {/* Buttons */}
        <Flex gap="2" justify="end">
          <Button
            variant="soft"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            onClick={handleConfirm}
            disabled={isProcessing || hasInsufficientBalance}
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </Flex>
      </Flex>
    </Card>
    </>
  );
}

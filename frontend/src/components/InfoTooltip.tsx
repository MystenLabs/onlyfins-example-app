import { Popover, IconButton, Flex, Text, Box } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ReactNode } from 'react';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

interface InfoTooltipProps {
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function InfoTooltip({ title, children, maxWidth = '320px' }: InfoTooltipProps) {
  const handleOpen = () => {
    trackEvent(AnalyticsEvents.INFO_TOOLTIP_OPENED, {
      title: title || 'untitled',
    });
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.5);
            }
          }

          .info-tooltip-icon {
            animation: pulse-glow 2s ease-in-out infinite;
            color: var(--cyan-10);
            transition: all 0.2s ease;
          }

          .info-tooltip-icon:hover {
            animation: none;
            color: var(--cyan-10);
            transform: scale(1.1);
          }
        `}
      </style>
      <Popover.Root onOpenChange={(open) => open && handleOpen()}>
        <Popover.Trigger>
          <IconButton
            size="1"
            variant="ghost"
            className="info-tooltip-icon"
            style={{
              cursor: 'pointer',
            }}
            aria-label="More information"
          >
            <InfoCircledIcon width="24" height="24" />
          </IconButton>
        </Popover.Trigger>
        <Popover.Content
          maxWidth={maxWidth}
          style={{
            backgroundColor: 'var(--color-panel-solid)',
            border: '1px solid var(--cyan-a6)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Flex direction="column" gap="2">
            {title && (
              <Text size="3" weight="bold" style={{ color: 'var(--cyan-11)' }}>
                {title}
              </Text>
            )}
            <Box>
              <Text size="2" style={{ lineHeight: '1.6', color: 'var(--gray-12)' }}>
                {children}
              </Text>
            </Box>
          </Flex>
        </Popover.Content>
      </Popover.Root>
    </>
  );
}

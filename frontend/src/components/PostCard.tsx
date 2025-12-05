import { Card, Flex, Text, Box, IconButton, Separator } from '@radix-ui/themes';
import { ChatBubbleIcon, Share1Icon, HeartIcon } from '@radix-ui/react-icons';
import { AddressDisplay } from './AddressDisplay';
import { formatTimestamp } from '../utils/formatters';
import { useState } from 'react';
import { PaywallOverlay } from './PaywallOverlay';
import { PaymentPopover } from './PaymentPopover';

export interface Post {
  id: string;
  author: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  commentCount?: number;
  tipCount?: number;
  likeCount?: number;
  isPaid?: boolean;
  minPrice?: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [tipCount, setTipCount] = useState(post.tipCount || 0);
  const [userBalance, setUserBalance] = useState(100); // Mock balance
  const [isUnlocked, setIsUnlocked] = useState(!post.isPaid);
  const [showTipPopover, setShowTipPopover] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleComment = () => {
    console.log('Comment clicked for post:', post.id);
    // TODO: Implement comment functionality
  };

  const handleTip = () => {
    setShowTipPopover(true);
  };

  const handleTipConfirm = (amount: number) => {
    setUserBalance(prev => prev - amount);
    setTipCount(prev => prev + 1);
    setShowTipPopover(false);
  };

  const handleUnlock = (amount: number) => {
    setUserBalance(prev => prev - amount);
    setIsUnlocked(true);
  };

  const handleShare = () => {
    console.log('Share clicked for post:', post.id);
    // TODO: Implement share functionality
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* Author and timestamp header */}
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              <AddressDisplay address={post.author} />
            </Text>
            <Text size="1" color="gray">
              {formatTimestamp(post.timestamp)}
            </Text>
          </Flex>
        </Flex>

        {/* Post content area with optional paywall */}
        <Box style={{ position: 'relative', minHeight: post.isPaid && !isUnlocked ? '150px' : 'auto' }}>
          {/* Post text content */}
          {post.text && (
            <Box style={{ filter: post.isPaid && !isUnlocked ? 'blur(8px)' : 'none', pointerEvents: post.isPaid && !isUnlocked ? 'none' : 'auto' }}>
              <Text size="3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {post.text}
              </Text>
            </Box>
          )}

          {/* Optional image */}
          {post.imageUrl && (
            <Box mt={post.text ? '3' : '0'} style={{ filter: post.isPaid && !isUnlocked ? 'blur(20px)' : 'none', pointerEvents: post.isPaid && !isUnlocked ? 'none' : 'auto' }}>
              <img
                src={post.imageUrl}
                alt="Post attachment"
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--gray-a3)',
                }}
              />
            </Box>
          )}

          {/* Paywall overlay */}
          {post.isPaid && !isUnlocked && (
            <PaywallOverlay
              minPrice={post.minPrice || 5}
              userBalance={userBalance}
              onUnlock={handleUnlock}
            />
          )}
        </Box>

        <Separator size="4" />

        {/* Interaction buttons */}
        <Flex gap="4" align="center">
          <Flex align="center" gap="1">
            <IconButton
              size="2"
              variant="ghost"
              onClick={handleLike}
              style={{
                cursor: 'pointer',
                color: isLiked ? 'var(--red-9)' : undefined,
              }}
            >
              <HeartIcon width="18" height="18" />
            </IconButton>
            {likeCount > 0 && (
              <Text size="2" color="gray">
                {likeCount}
              </Text>
            )}
          </Flex>

          <Flex align="center" gap="1">
            <IconButton
              size="2"
              variant="ghost"
              onClick={handleComment}
              style={{ cursor: 'pointer' }}
            >
              <ChatBubbleIcon width="18" height="18" />
            </IconButton>
            {(post.commentCount || 0) > 0 && (
              <Text size="2" color="gray">
                {post.commentCount}
              </Text>
            )}
          </Flex>

          <Box style={{ position: 'relative' }}>
            <Flex align="center" gap="1">
              <IconButton
                size="2"
                variant="ghost"
                onClick={handleTip}
                style={{ cursor: 'pointer' }}
              >
                <Text size="2" weight="bold">$</Text>
              </IconButton>
              {tipCount > 0 && (
                <Text size="2" color="gray">
                  {tipCount}
                </Text>
              )}
            </Flex>

            <PaymentPopover
              isOpen={showTipPopover}
              onClose={() => setShowTipPopover(false)}
              onConfirm={handleTipConfirm}
              minAmount={1}
              maxAmount={100}
              defaultAmount={5}
              title="Send Tip"
              userBalance={userBalance}
            />
          </Box>

          <Box style={{ marginLeft: 'auto' }}>
            <IconButton
              size="2"
              variant="ghost"
              onClick={handleShare}
              style={{ cursor: 'pointer' }}
            >
              <Share1Icon width="18" height="18" />
            </IconButton>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
}

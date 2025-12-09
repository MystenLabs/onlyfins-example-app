import { Card, Flex, Text, Box, IconButton, Separator } from '@radix-ui/themes';
import { ChatBubbleIcon, Share1Icon, HeartIcon } from '@radix-ui/react-icons';
import { AddressDisplay } from './AddressDisplay';
import { formatTimestamp } from '../utils/formatters';
import { useState } from 'react';
import { PaywallOverlay } from './PaywallOverlay';
import { PaymentPopover } from './PaymentPopover';

interface BasePost {
  id: string;
  author: string;
  timestamp: number;

  commentCount?: number;
  tipCount?: number;
  likeCount?: number;
}

export interface LockedPost extends BasePost {
  kind: 'locked';
  encryptedCaption: string;
  encryptedImageUrl: string;
  minPrice: number;
  encryptionId: string;
}

export interface UnlockedPost extends BasePost {
  kind: 'unlocked';
  caption: string;
  imageBytes: string; // or imageUrl, depending on your pipeline
}

export type Post = LockedPost | UnlockedPost;

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [tipCount, setTipCount] = useState(post.tipCount || 0);
  const [userBalance, setUserBalance] = useState(100); // Mock balance (for tips only)
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

  const handleShare = () => {
    console.log('Share clicked for post:', post.id);
    // TODO: Implement share functionality
  };

  const isLocked = post.kind === 'locked';

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
        <Box style={{ position: 'relative', minHeight: isLocked ? '150px' : 'auto' }}>
          {/* Post text content - only render when unlocked */}
          {post.kind === 'unlocked' && post.caption && (
            <Box>
              <Text size="3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {post.caption}
              </Text>
            </Box>
          )}

          {/* Optional image - only render when unlocked */}
          {post.kind === 'unlocked' && post.imageBytes && (
            <Box mt={post.caption ? '3' : '0'}>
              <img
                src={post.imageBytes}
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
          {isLocked && (
            <PaywallOverlay
              postId={post.id}
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

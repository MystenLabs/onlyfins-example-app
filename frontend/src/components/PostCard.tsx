import { Card, Flex, Text, Box, IconButton, Separator, Spinner } from '@radix-ui/themes';
import { ChatBubbleIcon, Share1Icon, HeartIcon } from '@radix-ui/react-icons';
import { AddressDisplay } from './AddressDisplay';
import { formatTimestamp } from '../utils/formatters';
import { PaywallOverlay } from './PaywallOverlay';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { InfoTooltip } from './InfoTooltip';
import { WEB3_BENEFITS } from '../constants';
import { useToast } from '../providers/ToastProvider';

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
  caption: string; // Caption is now public, not encrypted
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
  const { showToast } = useToast();

  const handleLike = () => {
    trackEvent(AnalyticsEvents.POST_LIKED, {
      post_id: post.id,
    });
    showToast('This feature has been left as an exercise to the reader :P');
  };

  const handleComment = () => {
    trackEvent(AnalyticsEvents.POST_COMMENT_CLICKED, {
      post_id: post.id,
    });
    showToast('This feature has been left as an exercise to the reader :P');
  };

  const handleShare = () => {
    trackEvent(AnalyticsEvents.POST_SHARE_CLICKED, {
      post_id: post.id,
    });
    showToast('This feature has been left as an exercise to the reader :P');
  };

  const isLocked = post.kind === 'locked';
  const isDecrypting = post.kind === 'unlocked' && post.imageBytes &&
    (post.imageBytes.includes('Decrypting') || post.imageBytes.includes('⏳'));

  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* Author and timestamp header */}
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="1">
              <Text size="2" weight="bold">
                <AddressDisplay address={post.author} />
              </Text>
              <InfoTooltip title={WEB3_BENEFITS.POST_OWNERSHIP.title}>
                {WEB3_BENEFITS.POST_OWNERSHIP.content}
              </InfoTooltip>
            </Flex>
            <Text size="1" color="gray">
              {formatTimestamp(post.timestamp)}
            </Text>
          </Flex>
        </Flex>

        {/* Post caption - always visible (public) */}
        {post.caption && (
          <Box>
            <Text size="3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.caption}
            </Text>
          </Box>
        )}

        {/* Post image area with optional paywall */}
        <Box style={{ position: 'relative', minHeight: isLocked || isDecrypting ? '200px' : 'auto' }}>
          {/* Image - only render when unlocked and fully decrypted */}
          {post.kind === 'unlocked' && post.imageBytes && !isDecrypting && (
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

          {/* Decryption loading indicator */}
          {isDecrypting && (
            <Box
              mt={post.caption ? '3' : '0'}
              style={{
                width: '100%',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--gray-a2)',
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--gray-a3)',
              }}
            >
              <Flex direction="column" gap="2" align="center">
                <Spinner size="3" />
                <Text size="2" color="gray">
                  Decrypting image...
                </Text>
              </Flex>
            </Box>
          )}

          {/* Paywall overlay - only covers image area */}
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
              style={{ cursor: 'pointer' }}
            >
              <HeartIcon width="18" height="18" />
            </IconButton>
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
          </Flex>

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

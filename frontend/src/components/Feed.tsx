import { Flex, Text, Box, Separator } from '@radix-ui/themes';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PostCard, Post } from './PostCard';
import { POST_ADDRESSES, WEB3_BENEFITS } from '../constants';
import { useViewerTokens } from '../hooks/useViewerTokens';
import { usePostDecryption } from '../hooks/usePostDecryption';
import { transformSuiObjectsToPosts } from '../utils/post-transform';
import { useMemo } from 'react';
import { useSessionKey } from '../providers/SessionKeyProvider';
import { InfoTooltip } from './InfoTooltip';

export function Feed() {
  // Fetch ViewerTokens ONCE for all posts (optimization)
  const { viewerTokens } = useViewerTokens();

  // Get session key for decryption
  const { sessionKey } = useSessionKey();

  // Fetch all posts from Sui using multiGetObjects
  const { data, isPending, isError, error } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: POST_ADDRESSES,
      options: {
        showContent: true,
      },

    },
    {

    }
  );

  // Transform Sui objects into Post format
  // Automatically re-computes when data or viewerTokens change
  const posts: Post[] = useMemo(() => {
    return transformSuiObjectsToPosts(data, viewerTokens);
  }, [data, viewerTokens]);

  // Decrypt posts that user has access to
  const decryptedContent = usePostDecryption(posts, data, sessionKey, viewerTokens);

  // Merge decrypted images into posts (captions are already public)
  const finalPosts: Post[] = useMemo(() => {
    return posts.map((post) => {
      const decrypted = decryptedContent[post.id];
      if (decrypted && post.kind === 'unlocked') {
        return {
          ...post,
          imageBytes: decrypted.imageBytes,
        };
      }
      return post;
    });
  }, [posts, decryptedContent]);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Flex align="center" gap="1">
          <Text size="5" weight="bold">
            Feed
          </Text>
          <InfoTooltip title={WEB3_BENEFITS.CROSS_PLATFORM.title}>
            {WEB3_BENEFITS.CROSS_PLATFORM.content}
          </InfoTooltip>
        </Flex>
        
      </Flex>

      <Separator size="4" />

      {isPending && (
        <Box py="6" style={{ textAlign: 'center' }}>
          <Text size="2" color="gray">
            Loading posts...
          </Text>
        </Box>
      )}

      {isError && (
        <Box py="6" style={{ textAlign: 'center' }}>
          <Text size="2" color="red">
            Error loading posts: {error?.message || 'Unknown error'}
          </Text>
        </Box>
      )}

      {!isPending && !isError && posts.length === 0 && (
        <Box py="6" style={{ textAlign: 'center' }}>
          <Text size="2" color="gray">
            No posts yet. Be the first to post!
          </Text>
        </Box>
      )}

      {!isPending && !isError && finalPosts.length > 0 && (
        <>
          <Flex direction="column" gap="3">
            {finalPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Flex>

          <Separator size="4" />
          <Text size="1" color="gray">
            {finalPosts.length} post{finalPosts.length !== 1 ? 's' : ''} loaded
          </Text>
        </>
      )}
    </Flex>
  );
}

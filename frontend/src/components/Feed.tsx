import { Flex, Text, Box, Button, Separator } from '@radix-ui/themes';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PostCard, Post } from './PostCard';
import { POST_ADDRESSES, WALRUS_AGGREGATOR_URL } from '../constants';

export function Feed() {
  // Fetch all posts from Sui using multiGetObjects
  const { data, isPending, isError, error, refetch } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: POST_ADDRESSES,
      options: {
        showContent: true,
      },
    }
  );

  // Transform Sui objects into Post format
  const posts: Post[] = data?.map((response) => {
    if (!response.data) return null;

    const content = response.data.content;
    if (content?.dataType !== 'moveObject') return null;

    const fields = content.fields as any;

    return {
      id: response.data.objectId,
      author: fields.author,
      text: fields.caption,
      imageUrl: fields.image_blob_id ? `${WALRUS_AGGREGATOR_URL}/${fields.image_blob_id}` : undefined,
      timestamp: Number(fields.created_at),
      likeCount: 0,
      commentCount: 0,
      tipCount: 0,
      isPaid: false,
    };
  }).filter((post): post is Post => post !== null) || [];

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="5" weight="bold">
          Feed
        </Text>
        <Button
          size="2"
          variant="soft"
          onClick={() => refetch()}
          disabled={isPending}
        >
          {isPending ? 'Refreshing...' : 'Refresh'}
        </Button>
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

      {!isPending && !isError && posts.length > 0 && (
        <>
          <Flex direction="column" gap="3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Flex>

          <Separator size="4" />
          <Text size="1" color="gray">
            {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
          </Text>
        </>
      )}
    </Flex>
  );
}

import { useState, useEffect } from 'react';
import { Card, Flex, Text, Box, Button, Separator } from '@radix-ui/themes';
import { PostCard, Post } from './PostCard';

// Mock data generator for demo purposes
const generateMockPosts = (page: number, pageSize: number): Post[] => {
  const posts: Post[] = [];
  const startId = page * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const id = startId + i;
    const hasImage = id % 3 === 0;
    const isPaidImage = hasImage && id % 2 === 0; // Every other post with an image is paid
    const isPaidTextOnly = !hasImage && id % 5 === 0; // Every 5th text-only post is paid
    const isPaidPost = isPaidImage || isPaidTextOnly;

    posts.push({
      id: `post-${id}`,
      author: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
      text: [
        "Just deployed my first smart contract on Sui! The developer experience is amazing. 🚀",
        "GM everyone! What are you building today?",
        "The speed of Sui transactions is mind-blowing. Sub-second finality FTW!",
        "Excited to share my new dApp built on Sui. Check it out!",
        "Learning Move has been such a rewarding experience. The type safety is incredible.",
        "Who else is excited about the future of web3 on Sui?",
        "Just minted my first NFT collection. The gas fees are so low compared to other chains!",
        "Building in public: Day 30 of my Sui journey. Still loving it!",
        "The Sui community is one of the most welcoming I've found in web3.",
        "Pro tip: Use the Sui TypeScript SDK, it makes development so much easier.",
      ][id % 10],
      imageUrl: hasImage ? `https://picsum.photos/seed/${id}/600/400` : undefined,
      timestamp: Date.now() - (id * 3600000), // Each post 1 hour older
      likeCount: Math.floor(Math.random() * 50),
      commentCount: Math.floor(Math.random() * 20),
      tipCount: Math.floor(Math.random() * 10),
      isPaid: isPaidPost,
      minPrice: isPaidPost ? Math.floor(Math.random() * 16) + 5 : undefined, // $5-$20
    });
  }

  return posts;
};

const POSTS_PER_PAGE = 10;
const TOTAL_POSTS = 50; // Simulating 50 total posts

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    loadPosts(0);
  }, []);

  const loadPosts = async (page: number) => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newPosts = generateMockPosts(page, POSTS_PER_PAGE);

    if (page === 0) {
      setPosts(newPosts);
    } else {
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
    }

    setCurrentPage(page);

    // Check if there are more posts
    const totalLoaded = (page + 1) * POSTS_PER_PAGE;
    setHasMore(totalLoaded < TOTAL_POSTS);

    setIsLoading(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(currentPage + 1);
    }
  };

  return (
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            Feed
          </Text>
          <Button
            size="2"
            variant="soft"
            onClick={() => loadPosts(0)}
            disabled={isLoading}
          >
            {isLoading && currentPage === 0 ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Flex>

        <Separator size="4" />

        {posts.length === 0 && !isLoading ? (
          <Box py="6" style={{ textAlign: 'center' }}>
            <Text size="2" color="gray">
              No posts yet. Be the first to post!
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Flex>
        )}

        {isLoading && posts.length === 0 && (
          <Box py="6" style={{ textAlign: 'center' }}>
            <Text size="2" color="gray">
              Loading posts...
            </Text>
          </Box>
        )}

        {hasMore && posts.length > 0 && (
          <Box style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button
              size="3"
              variant="soft"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}

        {posts.length > 0 && (
          <>
            <Separator size="4" />
            <Text size="1" color="gray">
              {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
              {hasMore && ` • ${TOTAL_POSTS - posts.length} more available`}
            </Text>
          </>
        )}
      </Flex>
  );
}

import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { POSTS_PACKAGE_ID } from '../constants';

export interface ViewerToken {
  objectId: string;
  postId: string;  // The post_id field from the token
}

/**
 * Fetches all ViewerTokens owned by the current user.
 * This hook should be called ONCE at a high level (Feed component)
 * and the result can be used by all child PostCard components.
 *
 * This avoids N queries (one per post) and instead does 1 query for all posts.
 */
export function useViewerTokens() {
  const currentAccount = useCurrentAccount();

  const { data, isLoading, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: currentAccount?.address || '',
      filter: {
        StructType: `${POSTS_PACKAGE_ID}::posts::ViewerToken`,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!currentAccount?.address,
      // Cache for 1 minute - will auto-refetch after mutations
      staleTime: 60 * 1000,
    }
  );

  // Parse ViewerTokens into a simpler format
  const viewerTokens: ViewerToken[] = data?.data
    ?.filter((obj) => obj.data?.content?.dataType === 'moveObject')
    .map((obj) => {
      const fields = (obj as any).data!.content!.fields as any;
      return {
        objectId: obj.data!.objectId,
        postId: fields.post_id as string,
      };
    }) ?? [];

  return {
    viewerTokens,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Helper function to check if user has access to a specific post.
 * This is a pure function that doesn't trigger any queries.
 *
 * @param postId - The post ID to check access for
 * @param viewerTokens - Array of ViewerTokens from useViewerTokens()
 * @returns true if user owns a ViewerToken for this post
 */
export function hasAccessToPost(postId: string, viewerTokens: ViewerToken[]): boolean {
  return viewerTokens.some((token) => token.postId === postId);
}

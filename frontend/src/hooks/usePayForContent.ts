import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { POSTS_PACKAGE_ID } from '../constants';
import { useSponsoredTransaction } from './useSponsoredTransaction';

export interface PayForContentParams {
  postId: string;
}

/**
 * Hook to request access to encrypted content using sponsored transactions.
 * Calls the grant_access Move function which:
 * 1. Returns a ViewerToken (no payment required in demo mode)
 * 2. Transfers token to the user
 *
 * After successful access, invalidates ViewerTokens query to trigger refetch.
 */
export function usePayForContent() {
  const { sponsorAndExecuteTransaction } = useSponsoredTransaction();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();

  const payForContent = async (
    params: PayForContentParams,
    options?: {
      onSuccess?: (viewerTokenId: string) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    if (!currentAccount?.address) {
      options?.onError?.(new Error('No wallet connected'));
      return;
    }

    try {
      const tx = new Transaction();

      // Call grant_access function - this RETURNS the ViewerToken (no payment required)
      const [viewerToken] = tx.moveCall({
        target: `${POSTS_PACKAGE_ID}::posts::grant_access`,
        arguments: [
          tx.object(params.postId),  // post: &Post
        ],
      });

      // Transfer the returned ViewerToken to the current user
      tx.transferObjects([viewerToken], currentAccount.address);

      // Execute transaction with sponsorship
      const result = await sponsorAndExecuteTransaction(tx);

      if (!result) {
        throw new Error('Sponsored transaction failed');
      }

      // Wait for transaction to complete
      const txResult = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      // Extract created ViewerToken object ID
      const viewerTokenObj = txResult.objectChanges?.find(
        (change) =>
          change.type === 'created' &&
          change.objectType.includes('::posts::ViewerToken')
      );

      // Invalidate ViewerTokens query to trigger refetch
      // This will cause all PostCards to re-check access
      queryClient.invalidateQueries({
        queryKey: ['getOwnedObjects', { owner: currentAccount.address }]
      });

      if (viewerTokenObj && viewerTokenObj.type === 'created') {
        options?.onSuccess?.(viewerTokenObj.objectId);
      } else {
        options?.onSuccess?.('');  // Success but no object ID found
      }
    } catch (error) {
      console.error('Error requesting access to content:', error);
      options?.onError?.(error as Error);
    }
  };

  return {
    payForContent,
  };
}

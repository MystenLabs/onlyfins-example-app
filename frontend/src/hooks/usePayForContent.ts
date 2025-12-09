import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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

  const mutation = useMutation({
    mutationFn: async (params: PayForContentParams): Promise<string> => {
      if (!currentAccount?.address) {
        throw new Error('No wallet connected');
      }

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

      if (viewerTokenObj && viewerTokenObj.type === 'created') {
        return viewerTokenObj.objectId;
      }

      return '';  // Success but no object ID found
    },
    onSuccess: () => {
      // Invalidate ViewerTokens query to trigger refetch
      // This will cause all PostCards to re-check access
      // Use predicate to match useSuiClientQuery's key structure: [network, method, params]
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[1] === 'getOwnedObjects' &&
          (query.queryKey[2] as any)?.owner === currentAccount?.address,
      });
    },
  });

  return mutation;
}

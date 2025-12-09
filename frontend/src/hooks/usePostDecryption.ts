import { useState, useEffect } from 'react';
import { SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, fromHEX } from '@mysten/sui/utils';
import { SuiObjectResponse } from '@mysten/sui/client';
import { Post } from '../components/PostCard';
import { ViewerToken } from './useViewerTokens';
import { createSealClient, suiClient } from '../lib/seal-client';
import { fetchFromWalrus } from '../utils/walrus-fetch';
import { POSTS_PACKAGE_ID, WALRUS_AGGREGATOR_URL } from '../constants';

interface DecryptedContent {
  caption: string;
  imageBytes: string;
  isDecrypting?: boolean;
}

/**
 * Automatically decrypts posts when user has access (ViewerToken) and session key.
 *
 * @param posts - Transformed posts from transformSuiObjectsToPosts
 * @param rawSuiData - Raw blockchain data (needed for encrypted caption bytes)
 * @param sessionKey - Seal session key for decryption
 * @param viewerTokens - User's ViewerTokens for access control
 * @returns Record of decrypted content by post ID
 */
export function usePostDecryption(
  posts: Post[],
  rawSuiData: SuiObjectResponse[] | undefined,
  sessionKey: SessionKey | null,
  viewerTokens: ViewerToken[]
): Record<string, DecryptedContent> {
  const [decryptedContent, setDecryptedContent] = useState<Record<string, DecryptedContent>>({});
  const [decryptingPosts, setDecryptingPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionKey || !rawSuiData) return;

    // Filter posts that need decryption (unlocked + has encryptionId)
    const postsToDecrypt = posts.filter(
      (p) => p.kind === 'unlocked' && 'encryptionId' in p && p.encryptionId
    );

    if (postsToDecrypt.length === 0) return;

    // Initialize Seal client
    const sealClient = createSealClient();

    // Decrypt each post
    postsToDecrypt.forEach(async (post) => {
      // Skip if already decrypted or currently decrypting
      if (decryptedContent[post.id] || decryptingPosts.has(post.id)) {
        return;
      }

      // Mark as decrypting
      setDecryptingPosts((prev) => new Set(prev).add(post.id));
      setDecryptedContent((prev) => ({
        ...prev,
        [post.id]: {
          caption: '⏳ Decrypting caption...',
          imageBytes: '',
          isDecrypting: true,
        },
      }));

      try {
        // Find raw blockchain data for this post
        const rawPost = rawSuiData.find((r) => r.data?.objectId === post.id);
        if (!rawPost?.data?.content || rawPost.data.content.dataType !== 'moveObject') {
          throw new Error('Post data not found');
        }

        const fields = rawPost.data.content.fields as any;
        const encryptionId = (post as any).encryptionId;
        console.log('post encryptionId', encryptionId)

        // Find ViewerToken for access control
        const viewerToken = viewerTokens.find((t) => t.postId === post.id);
        if (!viewerToken) {
          throw new Error('ViewerToken not found');
        }

        // Build access control transaction
        const tx = new Transaction();
        tx.moveCall({
          target: `${POSTS_PACKAGE_ID}::posts::seal_approve_access`,
          arguments: [
            tx.pure.vector('u8', fromHex(encryptionId)),
            tx.object(post.id), // Post object
            tx.object(viewerToken.objectId), // ViewerToken as proof
          ],
        });

        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

        // This doesn't seem to help
        // await sealClient.fetchKeys({
        //   ids: [encryptionId],
        //   txBytes: txBytes,
        //   sessionKey,
        //   threshold: 1,
        // });

        // 1. Decrypt caption (stored on-chain as encrypted bytes)
        const encryptedCaption = new Uint8Array(fields.caption);
        console.log(`Decrypting caption for post ${post.id}, size: ${encryptedCaption.length} bytes`);

        const decryptedCaptionBytes = await sealClient.decrypt({
          data: encryptedCaption,
          sessionKey,
          txBytes,
          checkShareConsistency: false,
        });

        const decryptedCaption = new TextDecoder().decode(decryptedCaptionBytes);
        console.log(`Caption decrypted: "${decryptedCaption}"`);

        // Update with decrypted caption while image is still decrypting
        setDecryptedContent((prev) => ({
          ...prev,
          [post.id]: {
            caption: decryptedCaption,
            imageBytes: '⏳ Decrypting image...',
            isDecrypting: true,
          },
        }));
        

        // // 2. Decrypt image (stored off-chain in Walrus)
        // await sealClient.fetchKeys({
        //   ids: [encryptionId],
        //   txBytes: txBytes,
        //   sessionKey,
        //   threshold: 1,
        // });

        // const imageBlobId = fields.image_blob_id;
        // const walrusUrl = `${WALRUS_AGGREGATOR_URL}/${imageBlobId}`;
        // console.log(`Fetching encrypted image from Walrus: ${walrusUrl}`);

        // const encryptedImage = await fetchFromWalrus(walrusUrl);
        // console.log(`Decrypting image for post ${post.id}, size: ${encryptedImage.length} bytes`);

        // const decryptedImageBytes = await sealClient.decrypt({
        //   data: encryptedImage,
        //   sessionKey,
        //   txBytes,
        //   checkShareConsistency: false,
        // });

        // // Convert decrypted image to blob URL (detect MIME type from byte signature)
        // const imageBytes = new Uint8Array(decryptedImageBytes);
        // const mimeType = imageBytes[0] === 0x89 && imageBytes[1] === 0x50 ? 'image/png' : 'image/jpeg';
        // const imageBlob = new Blob([imageBytes], { type: mimeType });
        // const imageUrl = URL.createObjectURL(imageBlob);
        // console.log(`Image decrypted successfully: ${imageUrl}`);

        // // Update with full decrypted content
        // setDecryptedContent((prev) => ({
        //   ...prev,
        //   [post.id]: {
        //     caption: decryptedCaption,
        //     imageBytes: imageUrl,
        //     isDecrypting: false,
        //   },
        // }));

        // Remove from decrypting set
        setDecryptingPosts((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      } catch (error) {
        console.log('session key', sessionKey.export())
        console.error(`Decryption failed for post ${post.id}:`, error);


        // Show error state
        setDecryptedContent((prev) => ({
          ...prev,
          [post.id]: {
            caption: '❌ Decryption failed',
            imageBytes: '',
            isDecrypting: false,
          },
        }));

        // Remove from decrypting set
        setDecryptingPosts((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      }
    });
  }, [posts, rawSuiData, sessionKey, viewerTokens, decryptedContent, decryptingPosts]);

  return decryptedContent;
}

import { SuiObjectResponse } from '@mysten/sui/client';
import { Post, LockedPost, UnlockedPost } from '../components/PostCard';
import { ViewerToken } from '../hooks/useViewerTokens';
import { WALRUS_AGGREGATOR_URL } from '../constants';

/**
 * Helper: Check if user has access to a specific post
 */
function hasAccessToPost(postId: string, viewerTokens: ViewerToken[]): boolean {
  return viewerTokens.some((token) => token.postId === postId);
}

/**
 * Helper: Convert encryption ID bytes to hex string
 */
function bytesToHex(bytes: number[]): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Transform Sui blockchain objects into typed Post objects.
 *
 * Post rendering logic:
 * 1. Not encrypted → UnlockedPost (public caption + image)
 * 2. Encrypted + no ViewerToken → LockedPost (public caption, locked image)
 * 3. Encrypted + has ViewerToken → UnlockedPost (public caption, needs image decryption)
 *
 * @param suiData - Raw Sui object responses from multiGetObjects
 * @param viewerTokens - User's ViewerTokens (proof of purchase)
 * @returns Typed array of Post objects ready for rendering
 */
export function transformSuiObjectsToPosts(
  suiData: SuiObjectResponse[] | undefined,
  viewerTokens: ViewerToken[]
): Post[] {
  if (!suiData) return [];

  return suiData
    .map((response): Post | null => {
      if (!response.data) return null;

      const content = response.data.content;
      if (content?.dataType !== 'moveObject') return null;

      const fields = content.fields as any;
      const postId = response.data.objectId;

      // Caption is always plaintext now (String field)
      const caption = fields.caption as string;

      // Check if post image is encrypted by checking encryption_id field
      const isEncrypted = fields.encryption_id && Array.isArray(fields.encryption_id) && fields.encryption_id.length > 0;

      // Check if user has access (owns a ViewerToken for this post)
      const userHasAccess = hasAccessToPost(postId, viewerTokens);

      // Base fields shared by all posts
      const baseFields = {
        id: postId,
        author: fields.author,
        timestamp: Number(fields.created_at),
        commentCount: 0,
        tipCount: 0,
        likeCount: 0,
      };

      // Convert fee from MIST to SUI (if fee field exists)
      const feeSui = fields.fee_mist ? Number(fields.fee_mist) / 1_000_000_000 : 0;

      // Case 1: Not encrypted → Public post (caption + image both public)
      if (!isEncrypted) {
        const imageBytes = fields.image_blob_id
          ? `${WALRUS_AGGREGATOR_URL}/${fields.image_blob_id}`
          : '';

        return {
          kind: 'unlocked',
          caption,
          imageBytes,
          ...baseFields,
        } as UnlockedPost;
      }

      // Case 2: Encrypted + No access → Locked post (caption public, image locked)
      if (!userHasAccess) {
        const encryptionId = bytesToHex(fields.encryption_id);

        return {
          kind: 'locked',
          caption, // Caption is now public
          encryptedImageUrl: '', // Placeholder for locked image
          minPrice: feeSui,
          encryptionId,
          ...baseFields,
        } as LockedPost;
      }

      // Case 3: Encrypted + Has access → Unlocked but needs image decryption
      const encryptionId = bytesToHex(fields.encryption_id);

      return {
        kind: 'unlocked',
        caption, // Caption is always public
        imageBytes: '', // Will be filled by usePostDecryption
        encryptionId, // Store for Seal decryption
        ...baseFields,
      } as UnlockedPost;
    })
    .filter((post): post is Post => post !== null);
}
